"""
Configuración global para tests.
"""

import os
import django
from django.conf import settings

# Configurar Django antes de importar cualquier cosa
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hydrotracker.settings_sqlite')
django.setup()

import pytest
from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api_client():
    """Cliente API para tests."""
    return APIClient()


@pytest.fixture
def client():
    """Cliente HTTP para tests."""
    return Client()


@pytest.fixture
def user():
    """Usuario de prueba."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        peso=70.0,
        edad=25,
        es_premium=False
    )


@pytest.fixture
def premium_user():
    """Usuario premium de prueba."""
    return User.objects.create_user(
        username='premiumuser',
        email='premium@example.com',
        password='testpass123',
        peso=75.0,
        edad=30,
        es_premium=True
    )


@pytest.fixture
def admin_user():
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123'
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """Cliente API autenticado."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def premium_authenticated_client(api_client, premium_user):
    """Cliente API autenticado como usuario premium."""
    refresh = RefreshToken.for_user(premium_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def admin_authenticated_client(api_client, admin_user):
    """Cliente API autenticado como administrador."""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client