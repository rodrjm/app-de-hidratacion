from rest_framework import serializers
from .models import Actividad
from django.utils import timezone
from datetime import date
from .services.weather_service import WeatherService


class ActividadSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Actividad.
    Calcula automáticamente el PSE al crear o actualizar, incluyendo factores climáticos.
    """
    tipo_actividad_display = serializers.CharField(source='get_tipo_actividad_display', read_only=True)
    intensidad_display = serializers.CharField(source='get_intensidad_display', read_only=True)
    weather_message = serializers.SerializerMethodField()
    climate_adjustment = serializers.SerializerMethodField()
    
    class Meta:
        model = Actividad
        fields = [
            'id', 'usuario', 'tipo_actividad', 'tipo_actividad_display',
            'duracion_minutos', 'intensidad', 'intensidad_display',
            'fecha_hora', 'pse_calculado', 'fecha_creacion', 'fecha_actualizacion',
            'weather_message', 'climate_adjustment'
        ]
        read_only_fields = ['usuario', 'pse_calculado', 'fecha_creacion', 'fecha_actualizacion']
    
    def get_weather_message(self, obj):
        """Retorna el mensaje climático si está disponible."""
        return getattr(obj, '_weather_message', None)
    
    def get_climate_adjustment(self, obj):
        """Retorna el porcentaje de ajuste climático si está disponible."""
        factor = getattr(obj, '_factor_climatico', None)
        if factor is not None:
            percentage = ((factor - 1.0) * 100)
            return f"{percentage:+.0f}%"
        return None
    
    def validate_duracion_minutos(self, value):
        """Valida que la duración sea razonable."""
        if value < 1:
            raise serializers.ValidationError('La duración debe ser al menos 1 minuto.')
        if value > 1440:
            raise serializers.ValidationError('La duración no puede ser mayor a 1440 minutos (24 horas).')
        return value
    
    def validate_fecha_hora(self, value):
        """Valida que la fecha no sea futura."""
        if value > timezone.now():
            raise serializers.ValidationError('La fecha y hora no puede ser futura.')
        return value
    
    def create(self, validated_data):
        """Crea una nueva actividad y calcula el PSE con factores climáticos."""
        # El usuario se asigna automáticamente desde el request
        validated_data['usuario'] = self.context['request'].user
        
        # Obtener coordenadas y zona horaria para datos climáticos
        request = self.context['request']
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        user_timezone = request.data.get('tz') or request.data.get('timezone')
        
        temperature = None
        humidity = None
        weather_message = None
        
        # Si hay coordenadas y fecha_hora, consultar clima
        if latitude and longitude and 'fecha_hora' in validated_data:
            try:
                weather_service = WeatherService()
                activity_datetime = validated_data['fecha_hora']
                
                weather_data = weather_service.get_weather_data(
                    float(latitude),
                    float(longitude),
                    activity_datetime,
                    user_timezone=user_timezone
                )
                
                if weather_data.get('success'):
                    temperature = weather_data.get('temperature')
                    humidity = weather_data.get('humidity')
                    weather_message = weather_data.get('weather_message', '')
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f'Error al obtener datos climáticos: {str(e)}')
        
        # Crear la actividad
        actividad = Actividad(**validated_data)
        
        # Calcular PSE con factores climáticos
        actividad.pse_calculado = actividad.calcular_pse(temperature, humidity)
        actividad.save()
        
        # Actualizar meta diaria del usuario
        actividad.usuario.actualizar_meta_hidratacion_con_actividades()
        
        # Agregar mensaje climático a la respuesta si está disponible
        if weather_message:
            # Guardar mensaje en el objeto para que esté disponible en la respuesta
            actividad._weather_message = weather_message
            actividad._temperature = temperature
            actividad._humidity = humidity
            actividad._factor_climatico = actividad._calcular_factor_climatico(temperature, humidity)
        
        return actividad
    
    def update(self, instance, validated_data):
        """Actualiza una actividad y recalcula el PSE con factores climáticos."""
        # Obtener coordenadas y zona horaria para datos climáticos
        request = self.context['request']
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        user_timezone = request.data.get('tz') or request.data.get('timezone')
        
        temperature = None
        humidity = None
        weather_message = None
        
        # Si hay coordenadas y fecha_hora, consultar clima
        fecha_hora = validated_data.get('fecha_hora', instance.fecha_hora)
        if latitude and longitude and fecha_hora:
            try:
                weather_service = WeatherService()
                
                weather_data = weather_service.get_weather_data(
                    float(latitude),
                    float(longitude),
                    fecha_hora,
                    user_timezone=user_timezone
                )
                
                if weather_data.get('success'):
                    temperature = weather_data.get('temperature')
                    humidity = weather_data.get('humidity')
                    weather_message = weather_data.get('weather_message', '')
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f'Error al obtener datos climáticos: {str(e)}')
        
        # Actualizar campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Recalcular PSE con factores climáticos
        instance.pse_calculado = instance.calcular_pse(temperature, humidity)
        instance.save()
        
        # Actualizar meta diaria del usuario
        instance.usuario.actualizar_meta_hidratacion_con_actividades()
        
        # Agregar mensaje climático a la respuesta si está disponible
        if weather_message:
            instance._weather_message = weather_message
            instance._temperature = temperature
            instance._humidity = humidity
            instance._factor_climatico = instance._calcular_factor_climatico(temperature, humidity)
        
        return instance


class ActividadCreateSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para crear actividades.
    """
    class Meta:
        model = Actividad
        fields = ['tipo_actividad', 'duracion_minutos', 'intensidad', 'fecha_hora']
        extra_kwargs = {
            'fecha_hora': {'required': False}
        }
    
    def validate_duracion_minutos(self, value):
        """Valida que la duración sea razonable."""
        if value < 1:
            raise serializers.ValidationError('La duración debe ser al menos 1 minuto.')
        if value > 1440:
            raise serializers.ValidationError('La duración no puede ser mayor a 1440 minutos (24 horas).')
        return value
    
    def create(self, validated_data):
        """Crea una nueva actividad y calcula el PSE con factores climáticos."""
        # El usuario se asigna automáticamente desde el request
        validated_data['usuario'] = self.context['request'].user
        
        # Si no se proporciona fecha_hora, usar la fecha/hora actual
        if 'fecha_hora' not in validated_data:
            validated_data['fecha_hora'] = timezone.now()
        
        # Obtener coordenadas y zona horaria (por ítem en bulk via activity_request_data)
        request = self.context['request']
        item_payload = self.context.get('activity_request_data')
        if item_payload is not None:
            latitude = item_payload.get('latitude')
            longitude = item_payload.get('longitude')
            user_timezone = item_payload.get('tz') or item_payload.get('timezone')
        else:
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            user_timezone = request.data.get('tz') or request.data.get('timezone')
        
        temperature = None
        humidity = None
        weather_message = None
        
        # Si hay coordenadas y fecha_hora, consultar clima
        if latitude and longitude and 'fecha_hora' in validated_data:
            try:
                weather_service = WeatherService()
                activity_datetime = validated_data['fecha_hora']
                
                weather_data = weather_service.get_weather_data(
                    float(latitude),
                    float(longitude),
                    activity_datetime,
                    user_timezone=user_timezone
                )
                
                if weather_data.get('success'):
                    temperature = weather_data.get('temperature')
                    humidity = weather_data.get('humidity')
                    weather_message = weather_data.get('weather_message', '')
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f'Error al obtener datos climáticos: {str(e)}')
        
        # Crear la actividad
        actividad = Actividad(**validated_data)
        
        # Calcular PSE con factores climáticos
        actividad.pse_calculado = actividad.calcular_pse(temperature, humidity)
        actividad.save()
        
        if not self.context.get('skip_meta_update'):
            actividad.usuario.actualizar_meta_hidratacion_con_actividades()
        
        # Agregar mensaje climático a la respuesta si está disponible
        if weather_message:
            actividad._weather_message = weather_message
            actividad._temperature = temperature
            actividad._humidity = humidity
            actividad._factor_climatico = actividad._calcular_factor_climatico(temperature, humidity)
        
        return actividad

