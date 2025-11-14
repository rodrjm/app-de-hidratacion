from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    """
    Modelo de usuario personalizado para HydroTracker.
    Extiende el modelo AbstractUser de Django con campos específicos para hidratación.
    """
    email = models.EmailField(
        unique=True,
        verbose_name='Correo electrónico',
        help_text='Dirección de correo electrónico única del usuario'
    )
    peso = models.FloatField(
        validators=[MinValueValidator(20.0), MaxValueValidator(300.0)],
        verbose_name='Peso (kg)',
        help_text='Peso del usuario en kilogramos (20-300 kg)',
        null=True,
        blank=True
    )
    edad = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(120)],
        verbose_name='Edad (años)',
        help_text='Edad del usuario en años (1-120 años)',
        null=True,
        blank=True
    )
    es_premium = models.BooleanField(
        default=False,
        verbose_name='Usuario Premium',
        help_text='Indica si el usuario tiene una suscripción premium'
    )
    fecha_nacimiento = models.DateField(
        verbose_name='Fecha de nacimiento',
        help_text='Fecha de nacimiento del usuario',
        null=True,
        blank=True
    )
    genero = models.CharField(
        max_length=10,
        choices=[
            ('M', 'Masculino'),
            ('F', 'Femenino'),
            ('O', 'Otro'),
        ],
        verbose_name='Género',
        help_text='Género del usuario',
        null=True,
        blank=True
    )
    nivel_actividad = models.CharField(
        max_length=20,
        choices=[
            ('sedentario', 'Sedentario'),
            ('ligero', 'Actividad ligera'),
            ('moderado', 'Actividad moderada'),
            ('intenso', 'Actividad intensa'),
            ('muy_intenso', 'Actividad muy intensa'),
        ],
        default='moderado',
        verbose_name='Nivel de actividad',
        help_text='Nivel de actividad física del usuario'
    )
    meta_diaria_ml = models.PositiveIntegerField(
        default=2000,
        verbose_name='Meta diaria (ml)',
        help_text='Meta de hidratación diaria en mililitros',
        validators=[MinValueValidator(500), MaxValueValidator(10000)]
    )
    recordar_notificaciones = models.BooleanField(
        default=True,
        verbose_name='Recordar notificaciones',
        help_text='Indica si el usuario desea recibir recordatorios de hidratación'
    )
    hora_inicio = models.TimeField(
        default='08:00',
        verbose_name='Hora de inicio',
        help_text='Hora de inicio para los recordatorios de hidratación'
    )
    hora_fin = models.TimeField(
        default='22:00',
        verbose_name='Hora de fin',
        help_text='Hora de fin para los recordatorios de hidratación'
    )
    intervalo_notificaciones = models.PositiveIntegerField(
        default=60,
        verbose_name='Intervalo de notificaciones (min)',
        help_text='Intervalo en minutos entre recordatorios de hidratación',
        validators=[MinValueValidator(15), MaxValueValidator(480)]
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
        help_text='Fecha y hora de creación de la cuenta'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización',
        help_text='Fecha y hora de la última actualización del perfil'
    )
    ultimo_acceso = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Último acceso',
        help_text='Fecha y hora del último acceso del usuario'
    )

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.username} ({self.email})"

    def get_nombre_completo(self):
        """Retorna el nombre completo del usuario."""
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def calcular_meta_hidratacion(self):
        """
        Calcula la meta de hidratación basada en peso, edad y nivel de actividad.
        Fórmula básica: 35ml por kg de peso + ajustes por edad y actividad.
        """
        if not self.peso:
            return self.meta_diaria_ml

        # Base: 35ml por kg de peso
        meta_base = self.peso * 35

        # Ajuste por edad
        if self.edad:
            if self.edad < 18:
                factor_edad = 1.0
            elif self.edad < 65:
                factor_edad = 1.0
            else:
                factor_edad = 0.9
        else:
            factor_edad = 1.0

        # Ajuste por nivel de actividad
        factores_actividad = {
            'sedentario': 1.0,
            'ligero': 1.1,
            'moderado': 1.2,
            'intenso': 1.4,
            'muy_intenso': 1.6,
        }
        factor_actividad = factores_actividad.get(self.nivel_actividad, 1.2)

        meta_calculada = int(meta_base * factor_edad * factor_actividad)
        
        # Asegurar que esté dentro de límites razonables
        meta_calculada = max(500, min(meta_calculada, 10000))
        
        return meta_calculada

    def actualizar_meta_hidratacion(self):
        """Actualiza la meta de hidratación basada en los datos del usuario."""
        self.meta_diaria_ml = self.calcular_meta_hidratacion()
        self.save(update_fields=['meta_diaria_ml'])

    def es_usuario_activo_hoy(self):
        """Verifica si el usuario ha tenido actividad hoy."""
        from django.utils import timezone
        
        hoy = timezone.now().date()
        return self.ultimo_acceso and self.ultimo_acceso.date() == hoy
