"""
Tests para permisos y autenticación.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from consumos.permissions import IsPremiumUser, IsOwnerOrPremium, IsPremiumOrReadOnly
from tests.factories import UserFactory, PremiumUserFactory, ConsumoFactory

User = get_user_model()


@pytest.mark.django_db
class TestCustomPermissions:
    """Tests para permisos personalizados."""
    
    def test_is_premium_user_permission(self):
        """Test permiso IsPremiumUser."""
        # Usuario gratuito
        free_user = UserFactory(es_premium=False)
        request = type('Request', (), {'user': free_user})()
        
        permission = IsPremiumUser()
        assert not permission.has_permission(request, None)
        
        # Usuario premium
        premium_user = PremiumUserFactory()
        request = type('Request', (), {'user': premium_user})()
        
        assert permission.has_permission(request, None)
    
    def test_is_owner_or_premium_permission(self):
        """Test permiso IsOwnerOrPremium."""
        free_user = UserFactory(es_premium=False)
        premium_user = PremiumUserFactory()
        other_user = UserFactory()
        
        # Objeto del usuario gratuito
        obj = type('Obj', (), {'usuario': free_user})()
        
        # Usuario propietario (gratuito)
        request = type('Request', (), {'user': free_user})()
        permission = IsOwnerOrPremium()
        assert permission.has_object_permission(request, None, obj)
        
        # Usuario premium (no propietario)
        request = type('Request', (), {'user': premium_user})()
        assert permission.has_object_permission(request, None, obj)
        
        # Usuario gratuito (no propietario)
        request = type('Request', (), {'user': other_user})()
        assert not permission.has_object_permission(request, None, obj)
    
    def test_is_premium_or_read_only_permission(self):
        """Test permiso IsPremiumOrReadOnly."""
        free_user = UserFactory(es_premium=False)
        premium_user = PremiumUserFactory()
        
        permission = IsPremiumOrReadOnly()
        
        # Usuario gratuito - GET permitido
        request = type('Request', (), {
            'user': free_user,
            'method': 'GET'
        })()
        assert permission.has_permission(request, None)
        
        # Usuario gratuito - POST denegado
        request = type('Request', (), {
            'user': free_user,
            'method': 'POST'
        })()
        assert not permission.has_permission(request, None)
        
        # Usuario premium - POST permitido
        request = type('Request', (), {
            'user': premium_user,
            'method': 'POST'
        })()
        assert permission.has_permission(request, None)


@pytest.mark.django_db
class TestAuthenticationFlow:
    """Tests para flujo de autenticación."""
    
    def test_jwt_token_authentication(self, api_client, user):
        """Test autenticación con JWT."""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Sin token
        response = api_client.get('/api/consumos/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Con token válido
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.get('/api/consumos/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_invalid_token_rejected(self, api_client):
        """Test que token inválido es rechazado."""
        api_client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        
        response = api_client.get('/api/consumos/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_expired_token_rejected(self, api_client, user):
        """Test que token expirado es rechazado."""
        from rest_framework_simplejwt.tokens import RefreshToken
        from datetime import timedelta
        from django.utils import timezone
        
        # Crear token con expiración muy corta
        refresh = RefreshToken.for_user(user)
        refresh.access_token.set_exp(from_time=timezone.now() - timedelta(hours=1))
        
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.get('/api/consumos/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserIsolation:
    """Tests para aislamiento de usuarios."""
    
    def test_user_can_only_access_own_consumos(self, api_client):
        """Test que usuario solo puede acceder a sus propios consumos."""
        user1 = UserFactory()
        user2 = UserFactory()
        
        # Crear consumos para cada usuario
        consumo1 = ConsumoFactory(usuario=user1)
        consumo2 = ConsumoFactory(usuario=user2)
        
        # Autenticar como user1
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user1)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Debe poder acceder a su propio consumo
        response = api_client.get(f'/api/consumos/{consumo1.id}/')
        assert response.status_code == status.HTTP_200_OK
        
        # No debe poder acceder al consumo de user2
        response = api_client.get(f'/api/consumos/{consumo2.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_user_can_only_access_own_recipientes(self, api_client):
        """Test que usuario solo puede acceder a sus propios recipientes."""
        user1 = UserFactory()
        user2 = UserFactory()
        
        # Crear recipientes para cada usuario
        from tests.factories import RecipienteFactory
        recipiente1 = RecipienteFactory(usuario=user1)
        recipiente2 = RecipienteFactory(usuario=user2)
        
        # Autenticar como user1
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user1)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Debe poder acceder a su propio recipiente
        response = api_client.get(f'/api/recipientes/{recipiente1.id}/')
        assert response.status_code == status.HTTP_200_OK
        
        # No debe poder acceder al recipiente de user2
        response = api_client.get(f'/api/recipientes/{recipiente2.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_user_can_only_access_own_recordatorios(self, api_client):
        """Test que usuario solo puede acceder a sus propios recordatorios."""
        user1 = UserFactory()
        user2 = UserFactory()
        
        # Crear recordatorios para cada usuario
        from tests.factories import RecordatorioFactory
        recordatorio1 = RecordatorioFactory(usuario=user1)
        recordatorio2 = RecordatorioFactory(usuario=user2)
        
        # Autenticar como user1
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user1)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Debe poder acceder a su propio recordatorio
        response = api_client.get(f'/api/recordatorios/{recordatorio1.id}/')
        assert response.status_code == status.HTTP_200_OK
        
        # No debe poder acceder al recordatorio de user2
        response = api_client.get(f'/api/recordatorios/{recordatorio2.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestPremiumAccessControl:
    """Tests para control de acceso premium."""
    
    def test_premium_endpoints_require_premium_user(self, api_client):
        """Test que endpoints premium requieren usuario premium."""
        free_user = UserFactory(es_premium=False)
        
        # Autenticar usuario gratuito
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(free_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Endpoints premium deben ser denegados
        premium_endpoints = [
            '/api/premium/goal/',
            '/api/premium/beverages/',
            '/api/premium/reminders/',
            '/api/premium/stats/history/',
            '/api/premium/stats/summary/',
            '/api/premium/stats/trends/',
            '/api/premium/stats/insights/'
        ]
        
        for endpoint in premium_endpoints:
            response = api_client.get(endpoint)
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_premium_endpoints_allow_premium_user(self, api_client):
        """Test que endpoints premium permiten usuario premium."""
        premium_user = PremiumUserFactory()
        
        # Autenticar usuario premium
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(premium_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Endpoints premium deben ser permitidos
        premium_endpoints = [
            '/api/premium/goal/',
            '/api/premium/beverages/',
            '/api/premium/reminders/',
            '/api/premium/stats/history/',
            '/api/premium/stats/summary/',
            '/api/premium/stats/trends/',
            '/api/premium/stats/insights/'
        ]
        
        for endpoint in premium_endpoints:
            response = api_client.get(endpoint)
            # Algunos pueden retornar 200 (OK) o 400 (Bad Request) si no hay datos
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
    
    def test_admin_endpoints_require_staff(self, api_client):
        """Test que endpoints de admin requieren usuario staff."""
        regular_user = UserFactory(is_staff=False)
        admin_user = UserFactory(is_staff=True)
        
        # Usuario regular
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(regular_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.get('/api/monetization/stats/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Usuario admin
        refresh = RefreshToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.get('/api/monetization/stats/')
        assert response.status_code == status.HTTP_200_OK
