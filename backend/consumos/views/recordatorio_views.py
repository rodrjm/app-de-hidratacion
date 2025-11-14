"""
Vistas para la gestión de recordatorios.
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Recordatorio
from ..serializers.recordatorio_serializers import (
    RecordatorioSerializer, RecordatorioCreateSerializer, RecordatorioStatsSerializer
)
from .base_views import BaseViewSet, StatsMixin, FilterMixin


class RecordatorioViewSet(BaseViewSet, StatsMixin, FilterMixin):
    """
    ViewSet para gestionar recordatorios de hidratación.
    """
    queryset = Recordatorio.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activo', 'tipo_recordatorio', 'frecuencia']
    search_fields = ['mensaje']
    ordering_fields = ['hora', 'fecha_creacion']
    ordering = ['hora']

    def get_serializer_class(self):
        """
        Retorna el serializer apropiado según la acción.
        """
        if self.action == 'create':
            return RecordatorioCreateSerializer
        return RecordatorioSerializer

    def get_queryset(self):
        """
        Filtra los recordatorios del usuario autenticado.
        """
        return Recordatorio.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """
        Asigna el usuario autenticado al crear un recordatorio.
        """
        serializer.save(usuario=self.request.user)
