"""
Serializers para metas de hidratación.
"""

from rest_framework import serializers
from ..models import MetaDiaria


class MetaDiariaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo MetaDiaria.
    """
    progreso_porcentaje = serializers.SerializerMethodField()
    
    class Meta:
        model = MetaDiaria
        fields = [
            'id', 'fecha', 'meta_ml', 'consumido_ml', 'hidratacion_efectiva_ml',
            'completada', 'progreso_porcentaje', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'progreso_porcentaje']
    
    def get_progreso_porcentaje(self, obj):
        """
        Calcula el porcentaje de progreso hacia la meta.
        """
        if obj.meta_ml > 0:
            return round((obj.consumido_ml / obj.meta_ml) * 100, 2)
        return 0

    def validate_meta_ml(self, value):
        """
        Valida que la meta sea positiva y razonable.
        """
        if value <= 0:
            raise serializers.ValidationError("La meta debe ser mayor a 0")
        
        if value > 10000:  # 10 litros máximo
            raise serializers.ValidationError("La meta no puede ser mayor a 10000 ml")
        
        return value


class MetaFijaSerializer(serializers.Serializer):
    """
    Serializer para la meta fija de hidratación.
    """
    meta_ml = serializers.IntegerField()
    tipo_meta = serializers.CharField()
    descripcion = serializers.CharField()
    es_personalizable = serializers.BooleanField()
    fecha_actualizacion = serializers.DateTimeField(required=False, allow_null=True)
