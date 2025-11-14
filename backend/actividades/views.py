from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from datetime import date, timedelta, datetime as dt
from .models import Actividad
from .serializers import ActividadSerializer, ActividadCreateSerializer


class ActividadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar actividades físicas del usuario.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ActividadSerializer
    
    def get_queryset(self):
        """Retorna solo las actividades del usuario autenticado."""
        queryset = Actividad.objects.filter(usuario=self.request.user)
        
        # Filtros opcionales
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        fecha_fin = self.request.query_params.get('fecha_fin', None)
        tipo_actividad = self.request.query_params.get('tipo_actividad', None)
        
        if fecha_inicio:
            queryset = queryset.filter(fecha_hora__date__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_hora__date__lte=fecha_fin)
        if tipo_actividad:
            queryset = queryset.filter(tipo_actividad=tipo_actividad)
        
        return queryset.order_by('-fecha_hora')
    
    def get_serializer_class(self):
        """Usa serializer simplificado para crear."""
        if self.action == 'create':
            return ActividadCreateSerializer
        return ActividadSerializer
    
    def perform_create(self, serializer):
        """Crea una actividad y actualiza la meta diaria."""
        actividad = serializer.save()
        # La actualización de meta se hace en el serializer
    
    def perform_update(self, serializer):
        """Actualiza una actividad y recalcula la meta diaria."""
        actividad = serializer.save()
        # La actualización de meta se hace en el serializer
    
    def perform_destroy(self, instance):
        """Elimina una actividad y actualiza la meta diaria."""
        usuario = instance.usuario
        instance.delete()
        # Actualizar meta diaria después de eliminar
        usuario.actualizar_meta_hidratacion_con_actividades()
    
    @action(detail=False, methods=['get'])
    def hoy(self, request):
        """Retorna todas las actividades del día actual."""
        hoy = timezone.now().date()
        inicio_dia = timezone.make_aware(dt.combine(hoy, dt.min.time()))
        fin_dia = timezone.make_aware(dt.combine(hoy, dt.max.time()))
        
        actividades = Actividad.objects.filter(
            usuario=request.user,
            fecha_hora__range=[inicio_dia, fin_dia]
        ).order_by('-fecha_hora')
        
        serializer = self.get_serializer(actividades, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def resumen_dia(self, request):
        """Retorna un resumen de actividades del día con PSE total."""
        fecha_str = request.query_params.get('fecha', None)
        if fecha_str:
            try:
                fecha = date.fromisoformat(fecha_str)
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            fecha = timezone.now().date()
        
        inicio_dia = timezone.make_aware(dt.combine(fecha, dt.min.time()))
        fin_dia = timezone.make_aware(dt.combine(fecha, dt.max.time()))
        
        actividades = Actividad.objects.filter(
            usuario=request.user,
            fecha_hora__range=[inicio_dia, fin_dia]
        )
        
        pse_total = sum(actividad.pse_calculado for actividad in actividades)
        cantidad_actividades = actividades.count()
        
        serializer = self.get_serializer(actividades, many=True)
        
        return Response({
            'fecha': fecha.isoformat(),
            'cantidad_actividades': cantidad_actividades,
            'pse_total': pse_total,
            'actividades': serializer.data
        })

