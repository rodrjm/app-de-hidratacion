"""
Tests de vistas (endpoints API).
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from consumos.models import Consumo, Bebida, Recipiente

User = get_user_model()


@pytest.mark.django_db
class TestUserViews:
    """Tests de vistas de usuario."""
    
    def test_user_profile_get(self, authenticated_client, user):
        """Test: Obtener perfil de usuario."""
        response = authenticated_client.get('/api/profile/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
        assert response.data['username'] == user.username
    
    def test_user_profile_update(self, authenticated_client, user):
        """Test: Actualizar perfil de usuario."""
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = authenticated_client.patch('/api/profile/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.first_name == 'Updated'
        assert user.last_name == 'Name'
    
    def test_user_stats(self, authenticated_client):
        """Test: Obtener estadísticas de usuario."""
        response = authenticated_client.get('/api/stats/')
        assert response.status_code == status.HTTP_200_OK
        assert 'usuario' in response.data
        assert 'hidratacion' in response.data
    
    def test_referidos_info(self, authenticated_client, user):
        """Test: Obtener información de referidos."""
        response = authenticated_client.get('/api/referidos/info/')
        assert response.status_code == status.HTTP_200_OK
        assert 'codigo_referido' in response.data
        assert 'referidos_verificados' in response.data
    
    def test_feedback_create(self, authenticated_client):
        """Test: Crear feedback."""
        data = {
            'tipo': 'reporte_error',  # Tipo válido según serializer
            'mensaje': 'Encontré un bug en la aplicación que necesita ser corregido'
        }
        response = authenticated_client.post('/api/feedback/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        # Verificar que se creó el feedback
        assert 'id' in response.data or 'message' in response.data
    
    def test_sugerencia_create_requires_premium(self, authenticated_client):
        """Test: Crear sugerencia requiere premium."""
        data = {
            'tipo': 'bebida',
            'nombre': 'Nueva bebida',
            'descripcion': 'Descripción de la bebida'
        }
        response = authenticated_client.post('/api/sugerencias/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_sugerencia_create_premium(self, authenticated_premium_client):
        """Test: Usuario premium puede crear sugerencia."""
        data = {
            'tipo': 'bebida',
            'nombre': 'Nueva bebida',
            'descripcion': 'Descripción de la bebida'
        }
        response = authenticated_premium_client.post('/api/sugerencias/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestConsumoViews:
    """Tests de vistas de consumos."""
    
    def test_list_consumos(self, authenticated_client, user):
        """Test: Listar consumos."""
        response = authenticated_client.get('/api/consumos/')
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data or isinstance(response.data, list)
    
    def test_create_consumo(self, authenticated_client, user):
        """Test: Crear consumo."""
        # Obtener o crear bebida (evitar duplicados)
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua Test',
            defaults={
                'factor_hidratacion': 1.0,
                'es_agua': True
            }
        )
        recipiente = Recipiente.objects.create(
            usuario=user,
            nombre='Vaso',
            cantidad_ml=250
        )
        
        data = {
            'bebida': bebida.id,
            'recipiente': recipiente.id,
            'cantidad_ml': 250,
            'fecha_hora': '2024-01-01T12:00:00Z'
        }
        response = authenticated_client.post('/api/consumos/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Consumo.objects.filter(usuario=user).exists()
    
    def test_delete_consumo(self, authenticated_client, user):
        """Test: Eliminar consumo."""
        # Obtener o crear bebida (evitar duplicados)
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua Delete Test',
            defaults={
                'factor_hidratacion': 1.0,
                'es_agua': True
            }
        )
        from django.utils import timezone
        consumo = Consumo.objects.create(
            usuario=user,
            bebida=bebida,
            cantidad_ml=250,
            fecha_hora=timezone.now()
        )
        
        response = authenticated_client.delete(f'/api/consumos/{consumo.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Consumo.objects.filter(id=consumo.id).exists()


@pytest.mark.django_db
class TestValidationViews:
    """Tests de vistas de validación."""
    
    def test_check_username_available(self, api_client):
        """Test: Verificar username disponible."""
        data = {'username': 'availableuser123'}
        response = api_client.post('/api/check-username/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is True
    
    def test_check_username_taken(self, api_client, user):
        """Test: Verificar username no disponible."""
        data = {'username': user.username}
        response = api_client.post('/api/check-username/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is False
    
    def test_check_email_available(self, api_client):
        """Test: Verificar email disponible."""
        data = {'email': 'available@example.com'}
        response = api_client.post('/api/check-email/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is True
    
    def test_check_email_taken(self, api_client, user):
        """Test: Verificar email no disponible."""
        data = {'email': user.email}
        response = api_client.post('/api/check-email/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is False

