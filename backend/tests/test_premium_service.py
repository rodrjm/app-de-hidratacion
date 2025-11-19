"""
Tests para servicios premium.
"""
import pytest
from django.contrib.auth import get_user_model
from consumos.models import Consumo, Bebida, Recipiente, Recordatorio
from consumos.services.premium_service import PremiumService
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.django_db
class TestPremiumService:
    """Tests para PremiumService."""
    
    @pytest.fixture
    def premium_user(self, db):
        """Usuario premium de prueba."""
        return User.objects.create_user(
            username='premiumuser',
            email='premium@example.com',
            password='testpass123',
            peso=75.0,
            fecha_nacimiento='1990-01-01',
            es_premium=True
        )
    
    @pytest.fixture
    def bebida(self, db):
        """Bebida de prueba."""
        bebida, _ = Bebida.objects.get_or_create(
            nombre='Agua Premium Service',
            defaults={
                'factor_hidratacion': 1.0,
                'es_agua': True,
                'activa': True
            }
        )
        return bebida
    
    @pytest.fixture
    def recipiente(self, premium_user):
        """Recipiente de prueba."""
        return Recipiente.objects.create(
            usuario=premium_user,
            nombre='Vaso Premium',
            cantidad_ml=250
        )
    
    @pytest.fixture
    def consumos(self, premium_user, bebida, recipiente):
        """Crear consumos de prueba."""
        consumos = []
        for i in range(20):
            fecha = date.today() - timedelta(days=i)
            fecha_hora = timezone.now().replace(
                year=fecha.year,
                month=fecha.month,
                day=fecha.day,
                hour=10 + (i % 12),
                minute=0,
                second=0,
                microsecond=0
            )
            consumo = Consumo.objects.create(
                usuario=premium_user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=250 + (i * 50),
                fecha_hora=fecha_hora
            )
            consumos.append(consumo)
        return consumos
    
    def test_calculate_personalized_goal_basic(self, premium_user):
        """Test: Calcular meta personalizada básica."""
        service = PremiumService(premium_user)
        result = service.calculate_personalized_goal()
        
        assert 'meta_ml' in result
        assert 'peso_kg' in result
        assert 'nivel_actividad' in result
        assert 'factor_actividad' in result
        assert result['peso_kg'] == 75.0
        assert result['meta_ml'] > 0
    
    def test_calculate_personalized_goal_with_activity(self, premium_user):
        """Test: Calcular meta personalizada con nivel de actividad."""
        premium_user.nivel_actividad = 'high'
        premium_user.save()
        
        service = PremiumService(premium_user)
        result = service.calculate_personalized_goal()
        
        assert result['nivel_actividad'] == 'high'
        assert result['factor_actividad'] == 1.4
        assert result['meta_ml'] == int(75.0 * 35 * 1.4)
    
    def test_get_premium_beverages(self, premium_user, bebida):
        """Test: Obtener bebidas premium."""
        service = PremiumService(premium_user)
        beverages = service.get_premium_beverages()
        
        assert isinstance(beverages, list)
        assert len(beverages) > 0
        assert 'id' in beverages[0]
        assert 'nombre' in beverages[0]
        assert 'factor_hidratacion' in beverages[0]
    
    def test_get_premium_reminders_stats(self, premium_user):
        """Test: Obtener estadísticas de recordatorios premium."""
        # Crear algunos recordatorios
        for i in range(3):
            Recordatorio.objects.create(
                usuario=premium_user,
                hora=timezone.now().time(),
                dias_semana=['lunes', 'martes', 'miercoles'],
                activo=(i < 2)
            )
        
        service = PremiumService(premium_user)
        stats = service.get_premium_reminders_stats()
        
        assert stats['total_recordatorios'] == 3
        assert stats['recordatorios_activos'] == 2
        assert stats['limite'] is None  # Ilimitados para premium
        assert stats['restante'] is None
    
    def test_get_premium_insights(self, premium_user, consumos):
        """Test: Obtener insights premium."""
        service = PremiumService(premium_user)
        insights = service.get_premium_insights(days=30)
        
        assert 'total_consumos' in insights
        assert 'total_ml' in insights
        assert 'total_hidratacion_efectiva_ml' in insights
        assert 'periodo_analisis' in insights
        assert 'bebidas_favoritas' in insights
        assert 'horarios_activos' in insights
        assert 'promedio_diario_ml' in insights
        assert insights['total_consumos'] >= 20
    
    def test_get_premium_insights_custom_days(self, premium_user, consumos):
        """Test: Obtener insights premium con días personalizados."""
        service = PremiumService(premium_user)
        insights = service.get_premium_insights(days=7)
        
        assert insights['total_consumos'] >= 0
        assert insights['promedio_diario_ml'] >= 0
    
    def test_get_premium_insights_empty(self, premium_user):
        """Test: Obtener insights premium sin consumos."""
        service = PremiumService(premium_user)
        insights = service.get_premium_insights(days=30)
        
        assert insights['total_consumos'] == 0
        assert insights['total_ml'] == 0
        assert insights['total_hidratacion_efectiva_ml'] == 0
        assert len(insights['bebidas_favoritas']) == 0

