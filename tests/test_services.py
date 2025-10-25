"""
Tests unitarios para servicios.
"""

import pytest
from django.utils import timezone
from datetime import timedelta, date

from consumos.services.consumo_service import ConsumoService
from consumos.services.monetization_service import MonetizationService
from consumos.services.stats_service import StatsService
from consumos.services.premium_service import PremiumService
from tests.factories import (
    UserFactory, PremiumUserFactory, BebidaFactory, RecipienteFactory,
    ConsumoFactory, RecordatorioFactory
)


@pytest.mark.django_db
class TestConsumoService:
    """Tests para ConsumoService."""
    
    def test_get_daily_summary(self):
        """Test obtener resumen diario."""
        user = UserFactory()
        # Crear servicio sin decorador para testing
        from consumos.services.consumo_service import ConsumoService
        service = ConsumoService(user)
        
        # Crear consumos para hoy
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        ConsumoFactory(
            usuario=user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=300,
            fecha_hora=timezone.now()
        )
        ConsumoFactory(
            usuario=user,
            bebida=bebida,
            recipiente=recipiente,
            cantidad_ml=200,
            fecha_hora=timezone.now()
        )
        
        summary = service.get_daily_summary()
        
        assert summary['total_ml'] == 500
        assert summary['cantidad_consumos'] == 2
        assert summary['fecha'] == timezone.now().date()
    
    def test_get_weekly_summary(self):
        """Test obtener resumen semanal."""
        user = UserFactory()
        service = ConsumoService(user)
        
        # Crear consumos para la semana
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(3):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        summary = service.get_weekly_summary()
        
        assert summary['total_ml'] == 900
        assert summary['cantidad_consumos'] == 3
    
    def test_get_monthly_summary(self):
        """Test obtener resumen mensual."""
        user = UserFactory()
        service = ConsumoService(user)
        
        # Crear consumos para el mes
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(5):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        summary = service.get_monthly_summary()
        
        assert summary['total_ml'] == 1500
        assert summary['cantidad_consumos'] == 5
    
    def test_get_trends(self):
        """Test obtener tendencias."""
        user = UserFactory()
        service = ConsumoService(user)
        
        # Crear consumos para diferentes períodos
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        # Consumos de la semana pasada
        for i in range(3):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=200,
                fecha_hora=timezone.now() - timedelta(days=7+i)
            )
        
        # Consumos de esta semana
        for i in range(5):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        trends = service.get_trends('weekly')
        
        assert trends['periodo'] == 'weekly'
        assert 'tendencia' in trends
        assert 'cambio_porcentaje' in trends
    
    def test_get_insights(self):
        """Test obtener insights."""
        user = UserFactory()
        service = ConsumoService(user)
        
        # Crear consumos para análisis
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(10):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        insights = service.get_insights(days=30)
        
        assert insights['total_consumos'] == 10
        assert insights['total_ml'] == 3000
        assert 'insights' in insights
        assert 'patrones' in insights
        assert 'recomendaciones' in insights


@pytest.mark.django_db
class TestMonetizationService:
    """Tests para MonetizationService."""
    
    def test_get_usage_limits_free_user(self):
        """Test obtener límites para usuario gratuito."""
        user = UserFactory(es_premium=False)
        service = MonetizationService(user)
        
        # Crear algunos recordatorios y consumos
        for i in range(2):
            RecordatorioFactory(usuario=user)
        
        for i in range(5):
            ConsumoFactory(usuario=user)
        
        limits = service.get_usage_limits()
        
        assert limits['recordatorios']['actual'] == 2
        assert limits['recordatorios']['limite'] == 3
        assert limits['recordatorios']['restante'] == 1
        assert limits['consumos_diarios']['limite'] == 10
    
    def test_get_usage_limits_premium_user(self):
        """Test obtener límites para usuario premium."""
        user = PremiumUserFactory()
        service = MonetizationService(user)
        
        # Crear algunos recordatorios y consumos
        for i in range(5):
            RecordatorioFactory(usuario=user)
        
        for i in range(15):
            ConsumoFactory(usuario=user)
        
        limits = service.get_usage_limits()
        
        assert limits['recordatorios']['limite'] is None
        assert limits['consumos_diarios']['limite'] is None
    
    def test_get_monetization_stats(self):
        """Test obtener estadísticas de monetización."""
        user = UserFactory(is_staff=True)
        service = MonetizationService(user)
        
        # Crear algunos usuarios
        UserFactory(es_premium=False)
        UserFactory(es_premium=False)
        PremiumUserFactory()
        
        stats = service.get_monetization_stats()
        
        assert stats is not None
        assert stats['total_usuarios'] >= 4  # Incluye el usuario staff
        assert stats['usuarios_premium'] >= 1
        assert stats['usuarios_gratuitos'] >= 2
    
    def test_get_upgrade_prompt(self):
        """Test obtener sugerencias de upgrade."""
        user = UserFactory(es_premium=False)
        service = MonetizationService(user)
        
        # Crear actividad del usuario
        for i in range(25):  # Muchos consumos
            ConsumoFactory(usuario=user)
        
        for i in range(3):  # Máximo de recordatorios
            RecordatorioFactory(usuario=user)
        
        prompt = service.get_upgrade_prompt()
        
        assert prompt is not None
        assert 'sugerencias' in prompt
        assert 'beneficios' in prompt
        assert len(prompt['sugerencias']) > 0


