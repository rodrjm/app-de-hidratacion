import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from datetime import date, timedelta, datetime as dt
from .models import Actividad
from .serializers import ActividadSerializer, ActividadCreateSerializer
from .services.weather_service import WeatherService

logger = logging.getLogger(__name__)


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
        actividad = serializer.save(usuario=self.request.user)
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

    @action(detail=False, methods=['post'], url_path='estimate')
    def estimate(self, request):
        """
        Estima el PSE (ml) y ajuste climático sin guardar la actividad.
        Body: tipo_actividad, duracion_minutos, intensidad, fecha_hora (ISO), latitude, longitude.
        """
        tipo = request.data.get('tipo_actividad')
        duracion = request.data.get('duracion_minutos')
        intensidad = request.data.get('intensidad')
        fecha_hora_str = request.data.get('fecha_hora')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        if not all([tipo, duracion is not None, intensidad, fecha_hora_str]):
            return Response(
                {'error': 'Faltan tipo_actividad, duracion_minutos, intensidad o fecha_hora'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            duracion = int(duracion)
            if duracion < 1 or duracion > 1440:
                return Response(
                    {'error': 'duracion_minutos debe estar entre 1 y 1440'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response({'error': 'duracion_minutos inválido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Aceptar ISO con o sin Z
            s = fecha_hora_str.replace('Z', '+00:00').strip()
            if len(s) == 19:
                s += '+00:00'
            activity_dt = dt.fromisoformat(s)
            if activity_dt.tzinfo is None:
                activity_dt = timezone.make_aware(activity_dt)
        except (ValueError, TypeError, AttributeError):
            return Response({'error': 'fecha_hora inválido (use formato ISO)'}, status=status.HTTP_400_BAD_REQUEST)

        temperature = None
        humidity = None
        weather_message = None

        # Zona horaria del usuario (ej. "America/Argentina/Buenos_Aires") para mostrar la hora del clima correcta
        user_tz = (request.data.get('tz') or request.data.get('timezone') or request.query_params.get('tz') or request.query_params.get('timezone') or '').strip() or None

        if latitude is not None and longitude is not None:
            try:
                lat_f = float(latitude)
                lon_f = float(longitude)
                weather_service = WeatherService()
                weather_data = weather_service.get_weather_data(
                    lat_f, lon_f, activity_dt, user_timezone=user_tz
                )
                if weather_data.get('success'):
                    temperature = weather_data.get('temperature')
                    humidity = weather_data.get('humidity')
                    weather_message = weather_data.get('weather_message')
                else:
                    weather_message = weather_data.get('weather_message') or 'Clima no disponible para esta ubicación.'
            except Exception as e:
                logger.warning('Estimate weather error: %s', e)
                weather_message = 'No se pudo obtener el clima para la estimación.'

        # Calcular PSE sin guardar (usuario solo para instancia mínima)
        dummy = Actividad(
            usuario=request.user,
            tipo_actividad=tipo,
            duracion_minutos=duracion,
            intensidad=intensidad,
            fecha_hora=activity_dt,
            pse_calculado=0,
        )
        estimated_pse = dummy.calcular_pse(temperature, humidity)
        factor = dummy._calcular_factor_climatico(temperature, humidity)
        climate_adjustment = f"{((factor - 1.0) * 100):+.0f}%" if factor != 1.0 else None

        return Response({
            'estimated_pse_ml': estimated_pse,
            'weather_message': weather_message,
            'climate_adjustment': climate_adjustment,
        })

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk(self, request):
        """
        Crea varias actividades en una sola petición (sincronización offline).
        Body: lista de objetos con el mismo formato que POST /actividades/.
        """
        if not isinstance(request.data, list):
            return Response(
                {'error': 'Se espera un array de actividades.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for item in request.data:
            if not isinstance(item, dict):
                return Response(
                    {'error': 'Cada elemento debe ser un objeto.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        serializer = ActividadCreateSerializer(
            data=request.data,
            many=True,
            context={
                **self.get_serializer_context(),
                'skip_meta_update': True,
            },
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        child = serializer.child
        with transaction.atomic():
            instances = [
                child.create({**attrs, 'usuario': request.user})
                for attrs in serializer.validated_data
            ]
            request.user.actualizar_meta_hidratacion_con_actividades()
        out = ActividadSerializer(
            instances,
            many=True,
            context=self.get_serializer_context(),
        )
        return Response(out.data, status=status.HTTP_201_CREATED)

