"""
Servicio para la lógica de negocio premium.
"""

from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from ..models import Bebida, Consumo


class PremiumService:
    """
    Servicio para la lógica de negocio premium.
    """
    
    def __init__(self, user):
        self.user = user
    
    def calculate_personalized_goal(self):
        """
        Calcula la meta personalizada basada en peso, edad y perfil del usuario.
        Usa el mismo método calcular_meta_hidratacion() que el resto de la aplicación.
        """
        peso_kg = self.user.peso or 70  # Peso por defecto
        nivel_actividad = getattr(self.user, 'nivel_actividad', 'moderado')
        
        # Usar el método estándar de cálculo de meta que incluye:
        # - Cálculo basado en edad y peso
        # - Reducción del 20% (porque el 20% viene de los alimentos)
        # - Límites de seguridad
        meta_ml = self.user.calcular_meta_hidratacion()
        
        # Fallback defensivo
        if not meta_ml or meta_ml <= 0:
            meta_ml = self.user.meta_diaria_ml or 2000
        
        # Factores de actividad (para información, aunque no se usen en el cálculo)
        activity_factors = {
            'sedentario': 1.0,
            'ligero': 1.1,
            'moderado': 1.2,
            'intenso': 1.4,
            'muy_intenso': 1.6
        }
        
        factor_actividad = activity_factors.get(nivel_actividad, 1.2)
        
        return {
            'meta_ml': meta_ml,
            'peso_kg': peso_kg,
            'nivel_actividad': nivel_actividad,
            'factor_actividad': factor_actividad,
            'formula_usada': 'calcular_meta_hidratacion() - Basada en edad, peso y perfil de salud'
        }
    
    def get_premium_beverages(self):
        """
        Obtiene todas las bebidas disponibles para usuarios premium.
        """
        bebidas = Bebida.objects.filter(activa=True).order_by('nombre')
        
        data = []
        for bebida in bebidas:
            data.append({
                'id': bebida.id,
                'nombre': bebida.nombre,
                'factor_hidratacion': bebida.factor_hidratacion,
                'es_premium': bebida.es_premium,
                'descripcion': bebida.descripcion,
                'calorias_por_ml': bebida.calorias_por_ml
            })
        
        return data
    
    def get_premium_reminders_stats(self):
        """
        Obtiene estadísticas de recordatorios premium.
        """
        from ..models import Recordatorio
        
        total_recordatorios = Recordatorio.objects.filter(usuario=self.user).count()
        recordatorios_activos = Recordatorio.objects.filter(
            usuario=self.user, activo=True
        ).count()
        
        return {
            'total_recordatorios': total_recordatorios,
            'recordatorios_activos': recordatorios_activos,
            'limite': None,  # Ilimitados para premium
            'restante': None
        }
    
    def get_premium_insights(self, days=30):
        """
        Obtiene insights premium del usuario.
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
        
        # Análisis de bebidas favoritas
        bebidas_favoritas = consumos.values('bebida__nombre').annotate(
            cantidad=Count('id'),
            total_ml=Sum('cantidad_ml')
        ).order_by('-cantidad')[:5]
        
        # Horarios más activos (compatible con SQLite)
        horarios_activos = consumos.extra(
            select={'hora': 'strftime("%H", fecha_hora)'}
        ).values('hora').annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')[:3]
        
        return {
            'total_consumos': total_consumos,
            'total_ml': total_ml,
            'total_hidratacion_efectiva_ml': total_hidratacion,
            'periodo_analisis': f"{fecha_inicio} a {fecha_fin}",
            'bebidas_favoritas': list(bebidas_favoritas),
            'horarios_activos': list(horarios_activos),
            'promedio_diario_ml': round(total_ml / max(1, days), 2)
        }