@pytest.mark.django_db
class TestStatsService:
    """Tests para StatsService."""
    
    def test_get_daily_stats(self):
        """Test obtener estadísticas diarias."""
        user = UserFactory()
        service = StatsService(user)
        
        # Crear consumos para hoy
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(3):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300
            )
        
        stats = service.get_daily_stats()
        
        assert stats['total_ml'] == 900
        assert stats['cantidad_consumos'] == 3
        assert stats['fecha'] == timezone.now().date()
    
    def test_get_weekly_stats(self):
        """Test obtener estadísticas semanales."""
        user = UserFactory()
        service = StatsService(user)
        
        # Crear consumos para la semana
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(5):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        stats = service.get_weekly_stats()
        
        assert stats['total_ml'] == 1500
        assert stats['cantidad_consumos'] == 5
    
    def test_get_monthly_stats(self):
        """Test obtener estadísticas mensuales."""
        user = UserFactory()
        service = StatsService(user)
        
        # Crear consumos para el mes
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(10):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        stats = service.get_monthly_stats()
        
        assert stats['total_ml'] == 3000
        assert stats['cantidad_consumos'] == 10
    
    def test_get_trends_daily(self):
        """Test obtener tendencias diarias."""
        user = UserFactory()
        service = StatsService(user)
        
        # Crear consumos para diferentes días
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(7):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        trends = service.get_trends('daily')
        
        assert len(trends) == 7
        assert all('total_ml' in trend for trend in trends)
    
    def test_get_trends_weekly(self):
        """Test obtener tendencias semanales."""
        user = UserFactory()
        service = StatsService(user)
        
        # Crear consumos para diferentes semanas
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(14):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        trends = service.get_trends('weekly')
        
        assert len(trends) >= 2
        assert all('total_ml' in trend for trend in trends)


@pytest.mark.django_db
class TestPremiumService:
    """Tests para PremiumService."""
    
    def test_calculate_personalized_goal(self):
        """Test calcular meta personalizada."""
        user = UserFactory(peso=70.0, nivel_actividad='moderado')
        service = PremiumService(user)
        
        goal = service.calculate_personalized_goal()
        
        assert goal['peso_kg'] == 70.0
        assert goal['nivel_actividad'] == 'moderado'
        assert goal['meta_ml'] > 0
        assert 'formula_usada' in goal
    
    def test_get_premium_beverages(self):
        """Test obtener bebidas premium."""
        user = PremiumUserFactory()
        service = PremiumService(user)
        
        # Crear bebidas normales y premium
        BebidaFactory(es_premium=False)
        BebidaFactory(es_premium=True)
        BebidaFactory(es_premium=False)
        
        beverages = service.get_premium_beverages()
        
        assert len(beverages) == 3
        assert any(b['es_premium'] for b in beverages)
        assert any(not b['es_premium'] for b in beverages)
    
    def test_get_premium_reminders_stats(self):
        """Test obtener estadísticas de recordatorios premium."""
        user = PremiumUserFactory()
        service = PremiumService(user)
        
        # Crear recordatorios
        for i in range(5):
            RecordatorioFactory(usuario=user)
        
        for i in range(2):
            RecordatorioFactory(usuario=user, activo=False)
        
        stats = service.get_premium_reminders_stats()
        
        assert stats['total_recordatorios'] == 7
        assert stats['recordatorios_activos'] == 5
        assert stats['limite'] is None
        assert stats['restante'] is None
    
    def test_get_premium_insights(self):
        """Test obtener insights premium."""
        user = PremiumUserFactory()
        service = PremiumService(user)
        
        # Crear consumos para análisis
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        for i in range(15):
            ConsumoFactory(
                usuario=user,
                bebida=bebida,
                recipiente=recipiente,
                cantidad_ml=300,
                fecha_hora=timezone.now() - timedelta(days=i)
            )
        
        insights = service.get_premium_insights(days=30)
        
        assert insights['total_consumos'] == 15
        assert insights['total_ml'] == 4500
        assert 'bebidas_favoritas' in insights
        assert 'horarios_activos' in insights
        assert 'promedio_diario_ml' in insights
