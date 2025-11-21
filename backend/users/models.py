from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import date
import secrets
import string


class User(AbstractUser):
    """
    Modelo de usuario personalizado para Dosis vital: Tu aplicación de hidratación personal.
    Extiende el modelo AbstractUser de Django con campos específicos para hidratación.
    """
    email = models.EmailField(
        unique=True,
        verbose_name='Correo electrónico',
        help_text='Dirección de correo electrónico única del usuario'
    )
    peso = models.FloatField(
        validators=[MinValueValidator(1.0), MaxValueValidator(500.0)],
        verbose_name='Peso (kg)',
        help_text='Peso del usuario en kilogramos',
        null=False,
        blank=False
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
        null=False,
        blank=False
    )
    es_fragil_o_insuficiencia_cardiaca = models.BooleanField(
        default=False,
        verbose_name='Persona frágil o con insuficiencia cardíaca',
        help_text='Indica si la persona es frágil o tiene insuficiencia cardíaca (solo para mayores de 65 años)',
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
    # Campos de referidos
    codigo_referido = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Código de referido',
        help_text='Código único del usuario para referir a otros'
    )
    codigo_referido_usado = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='Código de referido usado',
        help_text='Código de referido que el usuario usó al registrarse'
    )
    referidos_verificados = models.PositiveIntegerField(
        default=0,
        verbose_name='Referidos verificados',
        help_text='Número de referidos que se han registrado y verificado con este código'
    )
    recompensas_reclamadas = models.PositiveIntegerField(
        default=0,
        verbose_name='Recompensas reclamadas',
        help_text='Número de recompensas de referidos que el usuario ha reclamado'
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

    def generar_codigo_referido(self):
        """
        Genera un código de referido único y aleatorio.
        Formato: 8 caracteres alfanuméricos en mayúscula.
        """
        if self.codigo_referido:
            return self.codigo_referido
        
        # Generar código único
        while True:
            # Generar 8 caracteres alfanuméricos aleatorios
            caracteres = string.ascii_uppercase + string.digits
            codigo = ''.join(secrets.choice(caracteres) for _ in range(8))
            
            # Verificar que no exista
            if not User.objects.filter(codigo_referido=codigo).exists():
                self.codigo_referido = codigo
                self.save(update_fields=['codigo_referido'])
                return codigo

    def obtener_referidos_pendientes(self):
        """
        Retorna el número de referidos verificados que aún no han generado una recompensa.
        Cada 3 referidos = 1 recompensa disponible.
        """
        referidos_disponibles = self.referidos_verificados - (self.recompensas_reclamadas * 3)
        return max(0, referidos_disponibles)

    def tiene_recompensa_disponible(self):
        """Verifica si el usuario tiene una recompensa disponible (3 referidos verificados)."""
        return self.obtener_referidos_pendientes() >= 3

    @property
    def edad_calculada(self):
        """
        Calcula la edad del usuario basándose en su fecha de nacimiento.
        Retorna None si no hay fecha de nacimiento.
        """
        if not self.fecha_nacimiento:
            # Si no hay fecha_nacimiento pero hay edad (datos antiguos), usar edad
            return self.edad
        today = date.today()
        edad = today.year - self.fecha_nacimiento.year
        # Ajustar si aún no ha cumplido años este año
        if today.month < self.fecha_nacimiento.month or (today.month == self.fecha_nacimiento.month and today.day < self.fecha_nacimiento.day):
            edad -= 1
        return edad

    def calcular_meta_hidratacion(self):
        """
        Calcula la meta de hidratación basada en peso y edad según las nuevas reglas:
        
        NIÑOS Y BEBES (0-13 años):
        - 0-10 kg: 100 ml/kg
        - 11-20 kg: 50 ml/kg
        - >20 kg: 20 ml/kg
        
        ADOLESCENTES Y ADULTOS (14-65 años):
        - 14-50 años: 30-35 ml/kg (promedio 32.5 ml/kg)
        - 51-65 años: 25-30 ml/kg (promedio 27.5 ml/kg)
        
        ADULTOS MAYORES (>65 años):
        - Saludable: 25 ml/kg
        - Frágil o con insuficiencia cardíaca: 20 ml/kg
        """
        # Fallback defensivo: si falta peso, devolver el valor almacenado
        # o un valor seguro por defecto para evitar metas en cero.
        if not self.peso or self.peso <= 0:
            return self.meta_diaria_ml or 2000

        edad_actual = self.edad_calculada
        if not edad_actual or edad_actual <= 0:
            # Si no hay edad, usar valor almacenado o un valor seguro
            return self.meta_diaria_ml or 2000

        peso_kg = self.peso
        ml_por_kg = 0

        # NIÑOS Y BEBES (0-13 años)
        if edad_actual <= 13:
            if peso_kg <= 10:
                ml_por_kg = 100
            elif peso_kg <= 20:
                ml_por_kg = 50
            else:
                ml_por_kg = 20
        
        # ADOLESCENTES Y ADULTOS (14-65 años)
        elif edad_actual <= 65:
            if edad_actual <= 50:
                # 14-50 años: 30-35 ml/kg (promedio 32.5)
                ml_por_kg = 32.5
            else:
                # 51-65 años: 25-30 ml/kg (promedio 27.5)
                ml_por_kg = 27.5
        
        # ADULTOS MAYORES (>65 años)
        else:
            if self.es_fragil_o_insuficiencia_cardiaca:
                # Frágil o con insuficiencia cardíaca: 20 ml/kg
                ml_por_kg = 20
            else:
                # Saludable: 25 ml/kg
                ml_por_kg = 25

        meta_calculada = int(peso_kg * ml_por_kg)
        
        # Ajustar meta: restar 20% porque el 20% se obtiene de los alimentos
        meta_calculada = int(meta_calculada * 0.80)
        
        # Asegurar que esté dentro de límites razonables y consistentes con el modelo
        meta_calculada = max(500, min(meta_calculada, 10000))
        
        # Último fallback por si algo resulta en cero
        return meta_calculada or self.meta_diaria_ml or 2000

    def actualizar_meta_hidratacion(self):
        """Actualiza la meta de hidratación basada en los datos del usuario."""
        self.meta_diaria_ml = self.calcular_meta_hidratacion()
        self.save(update_fields=['meta_diaria_ml'])
    
    def actualizar_meta_hidratacion_con_actividades(self):
        """
        Actualiza la meta de hidratación considerando las actividades del día.
        Suma el PSE de todas las actividades del día a la meta base.
        """
        from django.utils import timezone
        from actividades.models import Actividad
        
        # Calcular meta base
        meta_base = self.calcular_meta_hidratacion()
        
        # Obtener fecha actual en timezone del usuario (o UTC si no hay timezone)
        hoy = timezone.now().date()
        
        # Obtener todas las actividades del día
        from datetime import datetime as dt, time as dt_time
        inicio_dia = timezone.make_aware(dt.combine(hoy, dt_time.min))
        fin_dia = timezone.make_aware(dt.combine(hoy, dt_time.max))
        
        actividades_hoy = Actividad.objects.filter(
            usuario=self,
            fecha_hora__range=[inicio_dia, fin_dia]
        )
        
        # Sumar PSE de todas las actividades del día
        pse_total = sum(actividad.pse_calculado for actividad in actividades_hoy)
        
        # Meta final = meta base + PSE total
        meta_final = meta_base + pse_total
        
        # Asegurar que esté dentro de límites razonables
        meta_final = max(500, min(meta_final, 15000))
        
        self.meta_diaria_ml = int(meta_final)
        self.save(update_fields=['meta_diaria_ml'])

    def es_usuario_activo_hoy(self):
        """Verifica si el usuario ha tenido actividad hoy."""
        from django.utils import timezone
        
        hoy = timezone.now().date()
        return self.ultimo_acceso and self.ultimo_acceso.date() == hoy


class Sugerencia(models.Model):
    """
    Modelo para almacenar sugerencias de bebidas y actividades de usuarios premium.
    """
    TIPO_CHOICES = [
        ('bebida', 'Bebida'),
        ('actividad', 'Actividad'),
    ]
    
    INTENSIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
    ]
    
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sugerencias',
        verbose_name='Usuario',
        help_text='Usuario que realizó la sugerencia'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de sugerencia',
        help_text='Tipo de sugerencia (bebida o actividad)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre de la bebida o actividad sugerida'
    )
    comentarios = models.TextField(
        blank=True,
        null=True,
        verbose_name='Comentarios',
        help_text='Comentarios adicionales o ingredientes (opcional)'
    )
    intensidad_estimada = models.CharField(
        max_length=10,
        choices=INTENSIDAD_CHOICES,
        blank=True,
        null=True,
        verbose_name='Intensidad estimada',
        help_text='Intensidad estimada (solo para actividades)'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
        help_text='Fecha y hora de creación de la sugerencia'
    )
    procesada = models.BooleanField(
        default=False,
        verbose_name='Procesada',
        help_text='Indica si la sugerencia ha sido procesada por un administrador'
    )
    
    class Meta:
        verbose_name = 'Sugerencia'
        verbose_name_plural = 'Sugerencias'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'tipo']),
            models.Index(fields=['procesada']),
        ]
    
    def __str__(self):
        return f"{self.usuario.username} - {self.tipo}: {self.nombre}"


class Feedback(models.Model):
    """
    Modelo para almacenar feedback general de los usuarios sobre la aplicación.
    """
    TIPO_CHOICES = [
        ('idea_sugerencia', 'Idea/Sugerencia'),
        ('reporte_error', 'Reporte de Error'),
        ('pregunta_general', 'Pregunta General'),
    ]
    
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        verbose_name='Usuario',
        help_text='Usuario que envió el feedback'
    )
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de feedback',
        help_text='Tipo de feedback (idea, error, pregunta)'
    )
    mensaje = models.TextField(
        verbose_name='Mensaje',
        help_text='Mensaje del usuario'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
        help_text='Fecha y hora de creación del feedback'
    )
    procesado = models.BooleanField(
        default=False,
        verbose_name='Procesado',
        help_text='Indica si el feedback ha sido procesado por el equipo'
    )
    
    class Meta:
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedbacks'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'tipo']),
            models.Index(fields=['procesado']),
        ]
    
    def __str__(self):
        return f"{self.usuario.username} - {self.get_tipo_display()}: {self.mensaje[:50]}..."
