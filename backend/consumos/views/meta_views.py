"""
Vistas para la gestión de metas de hidratación.
"""

from rest_framework import viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import MetaDiaria
from ..serializers.meta_serializers import MetaDiariaSerializer, MetaFijaSerializer
from .base_views import BaseViewSet, StatsMixin, FilterMixin


class MetaDiariaViewSet(BaseViewSet, StatsMixin, FilterMixin):
    """
    ViewSet para gestionar metas diarias de hidratación.
    """
    queryset = MetaDiaria.objects.all()
    serializer_class = MetaDiariaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fecha', 'completada']
    search_fields = []
    ordering_fields = ['fecha', 'meta_ml', 'consumido_ml']
    ordering = ['-fecha']


class MetaFijaView(APIView):
    """
    Vista para obtener la meta fija de hidratación.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna la meta fija de hidratación del usuario.
        """
        from django.conf import settings
        
        # Obtener meta fija desde settings o usar valor por defecto
        meta_fija_ml = getattr(settings, 'META_FIJA_ML', 2000)
        
        # Para usuarios premium, usar su meta personalizada
        if request.user.es_premium:
            meta_ml = request.user.calcular_meta_hidratacion()
            tipo_meta = 'personalizada'
            descripcion = 'Meta personalizada basada en tu perfil'
            es_personalizable = True
        else:
            meta_ml = meta_fija_ml
            tipo_meta = 'fija'
            descripcion = 'Meta fija para usuarios gratuitos'
            es_personalizable = False
        
        data = {
            'meta_ml': meta_ml,
            'tipo_meta': tipo_meta,
            'descripcion': descripcion,
            'es_personalizable': es_personalizable,
            'fecha_actualizacion': request.user.fecha_actualizacion
        }
        
        serializer = MetaFijaSerializer(data)
        return Response(serializer.data)
