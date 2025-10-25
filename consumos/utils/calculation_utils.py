"""
Utilidades para cálculos y fórmulas.
"""

from django.utils import timezone
from datetime import timedelta


class CalculationUtils:
    """
    Utilidades para cálculos y fórmulas.
    """
    
    @staticmethod
    def calculate_hydration_goal(weight_kg, activity_level='moderate'):
        """
        Calcula la meta de hidratación basada en peso y nivel de actividad.
        
        Args:
            weight_kg (float): Peso en kilogramos
            activity_level (str): Nivel de actividad ('low', 'moderate', 'high', 'very_high')
        
        Returns:
            int: Meta de hidratación en ml
        """
        # Factor base: 35ml por kg de peso
        base_factor = 35
        
        # Factores de actividad
        activity_factors = {
            'low': 1.0,
            'moderate': 1.2,
            'high': 1.4,
            'very_high': 1.6
        }
        
        factor = activity_factors.get(activity_level, 1.2)
        goal_ml = int(weight_kg * base_factor * factor)
        
        return goal_ml
    
    @staticmethod
    def calculate_hydration_efficiency(total_ml, effective_hydration_ml):
        """
        Calcula la eficiencia de hidratación.
        
        Args:
            total_ml (int): Total de ml consumidos
            effective_hydration_ml (int): Hidratación efectiva en ml
        
        Returns:
            float: Eficiencia como porcentaje (0-100)
        """
        if total_ml <= 0:
            return 0.0
        
        efficiency = (effective_hydration_ml / total_ml) * 100
        return min(efficiency, 100.0)
    
    @staticmethod
    def calculate_progress_percentage(current_ml, goal_ml):
        """
        Calcula el porcentaje de progreso hacia la meta.
        
        Args:
            current_ml (int): Consumo actual en ml
            goal_ml (int): Meta en ml
        
        Returns:
            float: Porcentaje de progreso (0-100+)
        """
        if goal_ml <= 0:
            return 0.0
        
        progress = (current_ml / goal_ml) * 100
        return progress
    
    @staticmethod
    def calculate_daily_average(consumos_queryset, days=30):
        """
        Calcula el promedio diario de consumo.
        
        Args:
            consumos_queryset: QuerySet de consumos
            days (int): Número de días a considerar
        
        Returns:
            float: Promedio diario en ml
        """
        fecha_inicio = timezone.now().date() - timedelta(days=days)
        consumos = consumos_queryset.filter(fecha_hora__date__gte=fecha_inicio)
        
        total_ml = consumos.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        return total_ml / days
    
    @staticmethod
    def calculate_weekly_average(consumos_queryset, weeks=4):
        """
        Calcula el promedio semanal de consumo.
        
        Args:
            consumos_queryset: QuerySet de consumos
            weeks (int): Número de semanas a considerar
        
        Returns:
            float: Promedio semanal en ml
        """
        fecha_inicio = timezone.now().date() - timedelta(weeks=weeks)
        consumos = consumos_queryset.filter(fecha_hora__date__gte=fecha_inicio)
        
        total_ml = consumos.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        return total_ml / weeks
    
    @staticmethod
    def calculate_consistency_score(consumos_queryset, days=30):
        """
        Calcula el puntaje de consistencia del usuario.
        
        Args:
            consumos_queryset: QuerySet de consumos
            days (int): Número de días a considerar
        
        Returns:
            float: Puntaje de consistencia (0-100)
        """
        fecha_inicio = timezone.now().date() - timedelta(days=days)
        consumos = consumos_queryset.filter(fecha_hora__date__gte=fecha_inicio)
        
        # Días con consumo
        dias_con_consumo = consumos.values('fecha_hora__date').distinct().count()
        
        # Calcular consistencia
        consistency = (dias_con_consumo / days) * 100
        return min(consistency, 100.0)
    
    @staticmethod
    def calculate_trend_percentage(current_period, previous_period):
        """
        Calcula el porcentaje de cambio entre dos periodos.
        
        Args:
            current_period (float): Valor del periodo actual
            previous_period (float): Valor del periodo anterior
        
        Returns:
            float: Porcentaje de cambio
        """
        if previous_period <= 0:
            return 0.0
        
        change = ((current_period - previous_period) / previous_period) * 100
        return change
    
    @staticmethod
    def calculate_bmi(weight_kg, height_m):
        """
        Calcula el Índice de Masa Corporal (BMI).
        
        Args:
            weight_kg (float): Peso en kilogramos
            height_m (float): Altura en metros
        
        Returns:
            float: BMI
        """
        if height_m <= 0:
            return 0.0
        
        bmi = weight_kg / (height_m ** 2)
        return round(bmi, 1)
    
    @staticmethod
    def get_bmi_category(bmi):
        """
        Obtiene la categoría del BMI.
        
        Args:
            bmi (float): Índice de Masa Corporal
        
        Returns:
            str: Categoría del BMI
        """
        if bmi < 18.5:
            return "Bajo peso"
        elif bmi < 25:
            return "Peso normal"
        elif bmi < 30:
            return "Sobrepeso"
        else:
            return "Obesidad"
    
    @staticmethod
    def calculate_water_intake_recommendation(weight_kg, activity_level='moderate', climate='temperate'):
        """
        Calcula la recomendación de ingesta de agua basada en múltiples factores.
        
        Args:
            weight_kg (float): Peso en kilogramos
            activity_level (str): Nivel de actividad
            climate (str): Clima ('temperate', 'hot', 'cold')
        
        Returns:
            int: Recomendación de ingesta en ml
        """
        # Base: 35ml por kg
        base_ml = weight_kg * 35
        
        # Factores de actividad
        activity_factors = {
            'low': 1.0,
            'moderate': 1.2,
            'high': 1.4,
            'very_high': 1.6
        }
        
        # Factores de clima
        climate_factors = {
            'temperate': 1.0,
            'hot': 1.3,
            'cold': 0.9
        }
        
        activity_factor = activity_factors.get(activity_level, 1.2)
        climate_factor = climate_factors.get(climate, 1.0)
        
        recommendation = int(base_ml * activity_factor * climate_factor)
        return recommendation
