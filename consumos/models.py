from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Bebida(models.Model):
    """
    Modelo para representar diferentes tipos de bebidas y su factor de hidratación.
    """
    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre de la bebida',
        help_text='Nombre de la bebida (ej. Agua, Café, Té, etc.)'
    )
    factor_hidratacion = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(2.0)],
        verbose_name='Factor de hidratación',
        help_text='Factor que indica qué tan hidratante es la bebida (0.0-2.0)'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción adicional de la bebida'
    )
    es_agua = models.BooleanField(
        default=False,
        verbose_name='Es agua',
        help_text='Indica si esta bebida es agua pura'
    )
    calorias_por_ml = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0)],
        verbose_name='Calorías por ml',
        help_text='Calorías por mililitro de la bebida'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa',
        help_text='Indica si la bebida está disponible para seleccionar'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        verbose_name = 'Bebida'
        verbose_name_plural = 'Bebidas'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Recipiente(models.Model):
    """
    Modelo para representar recipientes personalizados del usuario.
    """
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipientes',
        verbose_name='Usuario'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del recipiente',
        help_text='Nombre personalizado del recipiente (ej. Botella grande, Vaso)'
    )
    cantidad_ml = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5000)],
        verbose_name='Capacidad (ml)',
        help_text='Capacidad del recipiente en mililitros'
    )
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        verbose_name='Color',
        help_text='Color del recipiente en formato hexadecimal'
    )
    icono = models.CharField(
        max_length=50,
        default='bottle',
        verbose_name='Icono',
        help_text='Nombre del icono para representar el recipiente'
    )
    es_favorito = models.BooleanField(
        default=False,
        verbose_name='Es favorito',
        help_text='Indica si este recipiente es uno de los favoritos del usuario'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        verbose_name = 'Recipiente'
        verbose_name_plural = 'Recipientes'
        ordering = ['-es_favorito', 'nombre']
        unique_together = ['usuario', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.cantidad_ml}ml)"


