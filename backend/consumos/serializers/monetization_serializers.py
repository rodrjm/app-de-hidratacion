"""
Serializers para la lógica de monetización.
"""

from rest_framework import serializers
from django.utils import timezone


class SubscriptionStatusSerializer(serializers.Serializer):
    """
    Serializer para el estado de suscripción.
    """
    is_premium = serializers.BooleanField()
    subscription_end_date = serializers.DateField(required=False, allow_null=True)


class PremiumFeaturesSerializer(serializers.Serializer):
    """
    Serializer para las funcionalidades premium.
    """
    features = serializers.ListField(
        child=serializers.CharField(),
        help_text="Lista de funcionalidades premium disponibles"
    )


class UsageLimitsSerializer(serializers.Serializer):
    """
    Serializer para los límites de uso del usuario.
    """
    is_premium = serializers.BooleanField()
    reminders = serializers.DictField()
    consumos = serializers.DictField()


class MonetizationStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de monetización.
    """
    usuarios = serializers.DictField()
    conversion = serializers.DictField()
    actividad = serializers.DictField()


class UpgradePromptSerializer(serializers.Serializer):
    """
    Serializer para prompts de actualización.
    """
    prompt = serializers.CharField()
    is_premium = serializers.BooleanField()
    usage_stats = serializers.DictField()


class NoAdsSerializer(serializers.Serializer):
    """
    Serializer para verificación de anuncios.
    """
    is_premium = serializers.BooleanField()
