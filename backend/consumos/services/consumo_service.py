"""
Servicio para la lógica de negocio de consumos.
"""

from django.db.models import Sum, Count, Avg, Max, Min
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta, datetime
from collections import defaultdict

from ..models import Consumo
from ..utils.cache_utils import CacheManager, cache_user_data


class ConsumoService:
    """
    Servicio para la lógica de negocio de consumos.
    """
    
    def __init__(self, user):
        self.user = user
    
    @cache_user_data(timeout=300)
    def get_daily_summary(self, fecha=None):
        """
        Obtiene un resumen diario de consumos con caché.
        """
        if fecha is None:
            fecha = timezone.now().date()
        
        # Usar select_related para optimizar consultas
        consumos_dia = Consumo.objects.select_related('bebida', 'recipiente').filter(
            usuario=self.user, fecha_hora__date=fecha
        )
        
        # Usar una sola consulta de agregación
        stats = consumos_dia.aggregate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva'),
            cantidad_consumos=Count('id')
        )
        
        total_ml = stats['total_ml'] or 0
        total_hidratacion = stats['total_hidratacion'] or 0
        cantidad_consumos = stats['cantidad_consumos'] or 0
        
        # Obtener meta del usuario
        meta_ml = self.user.meta_diaria_ml
        progreso_porcentaje = (total_hidratacion / meta_ml * 100) if meta_ml > 0 else 0
        
        return {
            'fecha': fecha,
            'total_ml': total_ml,
            'total_hidratacion_efectiva_ml': total_hidratacion,
            'cantidad_consumos': cantidad_consumos,
            'meta_ml': meta_ml,
            'progreso_porcentaje': min(progreso_porcentaje, 100),
            'completada': total_hidratacion >= meta_ml
        }
    
    def get_weekly_summary(self, fecha_inicio=None):
        """
        Obtiene un resumen semanal de consumos.
        """
        if fecha_inicio is None:
            hoy = timezone.now().date()
            fecha_inicio = hoy - timedelta(days=hoy.weekday())
        
        fecha_fin = fecha_inicio + timedelta(days=6)
        
        consumos_semana = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        )
        
        total_ml = consumos_semana.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        total_hidratacion = consumos_semana.aggregate(total=Sum('cantidad_hidratacion_efectiva'))['total'] or 0
        cantidad_consumos = consumos_semana.count()
        
        # Estadísticas por día
        dias_detalle = []
        for i in range(7):
            dia = fecha_inicio + timedelta(days=i)
            consumos_dia = consumos_semana.filter(fecha_hora__date=dia)
            
            total_dia = consumos_dia.aggregate(total=Sum('cantidad_ml'))['total'] or 0
            hidratacion_dia = consumos_dia.aggregate(total=Sum('cantidad_hidratacion_efectiva'))['total'] or 0
            
            dias_detalle.append({
                'fecha': dia,
                'total_ml': total_dia,
                'total_hidratacion_ml': hidratacion_dia,
                'cantidad_consumos': consumos_dia.count()
            })
        
        return {
            'semana_inicio': fecha_inicio,
            'semana_fin': fecha_fin,
            'total_ml': total_ml,
            'total_hidratacion_efectiva_ml': total_hidratacion,
            'cantidad_consumos': cantidad_consumos,
            'promedio_diario_ml': total_ml / 7,
            'dias_detalle': dias_detalle
        }
    
    def get_monthly_summary(self, fecha_inicio=None):
        """
        Obtiene un resumen mensual de consumos.
        """
        if fecha_inicio is None:
            hoy = timezone.now().date()
            fecha_inicio = hoy.replace(day=1)
        
        # Obtener fin del mes
        if fecha_inicio.month == 12:
            fecha_fin = fecha_inicio.replace(year=fecha_inicio.year + 1, month=1) - timedelta(days=1)
        else:
            fecha_fin = fecha_inicio.replace(month=fecha_inicio.month + 1) - timedelta(days=1)
        
        consumos_mes = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        )
        
        total_ml = consumos_mes.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        total_hidratacion = consumos_mes.aggregate(total=Sum('cantidad_hidratacion_efectiva'))['total'] or 0
        cantidad_consumos = consumos_mes.count()
        
        # Estadísticas por semana
        semanas_detalle = []
        current_date = fecha_inicio
        semana_num = 1
        
        while current_date <= fecha_fin:
            semana_fin = min(current_date + timedelta(days=6), fecha_fin)
            
            consumos_semana = consumos_mes.filter(
                fecha_hora__date__range=[current_date, semana_fin]
            )
            
            total_semana = consumos_semana.aggregate(total=Sum('cantidad_ml'))['total'] or 0
            hidratacion_semana = consumos_semana.aggregate(total=Sum('cantidad_hidratacion_efectiva'))['total'] or 0
            
            semanas_detalle.append({
                'semana': semana_num,
                'inicio': current_date,
                'fin': semana_fin,
                'total_ml': total_semana,
                'total_hidratacion_ml': hidratacion_semana,
                'cantidad_consumos': consumos_semana.count()
            })
            
            current_date = semana_fin + timedelta(days=1)
            semana_num += 1
        
        return {
            'mes_inicio': fecha_inicio,
            'mes_fin': fecha_fin,
            'total_ml': total_ml,
            'total_hidratacion_efectiva_ml': total_hidratacion,
            'cantidad_consumos': cantidad_consumos,
            'promedio_diario_ml': total_ml / ((fecha_fin - fecha_inicio).days + 1),
            'semanas_detalle': semanas_detalle
        }
    
    def get_trends(self, period='weekly'):
        """
        Obtiene tendencias de consumo.
        """
        if period == 'weekly':
            fecha_fin = timezone.now().date()
            fecha_inicio = fecha_fin - timedelta(days=7)
        elif period == 'monthly':
            fecha_fin = timezone.now().date()
            fecha_inicio = fecha_fin - timedelta(days=30)
        else:
            raise ValueError('Periodo no válido. Use: weekly o monthly')
        
        # Consumos del periodo actual
        consumos_actual = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        )
        
        # Consumos del periodo anterior
        duracion = fecha_fin - fecha_inicio
        fecha_inicio_anterior = fecha_inicio - duracion
        fecha_fin_anterior = fecha_inicio
        
        consumos_anterior = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio_anterior, fecha_fin_anterior]
        )
        
        # Calcular totales
        total_actual = consumos_actual.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        total_anterior = consumos_anterior.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        
        # Calcular cambios
        cambio_ml = total_actual - total_anterior
        cambio_porcentaje = (cambio_ml / total_anterior * 100) if total_anterior > 0 else 0
        
        # Determinar tendencia
        if cambio_porcentaje > 10:
            tendencia = "Aumento significativo"
        elif cambio_porcentaje > 5:
            tendencia = "Aumento moderado"
        elif cambio_porcentaje > -5:
            tendencia = "Estable"
        elif cambio_porcentaje > -10:
            tendencia = "Disminución moderada"
        else:
            tendencia = "Disminución significativa"
        
        return {
            'periodo': period,
            'tendencia': tendencia,
            'cambio_porcentaje': round(cambio_porcentaje, 2),
            'cambio_ml': cambio_ml,
            'total_anterior': total_anterior,
            'total_actual': total_actual
        }
    
    def get_insights(self, days=30):
        """
        Obtiene insights y análisis de consumos.
        """
        fecha_fin = timezone.now().date()
        fecha_inicio = fecha_fin - timedelta(days=days)
        
        consumos = Consumo.objects.filter(
            usuario=self.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        ).select_related('bebida')
        
        # Estadísticas básicas
        total_consumos = consumos.count()
        total_ml = consumos.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        total_hidratacion = consumos.aggregate(total=Sum('cantidad_hidratacion_efectiva'))['total'] or 0
        
        # Análisis de patrones
        patrones = self._analyze_patterns(consumos)
        
        # Insights
        insights = self._generate_insights(consumos, total_ml, total_hidratacion)
        
        # Recomendaciones
        recomendaciones = self._generate_recommendations(consumos, total_ml, total_hidratacion)
        
        return {
            'total_consumos': total_consumos,
            'total_ml': total_ml,
            'total_hidratacion_efectiva_ml': total_hidratacion,
            'periodo_analisis': f"{fecha_inicio} a {fecha_fin}",
            'insights': insights,
            'patrones': patrones,
            'recomendaciones': recomendaciones
        }
    
    def _analyze_patterns(self, consumos):
        """
        Analiza patrones en los consumos.
        """
        patrones = []
        
        # Patrón por horas
        consumos_por_hora = defaultdict(int)
        for consumo in consumos:
            hora = consumo.fecha_hora.hour
            consumos_por_hora[hora] += consumo.cantidad_ml
        
        if consumos_por_hora:
            hora_pico = max(consumos_por_hora.items(), key=lambda x: x[1])[0]
            patrones.append({
                'tipo': 'hora_pico',
                'descripcion': f'Tu hora de mayor consumo es las {hora_pico}:00',
                'valor': hora_pico,
                'unidad': 'hora'
            })
        
        # Patrón por días de la semana
        consumos_por_dia = defaultdict(int)
        for consumo in consumos:
            dia_semana = consumo.fecha_hora.weekday()
            consumos_por_dia[dia_semana] += consumo.cantidad_ml
        
        if consumos_por_dia:
            dias_nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            dia_pico = max(consumos_por_dia.items(), key=lambda x: x[1])[0]
            patrones.append({
                'tipo': 'dia_pico',
                'descripcion': f'Tu día de mayor consumo es el {dias_nombres[dia_pico]}',
                'valor': dia_pico,
                'unidad': 'dia_semana'
            })
        
        return patrones
    
    def _generate_insights(self, consumos, total_ml, total_hidratacion):
        """
        Genera insights basados en los datos de consumo.
        """
        insights = []
        
        # Insight de consistencia
        dias_con_consumo = consumos.values('fecha_hora__date').distinct().count()
        dias_totales = 30  # Últimos 30 días
        consistencia = (dias_con_consumo / dias_totales) * 100
        
        if consistencia >= 80:
            insights.append({
                'tipo': 'consistencia',
                'titulo': 'Excelente consistencia',
                'descripcion': f'Has registrado consumos en el {consistencia:.1f}% de los días',
                'nivel': 'positivo'
            })
        elif consistencia >= 60:
            insights.append({
                'tipo': 'consistencia',
                'titulo': 'Buena consistencia',
                'descripcion': f'Has registrado consumos en el {consistencia:.1f}% de los días',
                'nivel': 'neutral'
            })
        else:
            insights.append({
                'tipo': 'consistencia',
                'titulo': 'Consistencia mejorable',
                'descripcion': f'Has registrado consumos en el {consistencia:.1f}% de los días',
                'nivel': 'negativo'
            })
        
        return insights
    
    def _generate_recommendations(self, consumos, total_ml, total_hidratacion):
        """
        Genera recomendaciones basadas en los datos de consumo.
        """
        recomendaciones = []
        
        # Recomendación basada en cantidad total
        promedio_diario = total_ml / 30  # Últimos 30 días
        
        if promedio_diario < 1500:
            recomendaciones.append("Considera aumentar tu consumo diario de agua para alcanzar la recomendación de 2L diarios")
        elif promedio_diario > 4000:
            recomendaciones.append("Tu consumo es muy alto. Asegúrate de que sea saludable y consulta con un profesional si es necesario")
        
        return recomendaciones
