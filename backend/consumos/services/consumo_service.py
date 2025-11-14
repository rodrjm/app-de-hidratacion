"""
Servicio para la lógica de negocio de consumos.
"""

from django.db.models import Sum, Count, Avg, Max, Min
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta, datetime, timezone as dt_timezone
from zoneinfo import ZoneInfo
from typing import Optional
from collections import defaultdict

from ..models import Consumo
from ..utils.cache_utils import CacheManager, cache_user_data


class ConsumoService:
    """
    Servicio para la lógica de negocio de consumos.
    """
    
    def __init__(self, user):
        self.user = user
    
    def get_daily_summary(self, fecha=None, tz_name: Optional[str] = None):
        """
        Obtiene un resumen diario de consumos con caché.
        """
        if fecha is None:
            fecha = timezone.now().date()
        
        # Construir límites del día en zona horaria del usuario y convertir a UTC
        tzinfo = None
        if tz_name:
            try:
                tzinfo = ZoneInfo(tz_name)
            except Exception:
                tzinfo = None
        if tzinfo is None:
            tzinfo = timezone.get_current_timezone()

        start_local = datetime(fecha.year, fecha.month, fecha.day, 0, 0, 0, 0, tzinfo=tzinfo)
        end_local = datetime(fecha.year, fecha.month, fecha.day, 23, 59, 59, 999000, tzinfo=tzinfo)
        start_utc = start_local.astimezone(dt_timezone.utc)
        end_utc = end_local.astimezone(dt_timezone.utc)
        
        # Usar select_related para optimizar consultas
        consumos_dia = Consumo.objects.select_related('bebida', 'recipiente').filter(
            usuario=self.user, fecha_hora__range=[start_utc, end_utc]
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
    
    def get_trends(self, period='weekly', tz_name: Optional[str] = None):
        """
        Obtiene tendencias de consumo.
        Soporta zona horaria del usuario para cálculos precisos.
        """
        # Determinar zona horaria
        tzinfo = None
        if tz_name:
            try:
                tzinfo = ZoneInfo(tz_name)
            except Exception:
                tzinfo = None
        if tzinfo is None:
            tzinfo = timezone.get_current_timezone()
        
        # Obtener fecha/hora actual en la zona del usuario
        now_local = timezone.now().astimezone(tzinfo)
        
        if period == 'daily':
            # Hoy vs Ayer en zona del usuario
            hoy_local = now_local.date()
            ayer_local = hoy_local - timedelta(days=1)
            
            # Construir rangos UTC para hoy
            start_hoy = datetime(hoy_local.year, hoy_local.month, hoy_local.day, 0, 0, 0, 0, tzinfo=tzinfo)
            end_hoy = datetime(hoy_local.year, hoy_local.month, hoy_local.day, 23, 59, 59, 999000, tzinfo=tzinfo)
            start_hoy_utc = start_hoy.astimezone(dt_timezone.utc)
            end_hoy_utc = end_hoy.astimezone(dt_timezone.utc)
            
            # Construir rangos UTC para ayer
            start_ayer = datetime(ayer_local.year, ayer_local.month, ayer_local.day, 0, 0, 0, 0, tzinfo=tzinfo)
            end_ayer = datetime(ayer_local.year, ayer_local.month, ayer_local.day, 23, 59, 59, 999000, tzinfo=tzinfo)
            start_ayer_utc = start_ayer.astimezone(dt_timezone.utc)
            end_ayer_utc = end_ayer.astimezone(dt_timezone.utc)
            
            # Consumos de hoy (actual)
            consumos_actual = Consumo.objects.filter(
                usuario=self.user,
                fecha_hora__range=[start_hoy_utc, end_hoy_utc]
            )
            
            # Consumos de ayer (anterior)
            consumos_anterior = Consumo.objects.filter(
                usuario=self.user,
                fecha_hora__range=[start_ayer_utc, end_ayer_utc]
            )
        else:
            # Para otros períodos, usar ventanas móviles (7/30/365 días) en TZ del usuario y convertir a UTC
            today_local = now_local.date()
            if period == 'weekly':
                window_days = 7
            elif period == 'monthly':
                window_days = 30
            elif period == 'annual':
                window_days = 365
            else:
                raise ValueError('Periodo no válido. Use: daily, weekly, monthly o annual')

            curr_start_local = today_local - timedelta(days=window_days - 1)
            curr_end_local = today_local
            prev_end_local = curr_start_local - timedelta(days=1)
            prev_start_local = prev_end_local - timedelta(days=window_days - 1)

            start_curr = datetime(curr_start_local.year, curr_start_local.month, curr_start_local.day, 0, 0, 0, 0, tzinfo=tzinfo)
            end_curr = datetime(curr_end_local.year, curr_end_local.month, curr_end_local.day, 23, 59, 59, 999000, tzinfo=tzinfo)
            start_prev = datetime(prev_start_local.year, prev_start_local.month, prev_start_local.day, 0, 0, 0, 0, tzinfo=tzinfo)
            end_prev = datetime(prev_end_local.year, prev_end_local.month, prev_end_local.day, 23, 59, 59, 999000, tzinfo=tzinfo)

            start_curr_utc = start_curr.astimezone(dt_timezone.utc)
            end_curr_utc = end_curr.astimezone(dt_timezone.utc)
            start_prev_utc = start_prev.astimezone(dt_timezone.utc)
            end_prev_utc = end_prev.astimezone(dt_timezone.utc)
        
        # Consumos del periodo actual
        consumos_actual = Consumo.objects.filter(
            usuario=self.user,
                fecha_hora__range=[start_curr_utc, end_curr_utc]
        )
        # Consumos del periodo anterior
        consumos_anterior = Consumo.objects.filter(
            usuario=self.user,
                fecha_hora__range=[start_prev_utc, end_prev_utc]
        )
        
        # Calcular totales
        total_actual = consumos_actual.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        total_anterior = consumos_anterior.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        
        # Calcular cambios
        cambio_ml = total_actual - total_anterior
        if total_anterior > 0:
            cambio_porcentaje = (cambio_ml / total_anterior) * 100
        else:
            # Si no hay datos previos, no hay cambio que calcular
            cambio_porcentaje = None
        
        # Determinar tendencia
        if cambio_porcentaje is None:
            if total_actual > 0:
                tendencia = "Sin comparación (sin datos previos)"
            else:
                tendencia = "Sin datos"
        elif cambio_porcentaje > 10:
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
            'cambio_porcentaje': round(cambio_porcentaje, 2) if cambio_porcentaje is not None else None,
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
