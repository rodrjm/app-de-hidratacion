"""
Tests de integración para API endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import (
    UserFactory, PremiumUserFactory, BebidaFactory, RecipienteFactory,
    ConsumoFactory, RecordatorioFactory
)


@pytest.mark.django_db
class TestAuthenticationAPI:
    """Tests de autenticación para API."""
    
    def test_unauthenticated_access_denied(self, api_client):
        """Test que endpoints protegidos requieren autenticación."""
        # Endpoint que requiere autenticación
        response = api_client.get('/api/consumos/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_authenticated_access_allowed(self, authenticated_client):
        """Test que endpoints funcionan con autenticación."""
        response = authenticated_client.get('/api/consumos/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_premium_endpoint_requires_premium(self, api_client, user):
        """Test que endpoints premium requieren usuario premium."""
        # Autenticar usuario no premium
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.get('/api/premium/goal/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestConsumosAPI:
    """Tests para API de consumos."""
    
    def test_list_consumos(self, authenticated_client, user):
        """Test listar consumos."""
        # Crear algunos consumos
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(3):
            ConsumoFactory(usuario=user, bebida=bebida, recipiente=recipiente)
        
        response = authenticated_client.get('/api/consumos/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_create_consumo(self, authenticated_client, user):
        """Test crear consumo."""
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        data = {
            'bebida': bebida.id,
            'recipiente': recipiente.id,
            'cantidad_ml': 300,
            'nivel_sed': 3,
            'estado_animo': 4,
            'notas': 'Test note',
            'ubicacion': 'Casa'
        }
        
        response = authenticated_client.post('/api/consumos/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['cantidad_ml'] == 300
        assert response.data['nivel_sed'] == 3
    
    def test_get_consumo_detail(self, authenticated_client, user):
        """Test obtener detalle de consumo."""
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        consumo = ConsumoFactory(usuario=user, bebida=bebida, recipiente=recipiente)
        
        response = authenticated_client.get(f'/api/consumos/{consumo.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == consumo.id
        assert response.data['cantidad_ml'] == consumo.cantidad_ml
    
    def test_update_consumo(self, authenticated_client, user):
        """Test actualizar consumo."""
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        consumo = ConsumoFactory(usuario=user, bebida=bebida, recipiente=recipiente)
        
        data = {
            'cantidad_ml': 500,
            'notas': 'Updated note'
        }
        
        response = authenticated_client.patch(f'/api/consumos/{consumo.id}/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['cantidad_ml'] == 500
        assert response.data['notas'] == 'Updated note'
    
    def test_delete_consumo(self, authenticated_client, user):
        """Test eliminar consumo."""
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        consumo = ConsumoFactory(usuario=user, bebida=bebida, recipiente=recipiente)
        
        response = authenticated_client.delete(f'/api/consumos/{consumo.id}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestMonetizationAPI:
    """Tests para API de monetización."""
    
    def test_premium_features_public(self, api_client):
        """Test que endpoint de features es público."""
        response = api_client.get('/api/monetization/features/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'features' in response.data
        assert len(response.data['features']) > 0
    
    def test_subscription_status_authenticated(self, authenticated_client, user):
        """Test estado de suscripción para usuario autenticado."""
        response = authenticated_client.get('/api/monetization/status/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'is_premium' in response.data
        assert response.data['is_premium'] == user.es_premium
    
    def test_usage_limits_free_user(self, authenticated_client, user):
        """Test límites de uso para usuario gratuito."""
        # Crear algunos recordatorios y consumos
        for i in range(2):
            RecordatorioFactory(usuario=user)
        
        for i in range(5):
            ConsumoFactory(usuario=user)
        
        response = authenticated_client.get('/api/monetization/limits/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'recordatorios' in response.data
        assert 'consumos_diarios' in response.data
        assert response.data['recordatorios']['limite'] == 3
        assert response.data['consumos_diarios']['limite'] == 10
    
    def test_usage_limits_premium_user(self, premium_authenticated_client, premium_user):
        """Test límites de uso para usuario premium."""
        # Crear algunos recordatorios y consumos
        for i in range(5):
            RecordatorioFactory(usuario=premium_user)
        
        for i in range(15):
            ConsumoFactory(usuario=premium_user)
        
        response = premium_authenticated_client.get('/api/monetization/limits/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['recordatorios']['limite'] is None
        assert response.data['consumos_diarios']['limite'] is None
    
    def test_monetization_stats_staff_only(self, authenticated_client, user):
        """Test que estadísticas de monetización son solo para staff."""
        response = authenticated_client.get('/api/monetization/stats/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_monetization_stats_admin(self, admin_authenticated_client):
        """Test estadísticas de monetización para admin."""
        response = admin_authenticated_client.get('/api/monetization/stats/')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_usuarios' in response.data
    
    def test_upgrade_prompt_free_user(self, authenticated_client, user):
        """Test sugerencias de upgrade para usuario gratuito."""
        # Crear actividad del usuario
        for i in range(25):
            ConsumoFactory(usuario=user)
        
        response = authenticated_client.get('/api/monetization/upgrade/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'sugerencias' in response.data
        assert 'beneficios' in response.data
    
    def test_no_ads_endpoint(self, authenticated_client, user):
        """Test endpoint de verificación de anuncios."""
        response = authenticated_client.get('/api/monetization/no-ads/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'is_premium' in response.data
        assert response.data['is_premium'] == user.es_premium


@pytest.mark.django_db
class TestPremiumAPI:
    """Tests para API premium."""
    
    def test_premium_goal_requires_premium(self, premium_authenticated_client, premium_user):
        """Test meta personalizada para usuario premium."""
        response = premium_authenticated_client.get('/api/premium/goal/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'meta_ml' in response.data
        assert 'peso_kg' in response.data
        assert 'nivel_actividad' in response.data
    
    def test_premium_goal_denied_free_user(self, authenticated_client, user):
        """Test que meta personalizada es denegada para usuario gratuito."""
        response = authenticated_client.get('/api/premium/goal/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_premium_beverages_requires_premium(self, premium_authenticated_client):
        """Test bebidas premium para usuario premium."""
        # Crear bebidas normales y premium
        BebidaFactory(es_premium=False)
        BebidaFactory(es_premium=True)
        BebidaFactory(es_premium=False)
        
        response = premium_authenticated_client.get('/api/premium/beverages/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        assert any(b['es_premium'] for b in response.data)
    
    def test_premium_beverages_denied_free_user(self, authenticated_client, user):
        """Test que bebidas premium son denegadas para usuario gratuito."""
        response = authenticated_client.get('/api/premium/beverages/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_premium_reminders_requires_premium(self, premium_authenticated_client, premium_user):
        """Test recordatorios premium para usuario premium."""
        # Crear algunos recordatorios
        for i in range(3):
            RecordatorioFactory(usuario=premium_user)
        
        response = premium_authenticated_client.get('/api/premium/reminders/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_premium_reminders_denied_free_user(self, authenticated_client, user):
        """Test que recordatorios premium son denegados para usuario gratuito."""
        response = authenticated_client.get('/api/premium/reminders/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestStatsAPI:
    """Tests para API de estadísticas."""
    
    def test_consumo_history_requires_premium(self, premium_authenticated_client, premium_user):
        """Test historial de consumos para usuario premium."""
        # Crear algunos consumos
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=premium_user)
        
        for i in range(5):
            ConsumoFactory(
                usuario=premium_user,
                bebida=bebida,
                recipiente=recipiente
            )
        
        response = premium_authenticated_client.get('/api/premium/stats/history/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 5
    
    def test_consumo_history_denied_free_user(self, authenticated_client, user):
        """Test que historial es denegado para usuario gratuito."""
        response = authenticated_client.get('/api/premium/stats/history/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_consumo_summary_requires_premium(self, premium_authenticated_client, premium_user):
        """Test resumen de consumos para usuario premium."""
        # Crear algunos consumos
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=premium_user)
        
        for i in range(10):
            ConsumoFactory(
                usuario=premium_user,
                bebida=bebida,
                recipiente=recipiente
            )
        
        response = premium_authenticated_client.get('/api/premium/stats/summary/?period=daily')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'total_ml' in response.data
        assert 'cantidad_consumos' in response.data
    
    def test_consumo_trends_requires_premium(self, premium_authenticated_client, premium_user):
        """Test tendencias de consumos para usuario premium."""
        # Crear consumos para diferentes períodos
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=premium_user)
        
        for i in range(14):
            ConsumoFactory(
                usuario=premium_user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300
            )
        
        response = premium_authenticated_client.get('/api/premium/stats/trends/?period=weekly')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'periodo' in response.data
        assert 'tendencia' in response.data
    
    def test_consumo_insights_requires_premium(self, premium_authenticated_client, premium_user):
        """Test insights de consumos para usuario premium."""
        # Crear consumos para análisis
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=premium_user)
        
        for i in range(20):
            ConsumoFactory(
                usuario=premium_user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300
            )
        
        response = premium_authenticated_client.get('/api/premium/stats/insights/?days=30')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'total_consumos' in response.data
        assert 'total_ml' in response.data
        assert 'insights' in response.data
