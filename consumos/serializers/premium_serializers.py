"""
Serializers para funcionalidades premium.
"""

from rest_framework import serializers


class PremiumGoalSerializer(serializers.Serializer):
    """
    Serializer para meta personalizada premium.
    """
    meta_ml = serializers.IntegerField()
    peso_kg = serializers.FloatField()
    nivel_actividad = serializers.CharField()
    factor_actividad = serializers.FloatField()
    formula_usada = serializers.CharField()


class PremiumBeverageSerializer(serializers.Serializer):
    """
    Serializer para bebidas premium.
    """
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    factor_hidratacion = serializers.FloatField()
    es_premium = serializers.BooleanField()
    descripcion = serializers.CharField()
    calorias_por_ml = serializers.FloatField()


class PremiumReminderSerializer(serializers.Serializer):
    """
    Serializer para recordatorios premium.
    """
    id = serializers.IntegerField()
    hora = serializers.TimeField()
    mensaje = serializers.CharField()
    tipo_recordatorio = serializers.CharField()
    frecuencia = serializers.CharField()
    dias_semana = serializers.ListField(child=serializers.IntegerField())
    activo = serializers.BooleanField()


class PremiumReminderCreateSerializer(serializers.Serializer):
    """
    Serializer para crear recordatorios premium.
    """
    hora = serializers.TimeField()
    mensaje = serializers.CharField()
    tipo_recordatorio = serializers.CharField()
    frecuencia = serializers.CharField()
    dias_semana = serializers.ListField(child=serializers.IntegerField())
