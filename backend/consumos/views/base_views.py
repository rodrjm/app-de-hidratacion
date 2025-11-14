"""
Vistas base y mixins para la aplicación de consumos.
Contiene funcionalidad común reutilizable.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta


class BaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet base con funcionalidad común para todos los ViewSets.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtra los objetos por usuario autenticado.
        """
        return self.queryset.filter(usuario=self.request.user)
    
    def perform_create(self, serializer):
        """
        Asigna el usuario autenticado al crear un objeto.
        """
        serializer.save(usuario=self.request.user)


class StatsMixin:
    """
    Mixin para agregar funcionalidad de estadísticas a los ViewSets.
    """
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Retorna estadísticas básicas del ViewSet.
        """
        queryset = self.get_queryset()
        
        # Estadísticas básicas
        total = queryset.count()
        activos = queryset.filter(activo=True).count() if hasattr(queryset.model, 'activo') else total
        
        # Estadísticas por fecha (últimos 30 días)
        fecha_inicio = timezone.now().date() - timedelta(days=30)
        recientes = queryset.filter(
            fecha_creacion__date__gte=fecha_inicio
        ).count()
        
        return Response({
            'total': total,
            'activos': activos,
            'recientes_30_dias': recientes,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': timezone.now().date()
        })


class FilterMixin:
    """
    Mixin para agregar funcionalidad de filtrado común.
    """
    
    def get_filtered_queryset(self, request):
        """
        Aplica filtros comunes basados en parámetros de consulta.
        """
        queryset = self.get_queryset()
        
        # Filtro por rango de fechas
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        if fecha_inicio:
            try:
                from datetime import datetime
                fecha_inicio_obj = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_creacion__date__gte=fecha_inicio_obj)
            except ValueError:
                pass
        
        if fecha_fin:
            try:
                from datetime import datetime
                fecha_fin_obj = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_creacion__date__lte=fecha_fin_obj)
            except ValueError:
                pass
        
        return queryset


class ExportMixin:
    """
    Mixin para agregar funcionalidad de exportación.
    """
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Exporta los datos del ViewSet en formato CSV.
        """
        import csv
        from django.http import HttpResponse
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{self.queryset.model._meta.verbose_name_plural}.csv"'
        
        if serializer.data:
            writer = csv.DictWriter(response, fieldnames=serializer.data[0].keys())
            writer.writeheader()
            writer.writerows(serializer.data)
        
        return response
