from rest_framework import serializers
from .models import Actividad
from django.utils import timezone
from datetime import date


class ActividadSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Actividad.
    Calcula automáticamente el PSE al crear o actualizar.
    """
    tipo_actividad_display = serializers.CharField(source='get_tipo_actividad_display', read_only=True)
    intensidad_display = serializers.CharField(source='get_intensidad_display', read_only=True)
    
    class Meta:
        model = Actividad
        fields = [
            'id', 'usuario', 'tipo_actividad', 'tipo_actividad_display',
            'duracion_minutos', 'intensidad', 'intensidad_display',
            'fecha_hora', 'pse_calculado', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['usuario', 'pse_calculado', 'fecha_creacion', 'fecha_actualizacion']
    
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
        """Crea una nueva actividad y calcula el PSE."""
        # El usuario se asigna automáticamente desde el request
        validated_data['usuario'] = self.context['request'].user
        
        # Crear la actividad
        actividad = Actividad(**validated_data)
        
        # Calcular PSE
        actividad.pse_calculado = actividad.calcular_pse()
        actividad.save()
        
        # Actualizar meta diaria del usuario
        actividad.usuario.actualizar_meta_hidratacion_con_actividades()
        
        return actividad
    
    def update(self, instance, validated_data):
        """Actualiza una actividad y recalcula el PSE."""
        # Actualizar campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Recalcular PSE
        instance.pse_calculado = instance.calcular_pse()
        instance.save()
        
        # Actualizar meta diaria del usuario
        instance.usuario.actualizar_meta_hidratacion_con_actividades()
        
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
        """Crea una nueva actividad y calcula el PSE."""
        # El usuario se asigna automáticamente desde el request
        validated_data['usuario'] = self.context['request'].user
        
        # Si no se proporciona fecha_hora, usar la fecha/hora actual
        if 'fecha_hora' not in validated_data:
            validated_data['fecha_hora'] = timezone.now()
        
        # Crear la actividad
        actividad = Actividad(**validated_data)
        
        # Calcular PSE
        actividad.pse_calculado = actividad.calcular_pse()
        actividad.save()
        
        # Actualizar meta diaria del usuario
        actividad.usuario.actualizar_meta_hidratacion_con_actividades()
        
        return actividad

