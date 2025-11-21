"""
Tests para permisos de consumos.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from consumos.permissions import IsPremiumUser, IsOwnerOrPremium
from consumos.models import Consumo, Bebida, Recipiente
from django.utils import timezone

User = get_user_model()


@pytest.mark.django_db
class TestIsPremiumUser:
    """Tests para permiso IsPremiumUser."""
    
    @pytest.fixture
    def regular_user(self, db):
        """Usuario regular."""
        return User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=False
        )
    
    @pytest.fixture
    def premium_user(self, db):
        """Usuario premium."""
        return User.objects.create_user(
            username='premium',
            email='premium@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=True
        )
    
    @pytest.fixture
    def request_factory(self):
        """Factory para crear requests."""
        return APIRequestFactory()
    
    def test_premium_user_has_permission(self, premium_user, request_factory):
        """Test: Usuario premium tiene permiso."""
        permission = IsPremiumUser()
        request = request_factory.get('/api/premium/stats/')
        request.user = premium_user
        
        assert permission.has_permission(request, None) is True
    
    def test_regular_user_no_permission(self, regular_user, request_factory):
        """Test: Usuario regular no tiene permiso."""
        permission = IsPremiumUser()
        request = request_factory.get('/api/premium/stats/')
        request.user = regular_user
        
        assert permission.has_permission(request, None) is False
    
    def test_anonymous_user_no_permission(self, request_factory):
        """Test: Usuario anónimo no tiene permiso."""
        permission = IsPremiumUser()
        request = request_factory.get('/api/premium/stats/')
        request.user = None
        
        assert permission.has_permission(request, None) is False


@pytest.mark.django_db
class TestIsOwnerOrPremium:
    """Tests para permiso IsOwnerOrPremium."""
    
    @pytest.fixture
    def owner_user(self, db):
        """Usuario propietario."""
        return User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=False
        )
    
    @pytest.fixture
    def other_user(self, db):
        """Otro usuario."""
        return User.objects.create_user(
            username='other',
            email='other@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=False
        )
    
    @pytest.fixture
    def premium_user(self, db):
        """Usuario premium."""
        return User.objects.create_user(
            username='premium',
            email='premium@example.com',
            password='testpass123',
            peso=70.0,
            fecha_nacimiento='1998-01-01',
            es_premium=True
        )
    
    @pytest.fixture
    def consumo(self, owner_user):
        """Consumo de prueba."""
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua Test Permissions',
            defaults={
                'factor_hidratacion': 1.0,
                'es_agua': True
            }
        )
        recipiente = Recipiente.objects.create(
            usuario=owner_user,
            nombre='Vaso',
            cantidad_ml=250
        )
        return Consumo.objects.create(
            usuario=owner_user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=250,
            fecha_hora=timezone.now()
        )
    
    @pytest.fixture
    def request_factory(self):
        """Factory para crear requests."""
        return APIRequestFactory()
    
    def test_owner_has_permission(self, owner_user, consumo, request_factory):
        """Test: Propietario tiene permiso."""
        permission = IsOwnerOrPremium()
        request = request_factory.get(f'/api/consumos/{consumo.id}/')
        request.user = owner_user
        
        assert permission.has_object_permission(request, None, consumo) is True
    
    def test_premium_user_has_permission(self, premium_user, consumo, request_factory):
        """Test: Usuario premium tiene permiso."""
        permission = IsOwnerOrPremium()
        request = request_factory.get(f'/api/consumos/{consumo.id}/')
        request.user = premium_user
        
        assert permission.has_object_permission(request, None, consumo) is True
    
    def test_other_user_no_permission(self, other_user, consumo, request_factory):
        """Test: Otro usuario no tiene permiso."""
        permission = IsOwnerOrPremium()
        request = request_factory.get(f'/api/consumos/{consumo.id}/')
        request.user = other_user
        
        assert permission.has_object_permission(request, None, consumo) is False
    
    def test_anonymous_user_no_permission(self, consumo, request_factory):
        """Test: Usuario anónimo no tiene permiso."""
        permission = IsOwnerOrPremium()
        request = request_factory.get(f'/api/consumos/{consumo.id}/')
        request.user = None
        
        assert permission.has_object_permission(request, None, consumo) is False