class Consumo(models.Model):
    """
    Modelo para registrar los consumos de hidratación del usuario.
    """
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='consumos',
        verbose_name='Usuario'
    )
    bebida = models.ForeignKey(
        Bebida,
        on_delete=models.CASCADE,
        related_name='consumos',
        verbose_name='Bebida'
    )
    recipiente = models.ForeignKey(
        Recipiente,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consumos',
        verbose_name='Recipiente'
    )
    cantidad_ml = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5000)],
        verbose_name='Cantidad (ml)',
        help_text='Cantidad consumida en mililitros'
    )
    cantidad_hidratacion_efectiva = models.PositiveIntegerField(
        verbose_name='Hidratación efectiva (ml)',
        help_text='Cantidad de hidratación efectiva considerando el factor de la bebida'
    )
    fecha_hora = models.DateTimeField(
        verbose_name='Fecha y hora',
        help_text='Fecha y hora del consumo'
    )
    notas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas',
        help_text='Notas adicionales sobre el consumo'
    )
    ubicacion = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Ubicación',
        help_text='Ubicación donde se realizó el consumo'
    )
    temperatura_ambiente = models.FloatField(
        null=True,
        blank=True,
        verbose_name='Temperatura ambiente (°C)',
        help_text='Temperatura ambiente al momento del consumo'
    )
    nivel_sed = models.PositiveIntegerField(
        choices=[
            (1, 'Muy poca sed'),
            (2, 'Poca sed'),
            (3, 'Sed normal'),
            (4, 'Mucha sed'),
            (5, 'Muy sediento'),
        ],
        null=True,
        blank=True,
        verbose_name='Nivel de sed',
        help_text='Nivel de sed antes del consumo'
    )
    estado_animo = models.CharField(
        max_length=20,
        choices=[
            ('excelente', 'Excelente'),
            ('bueno', 'Bueno'),
            ('regular', 'Regular'),
            ('malo', 'Malo'),
            ('terrible', 'Terrible'),
        ],
        blank=True,
        null=True,
        verbose_name='Estado de ánimo',
        help_text='Estado de ánimo al momento del consumo'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        verbose_name = 'Consumo'
        verbose_name_plural = 'Consumos'
        ordering = ['-fecha_hora']
        indexes = [
            models.Index(fields=['usuario', 'fecha_hora']),
            models.Index(fields=['fecha_hora']),
        ]

    def __str__(self):
        return f"{self.usuario.username} - {self.bebida.nombre} ({self.cantidad_ml}ml) - {self.fecha_hora}"

    def save(self, *args, **kwargs):
        """
        Calcula la hidratación efectiva antes de guardar.
        """
        self.cantidad_hidratacion_efectiva = int(
            self.cantidad_ml * self.bebida.factor_hidratacion
        )
        super().save(*args, **kwargs)

    def get_hidratacion_efectiva_porcentaje(self):
        """
        Retorna el porcentaje de hidratación efectiva respecto a la cantidad consumida.
        """
        if self.cantidad_ml > 0:
            return (self.cantidad_hidratacion_efectiva / self.cantidad_ml) * 100
        return 0


class MetaDiaria(models.Model):
    """
    Modelo para registrar las metas diarias de hidratación del usuario.
    """
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='metas_diarias',
        verbose_name='Usuario'
    )
    fecha = models.DateField(
        verbose_name='Fecha',
        help_text='Fecha de la meta diaria'
    )
    meta_ml = models.PositiveIntegerField(
        verbose_name='Meta (ml)',
        help_text='Meta de hidratación en mililitros para este día'
    )
    consumido_ml = models.PositiveIntegerField(
        default=0,
        verbose_name='Consumido (ml)',
        help_text='Cantidad total consumida en mililitros'
    )
    hidratacion_efectiva_ml = models.PositiveIntegerField(
        default=0,
        verbose_name='Hidratación efectiva (ml)',
        help_text='Cantidad total de hidratación efectiva en mililitros'
    )
    completada = models.BooleanField(
        default=False,
        verbose_name='Completada',
        help_text='Indica si se alcanzó la meta del día'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        verbose_name = 'Meta Diaria'
        verbose_name_plural = 'Metas Diarias'
        ordering = ['-fecha']
        unique_together = ['usuario', 'fecha']

    def __str__(self):
        return f"{self.usuario.username} - {self.fecha} ({self.consumido_ml}/{self.meta_ml}ml)"

    def get_progreso_porcentaje(self):
        """
        Retorna el porcentaje de progreso hacia la meta.
        """
        if self.meta_ml > 0:
            return min((self.consumido_ml / self.meta_ml) * 100, 100)
        return 0

    def get_hidratacion_efectiva_porcentaje(self):
        """
        Retorna el porcentaje de progreso basado en hidratación efectiva.
        """
        if self.meta_ml > 0:
            return min((self.hidratacion_efectiva_ml / self.meta_ml) * 100, 100)
        return 0

    def actualizar_consumo(self):
        """
        Actualiza los totales de consumo basado en los consumos del día.
        """
        from django.db.models import Sum
        from django.utils import timezone
        
        # Obtener consumos del día
        inicio_dia = timezone.datetime.combine(self.fecha, timezone.datetime.min.time())
        fin_dia = timezone.datetime.combine(self.fecha, timezone.datetime.max.time())
        
        consumos_dia = Consumo.objects.filter(
            usuario=self.usuario,
            fecha_hora__date=self.fecha
        )
        
        # Calcular totales
        totales = consumos_dia.aggregate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva')
        )
        
        self.consumido_ml = totales['total_ml'] or 0
        self.hidratacion_efectiva_ml = totales['total_hidratacion'] or 0
        self.completada = self.hidratacion_efectiva_ml >= self.meta_ml
        
        self.save(update_fields=[
            'consumido_ml', 'hidratacion_efectiva_ml', 'completada', 'fecha_actualizacion'
        ])


