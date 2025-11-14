"""
Módulo de serializers para la aplicación de consumos.
Organizado por funcionalidad para mejor mantenibilidad.
"""

from .consumo_serializers import (
    ConsumoSerializer, ConsumoCreateSerializer, ConsumoStatsSerializer
)
from .recipiente_serializers import RecipienteSerializer
from .bebida_serializers import BebidaSerializer
from .meta_serializers import MetaDiariaSerializer, MetaFijaSerializer
from .recordatorio_serializers import (
    RecordatorioSerializer, RecordatorioCreateSerializer, RecordatorioStatsSerializer
)
from .monetization_serializers import (
    SubscriptionStatusSerializer, PremiumFeaturesSerializer, UsageLimitsSerializer,
    MonetizationStatsSerializer, UpgradePromptSerializer, NoAdsSerializer
)
from .premium_serializers import (
    PremiumGoalSerializer, PremiumBeverageSerializer, PremiumReminderSerializer,
    PremiumReminderCreateSerializer
)
from .stats_serializers import (
    ConsumoHistorySerializer, ConsumoSummarySerializer, ConsumoDailySummarySerializer,
    ConsumoWeeklySummarySerializer, ConsumoMonthlySummarySerializer, ConsumoTrendSerializer,
    ConsumoInsightsSerializer
)

__all__ = [
    # Serializers básicos
    'ConsumoSerializer', 'ConsumoCreateSerializer', 'ConsumoStatsSerializer',
    'RecipienteSerializer', 'BebidaSerializer', 'MetaDiariaSerializer', 'MetaFijaSerializer',
    'RecordatorioSerializer', 'RecordatorioCreateSerializer', 'RecordatorioStatsSerializer',
    
    # Serializers de monetización
    'SubscriptionStatusSerializer', 'PremiumFeaturesSerializer', 'UsageLimitsSerializer',
    'MonetizationStatsSerializer', 'UpgradePromptSerializer', 'NoAdsSerializer',
    
    # Serializers premium
    'PremiumGoalSerializer', 'PremiumBeverageSerializer', 'PremiumReminderSerializer',
    'PremiumReminderCreateSerializer',
    
    # Serializers de estadísticas
    'ConsumoHistorySerializer', 'ConsumoSummarySerializer', 'ConsumoDailySummarySerializer',
    'ConsumoWeeklySummarySerializer', 'ConsumoMonthlySummarySerializer', 'ConsumoTrendSerializer',
    'ConsumoInsightsSerializer'
]
