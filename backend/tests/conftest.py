"""
Configuración global y fixtures para tests.
"""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    """Cliente API para tests."""
    return APIClient()


@pytest.fixture
def user(db):
    """Usuario de prueba básico."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        peso=70.0,
        fecha_nacimiento='1998-01-01',
        es_premium=False
    )


@pytest.fixture
def premium_user(db):
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
def authenticated_client(api_client, user):
    """Cliente API autenticado."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def authenticated_premium_client(api_client, premium_user):
    """Cliente API autenticado con usuario premium."""
    refresh = RefreshToken.for_user(premium_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

