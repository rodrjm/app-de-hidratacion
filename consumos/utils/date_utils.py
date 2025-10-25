"""
Utilidades para manejo de fechas y tiempos.
"""

from django.utils import timezone
from datetime import timedelta, datetime, date


class DateUtils:
    """
    Utilidades para manejo de fechas.
    """
    
    @staticmethod
    def get_week_start(date_obj=None):
        """
        Obtiene el inicio de la semana (lunes) para una fecha dada.
        """
        if date_obj is None:
            date_obj = timezone.now().date()
        
        return date_obj - timedelta(days=date_obj.weekday())
    
    @staticmethod
    def get_week_end(date_obj=None):
        """
        Obtiene el fin de la semana (domingo) para una fecha dada.
        """
        if date_obj is None:
            date_obj = timezone.now().date()
        
        week_start = DateUtils.get_week_start(date_obj)
        return week_start + timedelta(days=6)
    
    @staticmethod
    def get_month_start(date_obj=None):
        """
        Obtiene el inicio del mes para una fecha dada.
        """
        if date_obj is None:
            date_obj = timezone.now().date()
        
        return date_obj.replace(day=1)
    
    @staticmethod
    def get_month_end(date_obj=None):
        """
        Obtiene el fin del mes para una fecha dada.
        """
        if date_obj is None:
            date_obj = timezone.now().date()
        
        if date_obj.month == 12:
            return date_obj.replace(year=date_obj.year + 1, month=1) - timedelta(days=1)
        else:
            return date_obj.replace(month=date_obj.month + 1) - timedelta(days=1)
    
    @staticmethod
    def get_date_range(period, days=30):
        """
        Obtiene un rango de fechas basado en el periodo.
        """
        end_date = timezone.now().date()
        
        if period == 'daily':
            start_date = end_date
        elif period == 'weekly':
            start_date = end_date - timedelta(days=7)
        elif period == 'monthly':
            start_date = end_date - timedelta(days=30)
        elif period == 'custom':
            start_date = end_date - timedelta(days=days)
        else:
            start_date = end_date - timedelta(days=30)
        
        return start_date, end_date
    
    @staticmethod
    def format_date(date_obj, format_str='%Y-%m-%d'):
        """
        Formatea una fecha según el formato especificado.
        """
        if isinstance(date_obj, str):
            return date_obj
        
        return date_obj.strftime(format_str)
    
    @staticmethod
    def parse_date(date_str, format_str='%Y-%m-%d'):
        """
        Parsea una cadena de fecha según el formato especificado.
        """
        try:
            return datetime.strptime(date_str, format_str).date()
        except ValueError:
            return None
    
    @staticmethod
    def is_weekend(date_obj=None):
        """
        Verifica si una fecha es fin de semana.
        """
        if date_obj is None:
            date_obj = timezone.now().date()
        
        return date_obj.weekday() >= 5  # 5 = sábado, 6 = domingo
    
    @staticmethod
    def get_weekday_name(date_obj=None):
        """
        Obtiene el nombre del día de la semana.
        """
        if date_obj is None:
            date_obj = timezone.now().date()
        
        weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        return weekdays[date_obj.weekday()]
    
    @staticmethod
    def get_month_name(date_obj=None):
        """
        Obtiene el nombre del mes.
        """
        if date_obj is None:
            date_obj = timezone.now().date()
        
        months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        return months[date_obj.month - 1]
