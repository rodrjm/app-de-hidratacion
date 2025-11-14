"""
Vistas para la gestión de recipientes.
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Recipiente
from ..serializers.recipiente_serializers import RecipienteSerializer
from .base_views import BaseViewSet, StatsMixin, FilterMixin


class RecipienteViewSet(BaseViewSet, StatsMixin, FilterMixin):
    """
    ViewSet para gestionar recipientes de hidratación.
    """
    queryset = Recipiente.objects.all()
    serializer_class = RecipienteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['es_favorito', 'cantidad_ml']
    search_fields = ['nombre', 'color']
    ordering_fields = ['nombre', 'cantidad_ml', 'fecha_creacion']
    ordering = ['nombre']