class Recordatorio(models.Model):
    """
    Modelo para recordatorios de hidratación del usuario.
    """
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recordatorios',
        verbose_name='Usuario'
    )
    hora = models.TimeField(
        verbose_name='Hora del recordatorio',
        help_text='Hora del día para el recordatorio (HH:MM)'
    )
    mensaje = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Mensaje personalizado',
        help_text='Mensaje opcional para el recordatorio'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Indica si el recordatorio está activo'
    )
    dias_semana = models.JSONField(
        default=list,
        verbose_name='Días de la semana',
        help_text='Lista de días de la semana (0=Lunes, 6=Domingo)'
    )
    tipo_recordatorio = models.CharField(
        max_length=20,
        choices=[
            ('agua', 'Recordatorio de agua'),
            ('meta', 'Recordatorio de meta'),
            ('personalizado', 'Recordatorio personalizado'),
        ],
        default='agua',
        verbose_name='Tipo de recordatorio',
        help_text='Tipo de recordatorio'
    )
    frecuencia = models.CharField(
        max_length=20,
        choices=[
            ('diario', 'Diario'),
            ('dias_laborales', 'Días laborales'),
            ('fines_semana', 'Fines de semana'),
            ('personalizado', 'Personalizado'),
        ],
        default='diario',
        verbose_name='Frecuencia',
        help_text='Frecuencia del recordatorio'
    )
    sonido = models.CharField(
        max_length=50,
        default='default',
        verbose_name='Sonido',
        help_text='Sonido del recordatorio'
    )
    vibracion = models.BooleanField(
        default=True,
        verbose_name='Vibración',
        help_text='Activar vibración en el recordatorio'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    ultimo_enviado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Último enviado',
        help_text='Fecha y hora del último envío del recordatorio'
    )

    class Meta:
        verbose_name = 'Recordatorio'
        verbose_name_plural = 'Recordatorios'
        ordering = ['hora']
        unique_together = ['usuario', 'hora', 'tipo_recordatorio']

    def __str__(self):
        return f"{self.usuario.username} - {self.hora} ({self.tipo_recordatorio})"

    def get_dias_semana_display(self):
        """
        Retorna los días de la semana en formato legible.
        """
        dias_nombres = [
            'Lunes', 'Martes', 'Miércoles', 'Jueves', 
            'Viernes', 'Sábado', 'Domingo'
        ]
        if not self.dias_semana:
            return 'Todos los días'
        
        dias_seleccionados = [dias_nombres[dia] for dia in self.dias_semana if 0 <= dia <= 6]
        return ', '.join(dias_seleccionados)

    def es_dia_valido(self, fecha=None):
        """
        Verifica si el recordatorio debe activarse en la fecha dada.
        """
        from django.utils import timezone
        
        if fecha is None:
            fecha = timezone.now().date()
        
        # Si no hay días específicos, es válido todos los días
        if not self.dias_semana:
            return True
        
        # Obtener el día de la semana (0=Lunes, 6=Domingo)
        dia_semana = fecha.weekday()
        
        return dia_semana in self.dias_semana

    def get_proximo_envio(self):
        """
        Calcula el próximo envío del recordatorio.
        """
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        ahora = timezone.now()
        hoy = ahora.date()
        
        # Crear datetime con la hora del recordatorio para hoy
        proximo_envio = datetime.combine(hoy, self.hora)
        proximo_envio = timezone.make_aware(proximo_envio)
        
        # Si ya pasó la hora de hoy, programar para mañana
        if proximo_envio <= ahora:
            proximo_envio += timedelta(days=1)
        
        # Verificar que el próximo envío sea en un día válido
        intentos = 0
        while not self.es_dia_valido(proximo_envio.date()) and intentos < 7:
            proximo_envio += timedelta(days=1)
            intentos += 1
        
        return proximo_envio if intentos < 7 else None

    def marcar_enviado(self):
        """
        Marca el recordatorio como enviado.
        """
        from django.utils import timezone
        self.ultimo_enviado = timezone.now()
        self.save(update_fields=['ultimo_enviado'])

    def get_mensaje_completo(self):
        """
        Retorna el mensaje completo del recordatorio.
        """
        if self.mensaje:
            return self.mensaje
        
        mensajes_por_tipo = {
            'agua': f"💧 ¡Hora de hidratarse! Recuerda beber agua.",
            'meta': f"🎯 ¡No olvides tu meta diaria de hidratación!",
            'personalizado': f"⏰ Recordatorio personalizado"
        }
        
        return mensajes_por_tipo.get(self.tipo_recordatorio, "⏰ Recordatorio de hidratación")
