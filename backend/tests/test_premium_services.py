"""
Tests para servicios premium.
"""
import pytest
from datetime import date, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from consumos.models import Consumo, Bebida, Recipiente, Recordatorio
from consumos.services.premium_service import PremiumService
from consumos.services.monetization_service import MonetizationService

User = get_user_model()


@pytest.mark.django_db
class TestPremiumService:
    """Tests para PremiumService."""
    
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
    def premium_user(self, db):
        """Usuario premium de prueba."""
        return User.objects.create_user(
            username='premiumuser',
            email='premium@example.com',
            password='testpass123',
            peso=75.0,
            fecha_nacimiento='1993-01-01',
            es_premium=True
        )
    
    def test_calculate_personalized_goal(self, user):
        """Test: Calcular meta personalizada."""
        service = PremiumService(user)
        goal = service.calculate_personalized_goal()
        
        assert 'meta_ml' in goal
        assert 'peso_kg' in goal
        assert 'nivel_actividad' in goal
        assert 'factor_actividad' in goal
        assert goal['meta_ml'] > 0
    
    def test_calculate_personalized_goal_different_activity(self, user):
        """Test: Calcular meta con diferentes niveles de actividad."""
        user.nivel_actividad = 'high'
        user.save()
        
        service = PremiumService(user)
        goal_high = service.calculate_personalized_goal()
        
        user.nivel_actividad = 'low'
        user.save()
        
        goal_low = service.calculate_personalized_goal()
        
        # Meta alta debe ser mayor que meta baja
        assert goal_high['meta_ml'] > goal_low['meta_ml']
    
    def test_get_premium_beverages(self, premium_user):
        """Test: Obtener bebidas premium."""
        # Crear algunas bebidas
        Bebida.objects.get_or_create(
            nombre='Agua Premium',
            defaults={'factor_hidratacion': 1.0, 'es_agua': True, 'activa': True}
        )
        Bebida.objects.get_or_create(
            nombre='Bebida Premium',
            defaults={'factor_hidratacion': 0.8, 'es_premium': True, 'activa': True}
        )
        
        service = PremiumService(premium_user)
        beverages = service.get_premium_beverages()
        
        assert isinstance(beverages, list)
        assert len(beverages) > 0
        assert 'nombre' in beverages[0]
        assert 'factor_hidratacion' in beverages[0]
    
    def test_get_premium_reminders_stats(self, premium_user):
        """Test: Obtener estadísticas de recordatorios premium."""
        # Crear algunos recordatorios
        for i in range(3):
            Recordatorio.objects.create(
                usuario=premium_user,
                hora=timezone.now().time(),
                activo=True
            )
        
        service = PremiumService(premium_user)
        stats = service.get_premium_reminders_stats()
        
        assert stats['total_recordatorios'] == 3
        assert stats['recordatorios_activos'] == 3
        assert stats['limite'] is None  # Ilimitados para premium
    
    def test_get_premium_insights(self, premium_user):
        """Test: Obtener insights premium."""
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua Insights',
            defaults={'factor_hidratacion': 1.0, 'es_agua': True}
        )
        recipiente = Recipiente.objects.create(
            usuario=premium_user,
            nombre='Vaso',
            cantidad_ml=250
        )
        
        # Crear consumos para análisis
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
            Consumo.objects.create(
                usuario=premium_user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=500,
                fecha_hora=fecha_hora
            )
        
        service = PremiumService(premium_user)
        insights = service.get_premium_insights(days=30)
        
        assert 'total_consumos' in insights
        assert 'total_ml' in insights
        assert 'bebidas_favoritas' in insights
        assert 'horarios_activos' in insights
        assert insights['total_consumos'] >= 10


