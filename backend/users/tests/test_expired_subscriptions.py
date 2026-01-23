"""
Tests para verificar el sistema de degradación automática de usuarios premium expirados.
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.core.management import call_command
from io import StringIO
from users.models import User
from users.serializers import UserSerializer


class ExpiredSubscriptionsTestCase(TestCase):
    """Tests para verificar la desactivación automática de suscripciones expiradas."""
    
    def setUp(self):
        """Configuración inicial para los tests."""
        # Crear un usuario premium con suscripción expirada
        self.expired_user = User.objects.create_user(
            username='expired_user',
            email='expired@test.com',
            password='testpass123',
            es_premium=True,
            plan_type='monthly',
            subscription_end_date=timezone.now().date() - timedelta(days=5),  # Expiró hace 5 días
            preapproval_id='test_preapproval_123',
            auto_renewal=False
        )
        
        # Crear un usuario premium con suscripción activa
        self.active_user = User.objects.create_user(
            username='active_user',
            email='active@test.com',
            password='testpass123',
            es_premium=True,
            plan_type='monthly',
            subscription_end_date=timezone.now().date() + timedelta(days=30),  # Válida por 30 días más
            preapproval_id='test_preapproval_456',
            auto_renewal=True
        )
        
        # Crear un usuario premium lifetime (sin fecha de expiración)
        self.lifetime_user = User.objects.create_user(
            username='lifetime_user',
            email='lifetime@test.com',
            password='testpass123',
            es_premium=True,
            plan_type='lifetime',
            subscription_end_date=None,
            preapproval_id=None,
            auto_renewal=False
        )
    
    def test_management_command_desactiva_usuarios_expirados(self):
        """Verifica que el comando desactiva usuarios con suscripción expirada."""
        # Verificar que el usuario expirado es premium antes de ejecutar el comando
        self.assertTrue(self.expired_user.es_premium)
        self.assertIsNotNone(self.expired_user.preapproval_id)
        
        # Ejecutar el comando
        out = StringIO()
        call_command('check_expired_subscriptions', stdout=out)
        
        # Recargar el usuario desde la base de datos
        self.expired_user.refresh_from_db()
        
        # Verificar que fue desactivado
        self.assertFalse(self.expired_user.es_premium)
        self.assertIsNone(self.expired_user.preapproval_id)
        
        # Verificar que el usuario activo no fue afectado
        self.active_user.refresh_from_db()
        self.assertTrue(self.active_user.es_premium)
        self.assertIsNotNone(self.active_user.preapproval_id)
        
        # Verificar que el usuario lifetime no fue afectado
        self.lifetime_user.refresh_from_db()
        self.assertTrue(self.lifetime_user.es_premium)
    
    def test_management_command_dry_run(self):
        """Verifica que el modo dry-run no hace cambios reales."""
        # Ejecutar el comando en modo dry-run
        out = StringIO()
        call_command('check_expired_subscriptions', '--dry-run', stdout=out)
        
        # Recargar el usuario desde la base de datos
        self.expired_user.refresh_from_db()
        
        # Verificar que NO fue desactivado (dry-run no hace cambios)
        self.assertTrue(self.expired_user.es_premium)
        self.assertIsNotNone(self.expired_user.preapproval_id)
        
        # Verificar que el output contiene información sobre el dry-run
        output = out.getvalue()
        self.assertIn('DRY RUN', output)
        self.assertIn('expired_user', output)
    
    def test_serializer_just_in_time_verification(self):
        """Verifica que el serializer desactiva usuarios expirados just-in-time."""
        # Verificar que el usuario expirado es premium antes de serializar
        self.assertTrue(self.expired_user.es_premium)
        self.assertIsNotNone(self.expired_user.preapproval_id)
        
        # Serializar el usuario (esto debería desactivarlo automáticamente)
        serializer = UserSerializer(self.expired_user)
        data = serializer.data
        
        # Recargar el usuario desde la base de datos
        self.expired_user.refresh_from_db()
        
        # Verificar que fue desactivado automáticamente
        self.assertFalse(self.expired_user.es_premium)
        self.assertIsNone(self.expired_user.preapproval_id)
        
        # Verificar que los datos serializados reflejan el estado desactivado
        self.assertFalse(data['es_premium'])
    
    def test_serializer_no_afecta_usuarios_activos(self):
        """Verifica que el serializer no afecta usuarios con suscripción activa."""
        # Serializar el usuario activo
        serializer = UserSerializer(self.active_user)
        data = serializer.data
        
        # Recargar el usuario desde la base de datos
        self.active_user.refresh_from_db()
        
        # Verificar que sigue siendo premium
        self.assertTrue(self.active_user.es_premium)
        self.assertIsNotNone(self.active_user.preapproval_id)
        
        # Verificar que los datos serializados reflejan el estado activo
        self.assertTrue(data['es_premium'])
    
    def test_serializer_no_afecta_usuarios_lifetime(self):
        """Verifica que el serializer no afecta usuarios lifetime (sin fecha de expiración)."""
        # Serializar el usuario lifetime
        serializer = UserSerializer(self.lifetime_user)
        data = serializer.data
        
        # Recargar el usuario desde la base de datos
        self.lifetime_user.refresh_from_db()
        
        # Verificar que sigue siendo premium
        self.assertTrue(self.lifetime_user.es_premium)
        
        # Verificar que los datos serializados reflejan el estado premium
        self.assertTrue(data['es_premium'])
    
    def test_management_command_no_afecta_usuarios_sin_fecha(self):
        """Verifica que el comando no afecta usuarios sin subscription_end_date."""
        # El usuario lifetime no tiene subscription_end_date
        initial_premium_status = self.lifetime_user.es_premium
        
        # Ejecutar el comando
        out = StringIO()
        call_command('check_expired_subscriptions', stdout=out)
        
        # Recargar el usuario desde la base de datos
        self.lifetime_user.refresh_from_db()
        
        # Verificar que no fue afectado
        self.assertEqual(self.lifetime_user.es_premium, initial_premium_status)
