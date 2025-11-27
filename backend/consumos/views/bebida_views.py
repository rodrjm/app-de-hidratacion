"""
Vistas para la gestión de bebidas.
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from ..models import Bebida
from ..serializers.bebida_serializers import BebidaSerializer
from .base_views import BaseViewSet, StatsMixin, FilterMixin


class BebidaViewSet(BaseViewSet, StatsMixin, FilterMixin):
    """
    ViewSet para gestionar bebidas.
    """
    queryset = Bebida.objects.all()
    serializer_class = BebidaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['es_agua', 'es_premium', 'activa']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'factor_hidratacion', 'fecha_creacion']
    ordering = ['nombre']
    
    def get_queryset(self):
        """
        Las bebidas son globales, no pertenecen a un usuario específico.
        Retorna todas las bebidas activas.
        """
        return self.queryset.filter(activa=True)

    def list(self, request, *args, **kwargs):
        """
        Lista de bebidas (cache deshabilitado temporalmente para evitar errores con Redis).
        """
        return super().list(request, *args, **kwargs)
