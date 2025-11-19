"""
Tests para actividades.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from actividades.models import Actividad

User = get_user_model()


@pytest.mark.django_db
class TestActividadesViews:
    """Tests para vistas de actividades."""
    
    @pytest.fixture
    def user(self, db):
        """Usuario de prueba."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=False
        )
    
    @pytest.fixture
    def authenticated_client(self, user):
        """Cliente autenticado."""
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return client
    
    @pytest.fixture
    def actividad(self, user):
        """Actividad de prueba."""
        from django.utils import timezone
        actividad = Actividad(
            usuario=user,
            tipo_actividad='caminata',
            duracion_minutos=30,
            intensidad='media',
            fecha_hora=timezone.now()
        )
        # Calcular PSE antes de guardar
        actividad.pse_calculado = actividad.calcular_pse()
        actividad.save()
        return actividad
    
    def test_list_actividades_requires_auth(self):
        """Test: Listar actividades requiere autenticación."""
        client = APIClient()
        response = client.get('/api/actividades/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_actividades_success(self, authenticated_client, actividad):
        """Test: Listar actividades exitosamente."""
        response = authenticated_client.get('/api/actividades/')
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data or isinstance(response.data, list)
    
    def test_create_actividad_requires_auth(self):
        """Test: Crear actividad requiere autenticación."""
        client = APIClient()
        data = {
            'tipo': 'ejercicio',
            'nombre': 'Correr',
            'duracion_minutos': 30,
            'intensidad': 'alta'
        }
        response = client.post('/api/actividades/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_actividad_success(self, authenticated_client, user):
        """Test: Crear actividad exitosamente."""
        data = {
            'tipo_actividad': 'correr',
            'duracion_minutos': 30,
            'intensidad': 'alta'
        }
        response = authenticated_client.post('/api/actividades/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Actividad.objects.filter(usuario=user, tipo_actividad='correr').exists()
    
    def test_get_actividad_success(self, authenticated_client, actividad):
        """Test: Obtener actividad específica."""
        response = authenticated_client.get(f'/api/actividades/{actividad.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['tipo_actividad'] == 'caminata'
    
    def test_update_actividad_success(self, authenticated_client, actividad):
        """Test: Actualizar actividad."""
        data = {
            'tipo_actividad': 'caminata_rapida',
            'duracion_minutos': 45
        }
        response = authenticated_client.patch(f'/api/actividades/{actividad.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        actividad.refresh_from_db()
        assert actividad.tipo_actividad == 'caminata_rapida'
    
    def test_delete_actividad_success(self, authenticated_client, actividad):
        """Test: Eliminar actividad."""
        actividad_id = actividad.id
        response = authenticated_client.delete(f'/api/actividades/{actividad_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Actividad.objects.filter(id=actividad_id).exists()


@pytest.mark.django_db
class TestActividadesSerializers:
    """Tests para serializers de actividades."""
    
    @pytest.fixture
    def user(self, db):
        """Usuario de prueba."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=False
        )
    
    def test_actividad_serializer_valid(self, user):
        """Test: Serializer válido."""
        from actividades.serializers import ActividadCreateSerializer
        from rest_framework.test import APIRequestFactory
        
        data = {
            'tipo_actividad': 'natacion',
            'duracion_minutos': 60,
            'intensidad': 'alta'
        }
        
        factory = APIRequestFactory()
        request = factory.get('/api/actividades/')
        request.user = user
        
        serializer = ActividadCreateSerializer(data=data, context={'request': request})
        assert serializer.is_valid()
        
        # Asegurar que fecha_nacimiento es un objeto date, no string
        from datetime import date as date_type
        if isinstance(user.fecha_nacimiento, str):
            user.fecha_nacimiento = date_type.fromisoformat(user.fecha_nacimiento)
            user.save()
        
        actividad = serializer.save()
        assert actividad.tipo_actividad == 'natacion'
        assert actividad.duracion_minutos == 60
        assert actividad.pse_calculado > 0
        assert actividad.usuario == user
    
    def test_actividad_serializer_invalid_tipo(self, user):
        """Test: Serializer con tipo inválido."""
        from actividades.serializers import ActividadSerializer
        
        data = {
            'tipo_actividad': 'tipo_invalido',
            'duracion_minutos': 30,
            'intensidad': 'media'
        }
        
        serializer = ActividadSerializer(data=data)
        # Debe ser inválido porque el tipo no está en las opciones
        assert not serializer.is_valid()
        assert 'tipo_actividad' in serializer.errors
    
    def test_actividad_serializer_invalid_intensidad(self, user):
        """Test: Serializer con intensidad inválida."""
        from actividades.serializers import ActividadSerializer
        
        data = {
            'tipo_actividad': 'correr',
            'duracion_minutos': 30,
            'intensidad': 'intensidad_invalida'
        }
        
        serializer = ActividadSerializer(data=data)
        # Debe ser inválido porque la intensidad no está en las opciones
        assert not serializer.is_valid()
        assert 'intensidad' in serializer.errors

