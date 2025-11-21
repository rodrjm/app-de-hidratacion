"""
Servicio para la lógica de negocio de monetización.
"""

from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta

from ..models import Consumo, Recordatorio, MetaDiaria


class MonetizationService:
    """
    Servicio para la lógica de negocio de monetización.
    """
    
    def __init__(self, user):
        self.user = user
    
    def get_usage_limits(self):
        """
        Obtiene los límites de uso del usuario.
        """
        # Límites para usuarios gratuitos
        max_recordatorios_gratuitos = 3
        max_consumos_diarios = 10
        
        # Contar uso actual
        recordatorios_actuales = Recordatorio.objects.filter(usuario=self.user).count()
        consumos_hoy = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date=timezone.now().date()
        ).count()
        
        return {
            'recordatorios': {
                'actual': recordatorios_actuales,
                'limite': max_recordatorios_gratuitos if not self.user.es_premium else None,
                'restante': max(0, max_recordatorios_gratuitos - recordatorios_actuales) if not self.user.es_premium else None
            },
            'consumos_diarios': {
                'actual': consumos_hoy,
                'limite': max_consumos_diarios if not self.user.es_premium else None,
                'restante': max(0, max_consumos_diarios - consumos_hoy) if not self.user.es_premium else None
            }
        }
    
    def get_monetization_stats(self):
        """
        Obtiene estadísticas de monetización.
        """
        # Solo para staff
        if not self.user.is_staff:
            return None
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        total_usuarios = User.objects.count()
        usuarios_premium = User.objects.filter(es_premium=True).count()
        usuarios_gratuitos = total_usuarios - usuarios_premium
        
        # Consumos de los últimos 30 días
        fecha_inicio = timezone.now().date() - timedelta(days=30)
        consumos_recientes = Consumo.objects.filter(
            fecha_hora__date__gte=fecha_inicio
        ).count()
        
        return {
            'total_usuarios': total_usuarios,
            'usuarios_premium': usuarios_premium,
            'usuarios_gratuitos': usuarios_gratuitos,
            'tasa_conversion': (usuarios_premium / total_usuarios * 100) if total_usuarios > 0 else 0,
            'consumos_ultimos_30_dias': consumos_recientes
        }
    
    def get_upgrade_prompt(self):
        """
        Obtiene sugerencias de upgrade personalizadas.
        """
        if self.user.es_premium:
            return None
        
        # Analizar comportamiento del usuario
        consumos_ultimos_7_dias = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__gte=timezone.now().date() - timedelta(days=7)
        ).count()
        
        recordatorios_actuales = Recordatorio.objects.filter(usuario=self.user).count()
        
        # Generar sugerencias basadas en el uso
        sugerencias = []
        
        if consumos_ultimos_7_dias > 20:
            sugerencias.append("Estadísticas avanzadas para analizar tus patrones de hidratación")
        
        if recordatorios_actuales >= 3:
            sugerencias.append("Recordatorios ilimitados para una hidratación más efectiva")
        
        if not sugerencias:
            sugerencias.append("Meta personalizada basada en tu peso y actividad")
            sugerencias.append("Sin anuncios para una experiencia más limpia")
        
        return {
            'sugerencias': sugerencias,
            'beneficios': [
                "Meta diaria personalizada",
                "Estadísticas y análisis avanzados",
                "Recordatorios ilimitados",
                "Sin anuncios",
                "Bebidas premium",
                "Insights inteligentes"
            ]
        }
