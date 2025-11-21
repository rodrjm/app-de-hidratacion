"""
Serializers para el modelo Recipiente.
"""

from rest_framework import serializers
from ..models import Recipiente


class RecipienteSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Recipiente.
    """
    usuario = serializers.StringRelatedField(read_only=True)
    hidratacion_efectiva_ml = serializers.SerializerMethodField()

    class Meta:
        model = Recipiente
        fields = [
            'id', 'usuario', 'nombre', 'cantidad_ml', 'color',
            'icono', 'es_favorito', 'fecha_creacion', 'hidratacion_efectiva_ml'
        ]
        read_only_fields = ['id', 'usuario', 'fecha_creacion']

    def get_hidratacion_efectiva_ml(self, obj):
        """
        Calcula la hidratación efectiva considerando el factor de la bebida.
        Por defecto, asume agua (factor 1.0).
        """
        return obj.cantidad_ml

    def validate_nombre(self, value):
        """
        Valida que el nombre del recipiente sea único para el usuario.
        """
        user = self.context['request'].user
        if self.instance:
            # Para actualización, excluir el objeto actual
            if Recipiente.objects.filter(
                usuario=user, nombre=value
            ).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(
                    "Ya tienes un recipiente con este nombre"
                )
        else:
            # Para creación
            if Recipiente.objects.filter(usuario=user, nombre=value).exists():
                raise serializers.ValidationError(
                    "Ya tienes un recipiente con este nombre"
                )
        return value

    def validate_cantidad_ml(self, value):
        """
        Valida que la cantidad sea positiva y razonable.
        """
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0")
        if value > 5000:
            raise serializers.ValidationError("La cantidad máxima permitida es 5000 ml")
        return value

    def validate_color(self, value):
        """
        Permite color opcional. Si viene vacío o None, usar el color por defecto del modelo.
        """
        if not value or not str(value).strip():
            return '#3B82F6'
        return value
