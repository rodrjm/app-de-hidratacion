from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConsumoViewSet, RecipienteViewSet, BebidaViewSet, MetaDiariaViewSet,
    MetaFijaView, RecordatorioViewSet, SubscriptionStatusView, PremiumFeaturesView,
    UsageLimitsView, MonetizationStatsView, UpgradePromptView, PremiumGoalView,
    PremiumBeverageListView, PremiumReminderViewSet, ConsumoHistoryView,
    ConsumoSummaryView, ConsumoTrendsView, ConsumoInsightsView, NoAdsView
)

app_name = 'consumos'

# Configurar router para ViewSets
router = DefaultRouter()
router.register(r'consumos', ConsumoViewSet, basename='consumo')
router.register(r'recipientes', RecipienteViewSet, basename='recipiente')
router.register(r'bebidas', BebidaViewSet, basename='bebida')
router.register(r'metas-diarias', MetaDiariaViewSet, basename='meta-diaria')
router.register(r'recordatorios', RecordatorioViewSet, basename='recordatorio')
# Router para funcionalidades premium
router.register(r'premium/reminders', PremiumReminderViewSet, basename='premium-reminder')

urlpatterns = [
    path('', include(router.urls)),
    # Vistas adicionales que no son ViewSets
    path('goals/', MetaFijaView.as_view(), name='meta-fija'),
    # API de Monetización
    path('monetization/status/', SubscriptionStatusView.as_view(), name='subscription-status'),
    path('monetization/features/', PremiumFeaturesView.as_view(), name='premium-features'),
    path('monetization/limits/', UsageLimitsView.as_view(), name='usage-limits'),
    path('monetization/stats/', MonetizationStatsView.as_view(), name='monetization-stats'),
    path('monetization/upgrade/', UpgradePromptView.as_view(), name='upgrade-prompt'),
    path('monetization/no-ads/', NoAdsView.as_view(), name='no-ads'),
    # API Premium
    path('premium/goal/', PremiumGoalView.as_view(), name='premium-goal'),
    path('premium/beverages/', PremiumBeverageListView.as_view(), name='premium-beverages'),
    # API Premium - Estadísticas
    path('premium/stats/history/', ConsumoHistoryView.as_view(), name='premium-history'),
    path('premium/stats/summary/', ConsumoSummaryView.as_view(), name='premium-summary'),
    path('premium/stats/trends/', ConsumoTrendsView.as_view(), name='premium-trends'),
    path('premium/stats/insights/', ConsumoInsightsView.as_view(), name='premium-insights'),
]
