"""
Servicio para la lógica de negocio de estadísticas.
"""

from django.db.models import Sum, Count, Avg, Max, Min
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta

from ..models import Consumo


class StatsService:
    """
    Servicio para la lógica de negocio de estadísticas.
    """
    
    def __init__(self, user):
        self.user = user
    
    def get_daily_stats(self, fecha=None):
        """
        Obtiene estadísticas diarias.
        """
        if fecha is None:
            fecha = timezone.now().date()
        
        consumos = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date=fecha
        )
        
        stats = consumos.aggregate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva'),
            cantidad=Count('id'),
            promedio_ml=Avg('cantidad_ml'),
            max_ml=Max('cantidad_ml'),
            min_ml=Min('cantidad_ml')
        )
        
        return {
            'fecha': fecha,
            'total_ml': stats['total_ml'] or 0,
            'total_hidratacion_efectiva_ml': stats['total_hidratacion'] or 0,
            'cantidad_consumos': stats['cantidad'] or 0,
            'promedio_ml': round(stats['promedio_ml'] or 0, 2),
            'max_ml': stats['max_ml'] or 0,
            'min_ml': stats['min_ml'] or 0
        }
    
    def get_weekly_stats(self, fecha_inicio=None):
        """
        Obtiene estadísticas semanales.
        """
        if fecha_inicio is None:
            hoy = timezone.now().date()
            fecha_inicio = hoy - timedelta(days=hoy.weekday())
        
        fecha_fin = fecha_inicio + timedelta(days=6)
        
        consumos = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        )
        
        stats = consumos.aggregate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva'),
            cantidad=Count('id'),
            promedio_diario=Avg('cantidad_ml')
        )
        
        return {
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_ml': stats['total_ml'] or 0,
            'total_hidratacion_efectiva_ml': stats['total_hidratacion'] or 0,
            'cantidad_consumos': stats['cantidad'] or 0,
            'promedio_diario_ml': round(stats['promedio_diario'] or 0, 2)
        }
    
    def get_monthly_stats(self, fecha_inicio=None):
        """
        Obtiene estadísticas mensuales.
        """
        if fecha_inicio is None:
            hoy = timezone.now().date()
            fecha_inicio = hoy.replace(day=1)
        
        # Obtener fin del mes
        if fecha_inicio.month == 12:
            fecha_fin = fecha_inicio.replace(year=fecha_inicio.year + 1, month=1) - timedelta(days=1)
        else:
            fecha_fin = fecha_inicio.replace(month=fecha_inicio.month + 1) - timedelta(days=1)
        
        consumos = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        )
        
        stats = consumos.aggregate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva'),
            cantidad=Count('id'),
            promedio_diario=Avg('cantidad_ml')
        )
        
        return {
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_ml': stats['total_ml'] or 0,
            'total_hidratacion_efectiva_ml': stats['total_hidratacion'] or 0,
            'cantidad_consumos': stats['cantidad'] or 0,
            'promedio_diario_ml': round(stats['promedio_diario'] or 0, 2)
        }
    
    def get_trends(self, period='weekly'):
        """
        Obtiene tendencias de consumo.
        """
        if period == 'daily':
            return self._get_daily_trends()
        elif period == 'weekly':
            return self._get_weekly_trends()
        elif period == 'monthly':
            return self._get_monthly_trends()
        else:
            raise ValueError("Periodo no válido. Use: daily, weekly, o monthly")
    
    def _get_daily_trends(self):
        """
        Obtiene tendencias diarias.
        """
        # Últimos 7 días
        fecha_fin = timezone.now().date()
        fecha_inicio = fecha_fin - timedelta(days=6)
        
        consumos = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        ).extra(
            select={'fecha': 'DATE(fecha_hora)'}
        ).values('fecha').annotate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva')
        ).order_by('fecha')
        
        return list(consumos)
    
    def _get_weekly_trends(self):
        """
        Obtiene tendencias semanales.
        """
        # Últimas 8 semanas
        fecha_fin = timezone.now().date()
        fecha_inicio = fecha_fin - timedelta(weeks=7)
        
        # Para SQLite, usar una aproximación más simple
        consumos = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        ).extra(
            select={'semana': 'date(fecha_hora, "weekday 0", "-6 days")'}
        ).values('semana').annotate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva')
        ).order_by('semana')
        
        return list(consumos)
    
    def _get_monthly_trends(self):
        """
        Obtiene tendencias mensuales.
        """
        # Últimos 6 meses
        fecha_fin = timezone.now().date()
        fecha_inicio = fecha_fin - timedelta(days=180)
        
        # Para SQLite, usar una aproximación más simple
        consumos = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        ).extra(
            select={'mes': 'date(fecha_hora, "start of month")'}
        ).values('mes').annotate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva')
        ).order_by('mes')
        
        return list(consumos)
