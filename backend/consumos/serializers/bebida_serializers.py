"""
Serializers para el modelo Bebida.
"""

from rest_framework import serializers
from ..models import Bebida


class BebidaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Bebida.
    """
    class Meta:
        model = Bebida
        fields = [
            'id', 'nombre', 'factor_hidratacion', 'descripcion',
            'es_agua', 'es_premium', 'es_alcoholica', 'calorias_por_ml', 'activa', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']

    def validate_factor_hidratacion(self, value):
        """
        Valida que el factor de hidratación esté en un rango válido.
        """
        if value < 0:
            raise serializers.ValidationError("El factor de hidratación no puede ser negativo")
        
        if value > 2.0:
            raise serializers.ValidationError("El factor de hidratación no puede ser mayor a 2.0")
        
        return value

    def validate_calorias_por_ml(self, value):
        """
        Valida que las calorías por ml sean positivas.
        """
        if value < 0:
            raise serializers.ValidationError("Las calorías no pueden ser negativas")
        
        return value
