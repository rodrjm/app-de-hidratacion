from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConsumoViewSet, RecipienteViewSet, BebidaViewSet, MetaDiariaViewSet
)

app_name = 'consumos'

# Configurar router para ViewSets
router = DefaultRouter()
router.register(r'consumos', ConsumoViewSet, basename='consumo')
router.register(r'recipientes', RecipienteViewSet, basename='recipiente')
router.register(r'bebidas', BebidaViewSet, basename='bebida')
router.register(r'metas-diarias', MetaDiariaViewSet, basename='meta-diaria')

urlpatterns = [
    path('', include(router.urls)),
]