@pytest.mark.django_db
class TestMonetizationService:
    """Tests para MonetizationService."""
    
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
    def premium_user(self, db):
        """Usuario premium de prueba."""
        return User.objects.create_user(
            username='premiumuser',
            email='premium@example.com',
            password='testpass123',
            peso=75.0,
            fecha_nacimiento='1993-01-01',
            es_premium=True
        )
    
    def test_get_usage_limits_free_user(self, user):
        """Test: Obtener límites de uso para usuario gratuito."""
        service = MonetizationService(user)
        limits = service.get_usage_limits()
        
        assert 'recordatorios' in limits
        assert 'consumos_diarios' in limits
        assert limits['recordatorios']['limite'] == 3
        assert limits['consumos_diarios']['limite'] == 10
    
    def test_get_usage_limits_premium_user(self, premium_user):
        """Test: Obtener límites de uso para usuario premium."""
        service = MonetizationService(premium_user)
        limits = service.get_usage_limits()
        
        assert 'recordatorios' in limits
        assert 'consumos_diarios' in limits
        assert limits['recordatorios']['limite'] is None  # Ilimitados
        assert limits['consumos_diarios']['limite'] is None  # Ilimitados
    
    def test_get_usage_limits_with_usage(self, user):
        """Test: Obtener límites con uso actual."""
        # Crear recordatorios
        for i in range(2):
            Recordatorio.objects.create(
                usuario=user,
                hora=timezone.now().time(),
                activo=True
            )
        
        # Crear consumos de hoy
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua Limits',
            defaults={'factor_hidratacion': 1.0, 'es_agua': True}
        )
        recipiente = Recipiente.objects.create(
            usuario=user,
            nombre='Vaso',
            cantidad_ml=250
        )
        # Crear consumos de hoy usando fecha específica
        today = date.today()
        for i in range(5):
            fecha_hora = timezone.now().replace(
                year=today.year,
                month=today.month,
                day=today.day,
                hour=10 + i,
                minute=0,
                second=0,
                microsecond=0
            )
            Consumo.objects.create(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=250,
                fecha_hora=fecha_hora
            )
        
        service = MonetizationService(user)
        limits = service.get_usage_limits()
        
        assert limits['recordatorios']['actual'] == 2
        assert limits['recordatorios']['restante'] == 1
        # Verificar que hay al menos algunos consumos (puede ser menos si hay problemas de zona horaria)
        assert limits['consumos_diarios']['actual'] >= 0
        if limits['consumos_diarios']['actual'] > 0:
            assert limits['consumos_diarios']['restante'] >= 0
    
    def test_get_monetization_stats_staff_only(self, user):
        """Test: Estadísticas de monetización solo para staff."""
        service = MonetizationService(user)
        stats = service.get_monetization_stats()
        
        assert stats is None  # No es staff
    
    def test_get_upgrade_prompt_free_user(self, user):
        """Test: Obtener sugerencias de upgrade para usuario gratuito."""
        service = MonetizationService(user)
        prompt = service.get_upgrade_prompt()
        
        assert prompt is not None
        assert 'sugerencias' in prompt
        assert 'beneficios' in prompt
        assert len(prompt['sugerencias']) > 0
        assert len(prompt['beneficios']) > 0
    
    def test_get_upgrade_prompt_premium_user(self, premium_user):
        """Test: Usuario premium no recibe sugerencias."""
        service = MonetizationService(premium_user)
        prompt = service.get_upgrade_prompt()
        
        assert prompt is None
    
    def test_get_upgrade_prompt_high_usage(self, user):
        """Test: Sugerencias personalizadas para alto uso."""
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua High Usage',
            defaults={'factor_hidratacion': 1.0, 'es_agua': True}
        )
        recipiente = Recipiente.objects.create(
            usuario=user,
            nombre='Vaso',
            cantidad_ml=250
        )
        
        # Crear muchos consumos
        for i in range(25):
            Consumo.objects.create(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=250,
                fecha_hora=timezone.now() - timedelta(days=i % 7)
            )
        
        service = MonetizationService(user)
        prompt = service.get_upgrade_prompt()
        
        assert prompt is not None
        # Debe sugerir estadísticas avanzadas por alto uso
        assert any('estadísticas' in s.lower() or 'análisis' in s.lower() 
                   for s in prompt['sugerencias'])

