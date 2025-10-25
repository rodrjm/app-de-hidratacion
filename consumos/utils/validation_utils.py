"""
Utilidades para validación de datos.
"""

from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta


class ValidationUtils:
    """
    Utilidades para validación de datos.
    """
    
    @staticmethod
    def validate_positive_number(value, field_name="valor"):
        """
        Valida que un número sea positivo.
        
        Args:
            value: Valor a validar
            field_name (str): Nombre del campo para el mensaje de error
        
        Raises:
            ValidationError: Si el valor no es positivo
        """
        if value is None:
            raise ValidationError(f"{field_name} no puede ser nulo")
        
        if not isinstance(value, (int, float)):
            raise ValidationError(f"{field_name} debe ser un número")
        
        if value <= 0:
            raise ValidationError(f"{field_name} debe ser mayor a 0")
    
    @staticmethod
    def validate_date_range(start_date, end_date):
        """
        Valida que un rango de fechas sea válido.
        
        Args:
            start_date: Fecha de inicio
            end_date: Fecha de fin
        
        Raises:
            ValidationError: Si el rango no es válido
        """
        if start_date is None or end_date is None:
            raise ValidationError("Las fechas no pueden ser nulas")
        
        if start_date > end_date:
            raise ValidationError("La fecha de inicio no puede ser mayor a la fecha de fin")
        
        # Validar que no sea muy lejano en el futuro
        max_future_date = timezone.now().date() + timedelta(days=365)
        if start_date > max_future_date or end_date > max_future_date:
            raise ValidationError("Las fechas no pueden ser más de un año en el futuro")
    
    @staticmethod
    def validate_future_date(date_obj, field_name="fecha"):
        """
        Valida que una fecha no sea futura.
        
        Args:
            date_obj: Fecha a validar
            field_name (str): Nombre del campo para el mensaje de error
        
        Raises:
            ValidationError: Si la fecha es futura
        """
        if date_obj is None:
            raise ValidationError(f"{field_name} no puede ser nula")
        
        if date_obj > timezone.now():
            raise ValidationError(f"{field_name} no puede ser futura")
    
    @staticmethod
    def validate_past_date(date_obj, field_name="fecha", max_days=365):
        """
        Valida que una fecha no sea muy antigua.
        
        Args:
            date_obj: Fecha a validar
            field_name (str): Nombre del campo para el mensaje de error
            max_days (int): Máximo número de días en el pasado
        
        Raises:
            ValidationError: Si la fecha es muy antigua
        """
        if date_obj is None:
            raise ValidationError(f"{field_name} no puede ser nula")
        
        min_date = timezone.now().date() - timedelta(days=max_days)
        if date_obj < min_date:
            raise ValidationError(f"{field_name} no puede ser más de {max_days} días en el pasado")
    
    @staticmethod
    def validate_string_length(value, max_length, field_name="campo"):
        """
        Valida la longitud de una cadena.
        
        Args:
            value: Valor a validar
            max_length (int): Longitud máxima
            field_name (str): Nombre del campo para el mensaje de error
        
        Raises:
            ValidationError: Si la longitud excede el máximo
        """
        if value is None:
            return
        
        if len(str(value)) > max_length:
            raise ValidationError(f"{field_name} no puede exceder {max_length} caracteres")
    
    @staticmethod
    def validate_email_format(email):
        """
        Valida el formato de un email.
        
        Args:
            email (str): Email a validar
        
        Raises:
            ValidationError: Si el formato no es válido
        """
        if not email:
            raise ValidationError("El email no puede estar vacío")
        
        if '@' not in email or '.' not in email:
            raise ValidationError("El formato del email no es válido")
    
    @staticmethod
    def validate_phone_format(phone):
        """
        Valida el formato de un teléfono.
        
        Args:
            phone (str): Teléfono a validar
        
        Raises:
            ValidationError: Si el formato no es válido
        """
        if not phone:
            return
        
        # Remover caracteres no numéricos
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        if len(clean_phone) < 10:
            raise ValidationError("El teléfono debe tener al menos 10 dígitos")
    
    @staticmethod
    def validate_age(age):
        """
        Valida la edad de un usuario.
        
        Args:
            age (int): Edad a validar
        
        Raises:
            ValidationError: Si la edad no es válida
        """
        if age is None:
            raise ValidationError("La edad no puede ser nula")
        
        if not isinstance(age, int):
            raise ValidationError("La edad debe ser un número entero")
        
        if age < 0:
            raise ValidationError("La edad no puede ser negativa")
        
        if age > 150:
            raise ValidationError("La edad no puede ser mayor a 150 años")
    
    @staticmethod
    def validate_weight(weight_kg):
        """
        Valida el peso de un usuario.
        
        Args:
            weight_kg (float): Peso en kilogramos
        
        Raises:
            ValidationError: Si el peso no es válido
        """
        if weight_kg is None:
            raise ValidationError("El peso no puede ser nulo")
        
        if not isinstance(weight_kg, (int, float)):
            raise ValidationError("El peso debe ser un número")
        
        if weight_kg <= 0:
            raise ValidationError("El peso debe ser mayor a 0")
        
        if weight_kg > 500:
            raise ValidationError("El peso no puede ser mayor a 500 kg")
    
    @staticmethod
    def validate_height(height_cm):
        """
        Valida la altura de un usuario.
        
        Args:
            height_cm (float): Altura en centímetros
        
        Raises:
            ValidationError: Si la altura no es válida
        """
        if height_cm is None:
            raise ValidationError("La altura no puede ser nula")
        
        if not isinstance(height_cm, (int, float)):
            raise ValidationError("La altura debe ser un número")
        
        if height_cm <= 0:
            raise ValidationError("La altura debe ser mayor a 0")
        
        if height_cm > 300:
            raise ValidationError("La altura no puede ser mayor a 300 cm")
    
    @staticmethod
    def validate_hydration_amount(amount_ml):
        """
        Valida la cantidad de hidratación.
        
        Args:
            amount_ml (int): Cantidad en mililitros
        
        Raises:
            ValidationError: Si la cantidad no es válida
        """
        if amount_ml is None:
            raise ValidationError("La cantidad no puede ser nula")
        
        if not isinstance(amount_ml, (int, float)):
            raise ValidationError("La cantidad debe ser un número")
        
        if amount_ml <= 0:
            raise ValidationError("La cantidad debe ser mayor a 0")
        
        if amount_ml > 10000:  # 10 litros
            raise ValidationError("La cantidad no puede ser mayor a 10,000 ml")
    
    @staticmethod
    def validate_time_of_day(time_str):
        """
        Valida el formato de hora del día.
        
        Args:
            time_str (str): Hora en formato HH:MM
        
        Raises:
            ValidationError: Si el formato no es válido
        """
        if not time_str:
            raise ValidationError("La hora no puede estar vacía")
        
        try:
            datetime.strptime(time_str, '%H:%M')
        except ValueError:
            raise ValidationError("El formato de hora debe ser HH:MM (ej: 14:30)")
    
    @staticmethod
    def validate_choice(value, choices, field_name="campo"):
        """
        Valida que un valor esté en una lista de opciones válidas.
        
        Args:
            value: Valor a validar
            choices (list): Lista de opciones válidas
            field_name (str): Nombre del campo para el mensaje de error
        
        Raises:
            ValidationError: Si el valor no está en las opciones
        """
        if value is None:
            raise ValidationError(f"{field_name} no puede ser nulo")
        
        if value not in choices:
            raise ValidationError(f"{field_name} debe ser uno de: {', '.join(choices)}")
