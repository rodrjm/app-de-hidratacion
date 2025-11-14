"""
Serializers para el modelo Recordatorio.
"""

from rest_framework import serializers
from ..models import Recordatorio


class RecordatorioSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Recordatorio.
    """
    class Meta:
        model = Recordatorio
        fields = [
            'id', 'hora', 'mensaje', 'tipo_recordatorio', 'frecuencia',
            'dias_semana', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']

    def validate_hora(self, value):
        """
        Valida que la hora esté en formato correcto.
        """
        if not value:
            raise serializers.ValidationError("La hora es requerida")
        
        # Validar formato HH:MM
        try:
            hour, minute = value.split(':')
            hour = int(hour)
            minute = int(minute)
            
            if not (0 <= hour <= 23):
                raise serializers.ValidationError("La hora debe estar entre 00:00 y 23:59")
            
            if not (0 <= minute <= 59):
                raise serializers.ValidationError("Los minutos deben estar entre 00 y 59")
                
        except ValueError:
            raise serializers.ValidationError("El formato de hora debe ser HH:MM")
        
        return value

    def validate_mensaje(self, value):
        """
        Valida que el mensaje no esté vacío.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("El mensaje no puede estar vacío")
        
        if len(value) > 200:
            raise serializers.ValidationError("El mensaje no puede exceder 200 caracteres")
        
        return value.strip()


class RecordatorioCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear recordatorios.
    """
    class Meta:
        model = Recordatorio
        fields = [
            'hora', 'mensaje', 'tipo_recordatorio', 'frecuencia', 'dias_semana'
        ]

    def validate(self, data):
        """
        Validaciones adicionales para la creación de recordatorios.
        """
        # Validar que no se exceda el límite de recordatorios
        user = self.context['request'].user
        current_count = Recordatorio.objects.filter(usuario=user).count()
        
        # Obtener límite según el plan del usuario
        from django.conf import settings
        if user.es_premium:
            max_reminders = settings.META_MAX_RECORDATORIOS_PREMIUM
        else:
            max_reminders = settings.META_MAX_RECORDATORIOS_GRATUITOS
        
        if current_count >= max_reminders:
            raise serializers.ValidationError(
                f"Has alcanzado el límite de {max_reminders} recordatorios. "
                "Actualiza a Premium para recordatorios ilimitados."
            )
        
        return data


class RecordatorioStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de recordatorios.
    """
    total_recordatorios = serializers.IntegerField()
    recordatorios_activos = serializers.IntegerField()
    recordatorios_inactivos = serializers.IntegerField()
    proximos_recordatorios = serializers.ListField()
    recordatorios_por_tipo = serializers.DictField()
    recordatorios_por_frecuencia = serializers.DictField()
