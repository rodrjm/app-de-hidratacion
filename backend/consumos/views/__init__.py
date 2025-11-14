"""
Módulo de vistas para la aplicación de consumos.
Organizado por funcionalidad para mejor mantenibilidad.
"""

from .consumo_views import ConsumoViewSet
from .recipiente_views import RecipienteViewSet
from .bebida_views import BebidaViewSet
from .meta_views import MetaDiariaViewSet, MetaFijaView
from .recordatorio_views import RecordatorioViewSet
from .monetization_views import (
    SubscriptionStatusView, PremiumFeaturesView, UsageLimitsView,
    MonetizationStatsView, UpgradePromptView, NoAdsView
)
from .premium_views import (
    PremiumGoalView, PremiumBeverageListView, PremiumReminderViewSet
)
from .stats_views import (
    ConsumoHistoryView, ConsumoSummaryView, ConsumoTrendsView, ConsumoInsightsView
)

__all__ = [
    # Vistas básicas
    'ConsumoViewSet', 'RecipienteViewSet', 'BebidaViewSet',
    'MetaDiariaViewSet', 'MetaFijaView', 'RecordatorioViewSet',
    
    # Vistas de monetización
    'SubscriptionStatusView', 'PremiumFeaturesView', 'UsageLimitsView',
    'MonetizationStatsView', 'UpgradePromptView', 'NoAdsView',
    
    # Vistas premium
    'PremiumGoalView', 'PremiumBeverageListView', 'PremiumReminderViewSet',
    
    # Vistas de estadísticas
    'ConsumoHistoryView', 'ConsumoSummaryView', 'ConsumoTrendsView', 'ConsumoInsightsView'
]
