"""
Vistas para la lógica de monetización y suscripciones.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework import status
from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from ..models import Consumo, Recordatorio
from ..serializers.monetization_serializers import (
    SubscriptionStatusSerializer, PremiumFeaturesSerializer, UsageLimitsSerializer,
    MonetizationStatsSerializer, UpgradePromptSerializer
)


class SubscriptionStatusView(APIView):
    """
    Vista para consultar el estado de suscripción del usuario.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna el estado de suscripción del usuario autenticado.
        """
        user = request.user
        is_premium = user.es_premium
        
        # Obtener fecha de fin de suscripción si es premium
        subscription_end_date = None
        if is_premium and hasattr(user, 'subscription_end_date'):
            subscription_end_date = user.subscription_end_date
        
        data = {
            'is_premium': is_premium,
            'subscription_end_date': subscription_end_date
        }
        
        serializer = SubscriptionStatusSerializer(data)
        return Response(serializer.data)


class PremiumFeaturesView(APIView):
    """
    Vista para listar las funcionalidades premium disponibles.
    Endpoint público para mostrar beneficios de la suscripción.
    """
    permission_classes = [AllowAny]  # Público

    def get(self, request):
        """
        Retorna la lista de funcionalidades premium.
        """
        features = [
            "Meta diaria personalizada",
            "Estadísticas y análisis avanzados",
            "Recordatorios ilimitados",
            "Sin anuncios",
            "Bebidas premium",
            "Insights inteligentes",
            "Exportación de datos",
            "Soporte prioritario"
        ]
        
        data = {'features': features}
        serializer = PremiumFeaturesSerializer(data)
        return Response(serializer.data)


class UsageLimitsView(APIView):
    """
    Vista para consultar los límites de uso del usuario.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna los límites de uso actuales del usuario.
        """
        user = request.user
        is_premium = user.es_premium
        
        # Límites de recordatorios
        if is_premium:
            max_reminders = settings.META_MAX_RECORDATORIOS_PREMIUM
        else:
            max_reminders = settings.META_MAX_RECORDATORIOS_GRATUITOS
        
        # Recordatorios actuales
        current_reminders = Recordatorio.objects.filter(usuario=user).count()
        
        # Límites de consumos (si aplica)
        max_consumos_diarios = None if is_premium else 50  # Ejemplo
        
        # Consumos del día actual
        today = timezone.now().date()
        consumos_hoy = Consumo.objects.filter(
            usuario=user, fecha_hora__date=today
        ).count()
        
        data = {
            'is_premium': is_premium,
            'reminders': {
                'max_allowed': max_reminders,
                'current': current_reminders,
                'remaining': max_reminders - current_reminders
            },
            'consumos': {
                'max_daily': max_consumos_diarios,
                'current_today': consumos_hoy,
                'remaining_today': (max_consumos_diarios - consumos_hoy) if max_consumos_diarios else None
            }
        }
        
        serializer = UsageLimitsSerializer(data)
        return Response(serializer.data)


class MonetizationStatsView(APIView):
    """
    Vista para estadísticas de monetización (solo administradores).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """
        Retorna estadísticas de monetización del sistema.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Estadísticas de usuarios
        total_users = User.objects.count()
        premium_users = User.objects.filter(es_premium=True).count()
        free_users = total_users - premium_users
        
        # Estadísticas de conversión
        conversion_rate = (premium_users / total_users * 100) if total_users > 0 else 0
        
        # Estadísticas de actividad
        active_users_30d = User.objects.filter(
            last_login__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        # Estadísticas de consumos
        total_consumos = Consumo.objects.count()
        consumos_30d = Consumo.objects.filter(
            fecha_hora__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        data = {
            'usuarios': {
                'total': total_users,
                'premium': premium_users,
                'gratuitos': free_users,
                'activos_30d': active_users_30d
            },
            'conversion': {
                'tasa_conversion': round(conversion_rate, 2),
                'usuarios_premium': premium_users,
                'usuarios_totales': total_users
            },
            'actividad': {
                'consumos_totales': total_consumos,
                'consumos_30d': consumos_30d,
                'usuarios_activos_30d': active_users_30d
            }
        }
        
        serializer = MonetizationStatsSerializer(data)
        return Response(serializer.data)


class UpgradePromptView(APIView):
    """
    Vista para generar prompts de actualización personalizados.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna un prompt de actualización personalizado basado en el uso del usuario.
        """
        user = request.user
        
        if user.es_premium:
            return Response({
                'message': 'Ya eres usuario premium',
                'is_premium': True
            })
        
        # Analizar uso del usuario
        consumos_30d = Consumo.objects.filter(
            usuario=user,
            fecha_hora__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        recordatorios_actuales = Recordatorio.objects.filter(usuario=user).count()
        max_reminders = settings.META_MAX_RECORDATORIOS_GRATUITOS
        
        # Generar prompt personalizado
        prompt = self._generate_upgrade_prompt(consumos_30d, recordatorios_actuales, max_reminders)
        
        data = {
            'prompt': prompt,
            'is_premium': False,
            'usage_stats': {
                'consumos_30d': consumos_30d,
                'recordatorios_actuales': recordatorios_actuales,
                'max_reminders': max_reminders
            }
        }
        
        serializer = UpgradePromptSerializer(data)
        return Response(serializer.data)
    
    def _generate_upgrade_prompt(self, consumos_30d, recordatorios_actuales, max_reminders):
        """
        Genera un prompt de actualización personalizado.
        """
        if recordatorios_actuales >= max_reminders:
            return "¡Has alcanzado el límite de recordatorios! Actualiza a Premium para recordatorios ilimitados."
        
        if consumos_30d > 50:
            return "¡Eres muy activo! Actualiza a Premium para estadísticas avanzadas y insights personalizados."
        
        if consumos_30d > 20:
            return "¡Buen progreso! Actualiza a Premium para metas personalizadas y análisis detallados."
        
        return "¡Comienza tu viaje de hidratación! Actualiza a Premium para funcionalidades avanzadas."


class NoAdsView(APIView):
    """
    Vista para verificar si el usuario debe ver anuncios.
    Endpoint simple y rápido para el frontend.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna el estado premium del usuario para lógica de anuncios.
        """
        is_premium = request.user.es_premium
        return Response({'is_premium': is_premium})