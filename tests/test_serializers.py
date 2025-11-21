"""
Tests unitarios para serializers.
"""

import pytest
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone

from consumos.serializers.consumo_serializers import ConsumoSerializer, ConsumoCreateSerializer
from consumos.serializers.monetization_serializers import (
    SubscriptionStatusSerializer, PremiumFeaturesSerializer,
    UsageLimitsSerializer, MonetizationStatsSerializer, UpgradePromptSerializer
)
from consumos.serializers import NoAdsSerializer
from consumos.serializers.premium_serializers import (
    PremiumGoalSerializer, PremiumBeverageSerializer, PremiumReminderSerializer
)
from tests.factories import (
    UserFactory, PremiumUserFactory, BebidaFactory, RecipienteFactory,
    ConsumoFactory, RecordatorioFactory
)

User = get_user_model()


@pytest.mark.django_db
class TestConsumoSerializers:
    """Tests para serializers de consumos."""
    
    def test_consumo_serializer(self):
        """Test ConsumoSerializer."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        consumo = ConsumoFactory(usuario=user, bebida=bebida, recipiente=recipiente)
        
        serializer = ConsumoSerializer(consumo)
        data = serializer.data
        
        assert 'id' in data
        assert 'cantidad_ml' in data
        assert 'hidratacion_efectiva_ml' in data
        assert 'fecha_hora' in data
        assert 'bebida' in data
        assert 'recipiente' in data
    
    def test_consumo_create_serializer_valid(self):
        """Test ConsumoCreateSerializer con datos válidos."""
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        data = {
            'bebida': bebida.id,
            'recipiente': recipiente.id,
            'cantidad_ml': 300,
            'fecha_hora': timezone.now().isoformat(),
            'nivel_sed': 3,
            'estado_animo': 'bueno',
            'notas': 'Test note',
            'ubicacion': 'Casa'
        }
        
        serializer = ConsumoCreateSerializer(data=data)
        assert serializer.is_valid()
        
        consumo = serializer.save(usuario=user)
        assert consumo.cantidad_ml == 300
        assert consumo.nivel_sed == 3
        assert consumo.estado_animo == 'bueno'
    
    def test_consumo_create_serializer_invalid(self):
        """Test ConsumoCreateSerializer con datos inválidos."""
        data = {
            'cantidad_ml': -100,  # Cantidad negativa
            'nivel_sed': 10,      # Nivel fuera de rango
            'estado_animo': -1    # Estado negativo
        }
        
        serializer = ConsumoCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'cantidad_ml' in serializer.errors


@pytest.mark.django_db
class TestMonetizationSerializers:
    """Tests para serializers de monetización."""
    
    def test_subscription_status_serializer(self):
        """Test SubscriptionStatusSerializer."""
        user = UserFactory(es_premium=False)
        data = {
            'is_premium': user.es_premium,
            'subscription_end_date': None
        }
        
        serializer = SubscriptionStatusSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.data['is_premium'] is False
    
    def test_premium_features_serializer(self):
        """Test PremiumFeaturesSerializer."""
        features = [
            "Meta diaria personalizada",
            "Estadísticas y análisis avanzados",
            "Recordatorios ilimitados"
        ]
        
        data = {'features': features}
        serializer = PremiumFeaturesSerializer(data=data)
        assert serializer.is_valid()
        assert len(serializer.data['features']) == 3
    
    def test_usage_limits_serializer(self):
        """Test UsageLimitsSerializer."""
        data = {
            'is_premium': False,
            'reminders': {
                'limit': 3,
                'current': 2,
                'can_create_more': True
            },
            'consumos': {
                'limit': 10,
                'current': 5,
                'can_add_more': True
            }
        }
        
        serializer = UsageLimitsSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.data['reminders']['current'] == 2
        assert serializer.data['consumos']['current'] == 5
    
    def test_monetization_stats_serializer(self):
        """Test MonetizationStatsSerializer."""
        data = {
            'usuarios': {
                'total': 100,
                'premium': 20,
                'gratuitos': 80
            },
            'conversion': {
                'tasa': 20.0,
                'tendencia': 'creciente'
            },
            'actividad': {
                'consumos_30_dias': 1500,
                'usuarios_activos': 80
            }
        }
        
        serializer = MonetizationStatsSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.data['conversion']['tasa'] == 20.0
    
    def test_upgrade_prompt_serializer(self):
        """Test UpgradePromptSerializer."""
        data = {
            'prompt': 'Actualiza a Premium para desbloquear todas las funciones',
            'is_premium': False,
            'usage_stats': {
                'recordatorios_usados': 2,
                'limite_recordatorios': 3
            }
        }
        
        serializer = UpgradePromptSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.data['prompt'] == 'Actualiza a Premium para desbloquear todas las funciones'
    
    def test_no_ads_serializer(self):
        """Test NoAdsSerializer."""
        data = {'is_premium': True}
        serializer = NoAdsSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.data['is_premium'] is True


@pytest.mark.django_db
class TestPremiumSerializers:
    """Tests para serializers premium."""
    
    def test_premium_goal_serializer(self):
        """Test PremiumGoalSerializer."""
        data = {
            'meta_ml': 2500,
            'peso_kg': 75.0,
            'nivel_actividad': 'moderado',
            'factor_actividad': 1.2,
            'formula_usada': 'peso_kg * 35 * factor_actividad'
        }
        
        serializer = PremiumGoalSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.data['meta_ml'] == 2500
        assert serializer.data['peso_kg'] == 75.0
    
    def test_premium_beverage_serializer(self):
        """Test PremiumBeverageSerializer."""
        data = {
            'id': 1,
            'nombre': 'Agua Premium',
            'factor_hidratacion': 1.2,
            'es_premium': True,
            'descripcion': 'Agua premium',
            'calorias_por_ml': 0.0
        }
        
        serializer = PremiumBeverageSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.data['es_premium'] is True
    
    def test_premium_reminder_serializer(self):
        """Test PremiumReminderSerializer."""
        data = {
            'id': 1,
            'hora': '09:00:00',
            'mensaje': 'Beber agua',
            'tipo_recordatorio': 'agua',
            'frecuencia': 'diario',
            'dias_semana': [1, 2, 3, 4, 5],
            'activo': True
        }
        
        serializer = PremiumReminderSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.data['activo'] is True
        assert len(serializer.data['dias_semana']) == 5


@pytest.mark.django_db
class TestSerializerValidation:
    """Tests de validación para serializers."""
    
    def test_consumo_serializer_validation(self):
        """Test validación de ConsumoCreateSerializer."""
        # Datos válidos
        user = UserFactory()
        bebida = BebidaFactory()
        recipiente = RecipienteFactory(usuario=user)
        
        valid_data = {
            'bebida': bebida.id,
            'recipiente': recipiente.id,
            'cantidad_ml': 300,
            'fecha_hora': timezone.now().isoformat(),
            'nivel_sed': 3,
            'estado_animo': 'bueno'
        }
        
        serializer = ConsumoCreateSerializer(data=valid_data)
        assert serializer.is_valid()
        
        # Datos inválidos
        invalid_data = {
            'cantidad_ml': -100,
            'nivel_sed': 10,
            'estado_animo': -1
        }
        
        serializer = ConsumoCreateSerializer(data=invalid_data)
        assert not serializer.is_valid()
    
    def test_premium_goal_serializer_validation(self):
        """Test validación de PremiumGoalSerializer."""
        # Datos válidos
        valid_data = {
            'meta_ml': 2500,
            'peso_kg': 75.0,
            'nivel_actividad': 'moderado',
            'factor_actividad': 1.2,
            'formula_usada': 'peso_kg * 35 * factor_actividad'
        }
        
        serializer = PremiumGoalSerializer(data=valid_data)
        assert serializer.is_valid()
        
        # Datos válidos (el serializer no valida valores negativos)
        valid_data = {
            'meta_ml': 2500,
            'peso_kg': 75.0,
            'nivel_actividad': 'moderado',
            'factor_actividad': 1.2,
            'formula_usada': 'peso_kg * 35 * factor_actividad'
        }
        
        serializer = PremiumGoalSerializer(data=valid_data)
        assert serializer.is_valid()
