"""
Vistas para la gestión de bebidas.
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

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
