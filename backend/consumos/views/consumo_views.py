"""
Vistas para la gestión de consumos de hidratación.
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, Prefetch
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta, datetime

from ..models import Consumo
from ..serializers.consumo_serializers import (
    ConsumoSerializer, ConsumoCreateSerializer
)
from .base_views import BaseViewSet, StatsMixin, FilterMixin
from ..utils.cache_utils import CacheManager, cache_result, cache_user_data


class ConsumoViewSet(BaseViewSet, StatsMixin, FilterMixin):
    """
    ViewSet para gestionar consumos de hidratación.
    Permite CRUD completo con filtros por fecha y usuario.
    Optimizado con select_related y prefetch_related.
    """
    queryset = Consumo.objects.select_related(
        'usuario', 'bebida', 'recipiente'
    ).prefetch_related(
        'bebida__categoria',
        'recipiente__usuario'
    ).all()
    
    filter_backends = [
        DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter
    ]
    filterset_fields = [
        'fecha_hora', 'bebida', 'recipiente', 'nivel_sed', 'estado_animo'
    ]
    search_fields = [
        'notas', 'ubicacion', 'bebida__nombre', 'recipiente__nombre'
    ]
    ordering_fields = [
        'fecha_hora', 'cantidad_ml', 'cantidad_hidratacion_efectiva'
    ]
    ordering = ['-fecha_hora']

    def get_serializer_class(self):
        """
        Retorna el serializer apropiado según la acción.
        """
        if self.action == 'create':
            return ConsumoCreateSerializer
        return ConsumoSerializer

    def get_queryset(self):
        """
        Filtra los consumos del usuario autenticado con optimizaciones.
        """
        # Usar el queryset optimizado de la clase
        queryset = self.queryset.filter(usuario=self.request.user)
        
        # Filtro por fecha específica
        fecha = self.request.query_params.get('date', None)
        if fecha:
            try:
                fecha_obj = timezone.datetime.strptime(fecha, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_hora__date=fecha_obj)
            except ValueError:
                pass
        
        # Filtro por rango de fechas
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        fecha_fin = self.request.query_params.get('fecha_fin', None)
        
        if fecha_inicio:
            try:
                fecha_inicio_obj = timezone.datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_hora__date__gte=fecha_inicio_obj)
            except ValueError:
                pass
        
        if fecha_fin:
            try:
                fecha_fin_obj = timezone.datetime.strptime(fecha_fin, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_hora__date__lte=fecha_fin_obj)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        """
        Asigna el usuario autenticado al crear un consumo.
        """
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        """
        Retorna un resumen diario de consumos.
        """
        from ..services.consumo_service import ConsumoService
        
        service = ConsumoService(request.user)
        fecha = request.query_params.get('fecha')
        
        if fecha:
            try:
                fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
                summary = service.get_daily_summary(fecha_obj)
            except ValueError:
                return Response({
                    'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            summary = service.get_daily_summary()
        
        return Response(summary)

    @action(detail=False, methods=['get'])
    def weekly_summary(self, request):
        """
        Retorna un resumen semanal de consumos.
        """
        from ..services.consumo_service import ConsumoService
        
        service = ConsumoService(request.user)
        fecha_inicio = request.query_params.get('fecha_inicio')
        
        if fecha_inicio:
            try:
                fecha_inicio_obj = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
                summary = service.get_weekly_summary(fecha_inicio_obj)
            except ValueError:
                return Response({
                    'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            summary = service.get_weekly_summary()
        
        return Response(summary)

    @action(detail=False, methods=['get'])
    def trends(self, request):
        """
        Retorna tendencias de consumo.
        """
        from ..services.consumo_service import ConsumoService
        
        service = ConsumoService(request.user)
        period = request.query_params.get('period', 'weekly')
        
        try:
            trends = service.get_trends(period)
            return Response(trends)
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    @cache_result(timeout=600, key_prefix='consumos_stats')
    def cached_stats(self, request):
        """
        Estadísticas con caché para mejor performance.
        """
        from ..services.consumo_service import ConsumoService
        
        service = ConsumoService(request.user)
        period = request.query_params.get('period', 'daily')
        
        try:
            if period == 'daily':
                stats = service.get_daily_summary()
            elif period == 'weekly':
                stats = service.get_weekly_summary()
            elif period == 'monthly':
                stats = service.get_monthly_summary()
            else:
                return Response({
                    'error': 'Período inválido. Use: daily, weekly, monthly'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(stats)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def performance_test(self, request):
        """
        Endpoint para probar performance con diferentes estrategias.
        """
        import time
        
        # Test 1: Sin optimizaciones
        start_time = time.time()
        consumos_sin_opt = Consumo.objects.filter(usuario=request.user)[:100]
        list(consumos_sin_opt)  # Forzar evaluación
        time_sin_opt = time.time() - start_time
        
        # Test 2: Con select_related
        start_time = time.time()
        consumos_con_opt = Consumo.objects.select_related(
            'bebida', 'recipiente', 'usuario'
        ).filter(usuario=request.user)[:100]
        list(consumos_con_opt)  # Forzar evaluación
        time_con_opt = time.time() - start_time
        
        # Test 3: Con caché
        cache_key = CacheManager.get_cache_key(
            'performance_test', 
            request.user.id
        )
        
        start_time = time.time()
        cached_result = CacheManager.get_or_set(
            cache_key,
            lambda: list(Consumo.objects.select_related(
                'bebida', 'recipiente', 'usuario'
            ).filter(usuario=request.user)[:100]),
            timeout=300
        )
        time_con_cache = time.time() - start_time
        
        return Response({
            'performance_comparison': {
                'sin_optimizaciones': f"{time_sin_opt:.4f}s",
                'con_select_related': f"{time_con_opt:.4f}s",
                'con_cache': f"{time_con_cache:.4f}s",
                'mejora_select_related': f"{((time_sin_opt - time_con_opt) / time_sin_opt * 100):.1f}%",
                'mejora_cache': f"{((time_sin_opt - time_con_cache) / time_sin_opt * 100):.1f}%"
            },
            'datos': {
                'total_consumos': len(cached_result),
                'cache_key': cache_key
            }
        })