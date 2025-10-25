"""
Serializers para el modelo Consumo.
"""

from rest_framework import serializers
from django.utils import timezone
from ..models import Consumo


class ConsumoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Consumo.
    """
    bebida_nombre = serializers.CharField(source='bebida.nombre', read_only=True)
    recipiente_nombre = serializers.CharField(source='recipiente.nombre', read_only=True)
    hidratacion_efectiva_ml = serializers.SerializerMethodField()
    fecha_formateada = serializers.SerializerMethodField()
    hora_formateada = serializers.SerializerMethodField()

    class Meta:
        model = Consumo
        fields = [
            'id', 'cantidad_ml', 'bebida', 'bebida_nombre', 'recipiente',
            'recipiente_nombre', 'hidratacion_efectiva_ml', 'fecha_hora',
            'fecha_formateada', 'hora_formateada', 'nivel_sed', 'estado_animo',
            'notas', 'ubicacion', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']

    def get_hidratacion_efectiva_ml(self, obj):
        """
        Retorna la hidratación efectiva en ml.
        """
        return obj.cantidad_hidratacion_efectiva

    def get_fecha_formateada(self, obj):
        """
        Retorna la fecha formateada.
        """
        return obj.fecha_hora.strftime('%Y-%m-%d')

    def get_hora_formateada(self, obj):
        """
        Retorna la hora formateada.
        """
        return obj.fecha_hora.strftime('%H:%M')


class ConsumoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear consumos.
    """
    class Meta:
        model = Consumo
        fields = [
            'cantidad_ml', 'bebida', 'recipiente', 'fecha_hora',
            'nivel_sed', 'estado_animo', 'notas', 'ubicacion'
        ]

    def validate_cantidad_ml(self, value):
        """
        Valida que la cantidad sea positiva.
        """
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0")
        return value

    def validate_fecha_hora(self, value):
        """
        Valida que la fecha no sea futura.
        """
        if value > timezone.now():
            raise serializers.ValidationError("La fecha no puede ser futura")
        return value


class ConsumoStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de consumos.
    """
    total = serializers.IntegerField()
    activos = serializers.IntegerField()
    recientes_30_dias = serializers.IntegerField()
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
