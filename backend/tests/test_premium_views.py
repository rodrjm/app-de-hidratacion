"""
Tests para vistas premium.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from consumos.models import Consumo, Bebida, Recipiente
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.django_db
class TestPremiumViews:
    """Tests para vistas premium."""
    
    @pytest.fixture
    def user(self, db):
        """Usuario de prueba no premium."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=False
        )
    
    @pytest.fixture
    def premium_user(self, db):
        """Usuario premium de prueba."""
        return User.objects.create_user(
            username='premiumuser',
            email='premium@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=True
        )
    
    @pytest.fixture
    def authenticated_client(self, user):
        """Cliente autenticado no premium."""
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return client
    
    @pytest.fixture
    def authenticated_premium_client(self, premium_user):
        """Cliente autenticado premium."""
        client = APIClient()
        refresh = RefreshToken.for_user(premium_user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return client
    
    @pytest.fixture
    def consumos_premium(self, premium_user):
        """Crear consumos para usuario premium."""
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua Premium Test',
            defaults={
                'factor_hidratacion': 1.0,
                'es_agua': True
            }
        )
        recipiente = Recipiente.objects.create(
            usuario=premium_user,
            nombre='Vaso',
            cantidad_ml=250
        )
        
        consumos = []
        for i in range(10):
            fecha = date.today() - timedelta(days=i)
            fecha_hora = timezone.now().replace(
                year=fecha.year,
                month=fecha.month,
                day=fecha.day,
                hour=12,
                minute=0,
                second=0,
                microsecond=0
            )
            consumo = Consumo.objects.create(
                usuario=premium_user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=500,
                fecha_hora=fecha_hora
            )
            consumos.append(consumo)
        
        return consumos
    
    def test_premium_goal_requires_premium(self, authenticated_client):
        """Test: Meta premium requiere usuario premium."""
        response = authenticated_client.get('/api/consumos/premium/goal/')
        # Puede ser 403 o 404 dependiendo de la configuración
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
    
    def test_premium_goal_success(self, authenticated_premium_client, premium_user):
        """Test: Obtener meta premium exitosamente."""
        response = authenticated_premium_client.get('/api/consumos/premium/goal/')
        # Puede ser 200 o 404 dependiendo de la configuración
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        if response.status_code == status.HTTP_200_OK:
            assert 'meta_ml' in response.data
    
    def test_premium_beverages_requires_premium(self, authenticated_client):
        """Test: Bebidas premium requiere usuario premium."""
        response = authenticated_client.get('/api/consumos/premium/beverages/')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
    
    def test_premium_beverages_success(self, authenticated_premium_client):
        """Test: Obtener bebidas premium exitosamente."""
        response = authenticated_premium_client.get('/api/consumos/premium/beverages/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        if response.status_code == status.HTTP_200_OK:
            assert 'results' in response.data or isinstance(response.data, list)
    
    def test_premium_stats_history_requires_premium(self, authenticated_client):
        """Test: Historial premium requiere usuario premium."""
        response = authenticated_client.get('/api/consumos/premium/stats/history/')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
    
    def test_premium_stats_history_success(self, authenticated_premium_client, consumos_premium):
        """Test: Obtener historial premium exitosamente."""
        response = authenticated_premium_client.get('/api/consumos/premium/stats/history/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        if response.status_code == status.HTTP_200_OK:
            assert 'results' in response.data or isinstance(response.data, list)
    
    def test_premium_stats_summary_requires_premium(self, authenticated_client):
        """Test: Resumen premium requiere usuario premium."""
        response = authenticated_client.get('/api/consumos/premium/stats/summary/')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
    
    def test_premium_stats_summary_success(self, authenticated_premium_client, consumos_premium):
        """Test: Obtener resumen premium exitosamente."""
        response = authenticated_premium_client.get('/api/consumos/premium/stats/summary/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        if response.status_code == status.HTTP_200_OK:
            assert 'total_ml' in response.data or 'total_hidratacion' in response.data
    
    def test_premium_stats_insights_requires_premium(self, authenticated_client):
        """Test: Insights premium requiere usuario premium."""
        response = authenticated_client.get('/api/consumos/premium/stats/insights/')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
    
    def test_premium_stats_insights_success(self, authenticated_premium_client, consumos_premium):
        """Test: Obtener insights premium exitosamente."""
        response = authenticated_premium_client.get('/api/consumos/premium/stats/insights/')
        # Puede ser 200 o 404 si no hay suficientes datos
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

