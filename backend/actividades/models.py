from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from typing import Optional

User = get_user_model()


class Actividad(models.Model):
    """
    Modelo para registrar actividades físicas del usuario.
    Cada actividad ajusta la meta de hidratación diaria basándose en la Pérdida de Sudor Estimada (PSE).
    """
    
    TIPO_ACTIVIDAD_CHOICES = [
        ('correr', 'Correr'),
        ('ciclismo', 'Ciclismo'),
        ('natacion', 'Natación'),
        ('futbol_rugby', 'Fútbol / Rugby'),
        ('baloncesto_voley', 'Baloncesto / Vóley'),
        ('gimnasio', 'Gimnasio'),
        ('crossfit_hiit', 'CrossFit / Entrenamiento HIIT'),
        ('padel_tenis', 'Pádel / Tenis'),
        ('baile_aerobico', 'Baile aeróbico'),
        ('caminata_rapida', 'Caminata rápida'),
        ('pilates', 'Pilates'),
        ('caminata', 'Caminata'),
        ('yoga_hatha', 'Yoga (Hatha/Suave)'),
        ('yoga_bikram', 'Yoga (Bikram/Caliente)'),
    ]
    
    INTENSIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
    ]
    
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='actividades',
        verbose_name='Usuario',
        help_text='Usuario que realizó la actividad'
    )
    tipo_actividad = models.CharField(
        max_length=30,
        choices=TIPO_ACTIVIDAD_CHOICES,
        verbose_name='Tipo de actividad',
        help_text='Tipo de actividad física realizada'
    )
    duracion_minutos = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(1440)],  # Máximo 24 horas
        verbose_name='Duración (minutos)',
        help_text='Duración de la actividad en minutos'
    )
    intensidad = models.CharField(
        max_length=10,
        choices=INTENSIDAD_CHOICES,
        verbose_name='Intensidad',
        help_text='Intensidad de la actividad (Baja, Media, Alta)'
    )
    fecha_hora = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha y hora',
        help_text='Fecha y hora en que se realizó la actividad'
    )
    pse_calculado = models.PositiveIntegerField(
        verbose_name='PSE Calculado (ml)',
        help_text='Pérdida de Sudor Estimada calculada en mililitros'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
        help_text='Fecha y hora de registro de la actividad'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización',
        help_text='Fecha y hora de última actualización'
    )
    
    class Meta:
        verbose_name = 'Actividad'
        verbose_name_plural = 'Actividades'
        ordering = ['-fecha_hora']
        indexes = [
            models.Index(fields=['usuario', 'fecha_hora']),
            models.Index(fields=['usuario', '-fecha_hora']),
        ]
    
    def __str__(self):
        return f"{self.usuario.username} - {self.get_tipo_actividad_display()} ({self.duracion_minutos} min) - {self.get_intensidad_display()}"
    
    def calcular_pse(self, temperature: Optional[float] = None, humidity: Optional[float] = None):
        """
        Calcula la Pérdida de Sudor Estimada (PSE) según la fórmula:
        PSE (ml) = Duración (minutos) * TS Base (ml/min) * Factor de Intensidad (FI) * Factor Climático
        
        TS Base por tipo de actividad:
        - Correr: 20.0 ml/min
        - Ciclismo: 18.3 ml/min
        - Natación: 13.3 ml/min
        - Fútbol / Rugby: 23.3 ml/min
        - Baloncesto / Vóley: 20.0 ml/min
        - Gimnasio: 13.3 ml/min
        - CrossFit / Entrenamiento HIIT: 25.0 ml/min
        - Pádel / Tenis: 16.7 ml/min
        - Baile aeróbico: 15.0 ml/min
        - Caminata rápida: 8.3 ml/min
        - Pilates: 6.7 ml/min
        - Caminata: 4.2 ml/min
        - Yoga (Hatha/Suave): 5.0 ml/min
        - Yoga (Bikram/Caliente): 25.0 ml/min
        
        Factor de Intensidad:
        - Baja: 0.8
        - Media: 1.0
        - Alta: 1.2
        
        Factor Climático (si se proporcionan temperatura y humedad):
        - Multiplicador T según temperatura
        - Factor H adicional si H > 70% y T > 25°C
        """
        # TS Base según tipo de actividad (ml/min)
        ts_base_map = {
            'correr': 20.0,
            'ciclismo': 18.3,
            'natacion': 13.3,
            'futbol_rugby': 23.3,
            'baloncesto_voley': 20.0,
            'gimnasio': 13.3,
            'crossfit_hiit': 25.0,
            'padel_tenis': 16.7,
            'baile_aerobico': 15.0,
            'caminata_rapida': 8.3,
            'pilates': 6.7,
            'caminata': 4.2,
            'yoga_hatha': 5.0,
            'yoga_bikram': 25.0,
        }
        
        # Factor de Intensidad
        factor_intensidad_map = {
            'baja': 0.8,
            'media': 1.0,
            'alta': 1.2,
        }
        
        ts_base = ts_base_map.get(self.tipo_actividad, 13.3)
        factor_intensidad = factor_intensidad_map.get(self.intensidad, 1.0)
        
        # Calcular Agua Base
        agua_base = self.duracion_minutos * ts_base * factor_intensidad
        
        # Aplicar factor climático si se proporcionan datos
        factor_climatico = self._calcular_factor_climatico(temperature, humidity)
        
        # Calcular PSE final
        pse = agua_base * factor_climatico
        
        return int(round(pse))
    
    def _calcular_factor_climatico(self, temperature: Optional[float], humidity: Optional[float]) -> float:
        """
        Calcula el factor climático según las fórmulas estrictas:
        
        Variables:
        - T = Temperatura (°C)
        - H = Humedad Relativa (%)
        
        Reglas de Temperatura (Multiplicador T):
        - Si T < 20°C: Multiplicador = 1.0 (Sin cambios)
        - Si 20°C <= T < 25°C: Multiplicador = 1.15 (+15%)
        - Si 25°C <= T < 30°C: Multiplicador = 1.25 (+25%)
        - Si T >= 30°C: Multiplicador = 1.40 (+40%)
        
        Regla de Humedad (Factor H):
        - Si H > 70% Y T > 25°C: Sumar un extra de 0.10 (+10%) al Multiplicador T
        
        Fórmula Final: Factor = Multiplicador_T + Factor_H
        """
        # Si no hay datos climáticos, retornar factor neutro
        if temperature is None or humidity is None:
            return 1.0
        
        T = temperature
        H = humidity
        
        # Calcular Multiplicador T según temperatura
        if T < 20:
            multiplicador_t = 1.0
        elif 20 <= T < 25:
            multiplicador_t = 1.15
        elif 25 <= T < 30:
            multiplicador_t = 1.25
        else:  # T >= 30
            multiplicador_t = 1.40
        
        # Calcular Factor H (solo si H > 70% Y T > 25°C)
        factor_h = 0.0
        if H > 70 and T > 25:
            factor_h = 0.10
        
        # Factor final
        factor_final = multiplicador_t + factor_h
        
        return factor_final

