"""
Serializers para el modelo Consumo.
"""

from rest_framework import serializers
from django.utils import timezone
from zoneinfo import ZoneInfo
from ..models import Consumo


class ConsumoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Consumo.
    """
    bebida_nombre = serializers.CharField(source='bebida.nombre', read_only=True)
    recipiente_nombre = serializers.CharField(source='recipiente.nombre', read_only=True)
    hidratacion_efectiva_ml = serializers.SerializerMethodField()
    fecha_formateada = serializers.SerializerMethodField()
    hora_formateada = serializers.SerializerMethodField()

    class Meta:
        model = Consumo
        fields = [
            'id', 'cantidad_ml', 'bebida', 'bebida_nombre', 'recipiente',
            'recipiente_nombre', 'hidratacion_efectiva_ml', 'deshidratacion_neta_ml',
            'agua_compensacion_recomendada_ml', 'fecha_hora',
            'fecha_formateada', 'hora_formateada', 'nivel_sed', 'estado_animo',
            'notas', 'ubicacion', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'deshidratacion_neta_ml', 'agua_compensacion_recomendada_ml']

    def _get_user_timezone(self):
        """
        Obtiene la zona horaria del usuario desde el contexto de la request.
        """
        request = self.context.get('request')
        if request:
            tz_name = request.query_params.get('tz')
            if tz_name:
                try:
                    return ZoneInfo(tz_name)
                except (ValueError, KeyError):
                    # Zona horaria inválida, usar default
                    pass
        # Si no hay zona horaria en el request, usar la zona horaria actual de Django
        return timezone.get_current_timezone()

    def get_hidratacion_efectiva_ml(self, obj):
        """
        Retorna la hidratación efectiva en ml.
        """
        return obj.cantidad_hidratacion_efectiva

    def get_fecha_formateada(self, obj):
        """
        Retorna la fecha formateada en la zona horaria del usuario.
        """
        tz = self._get_user_timezone()
        fecha_local = timezone.localtime(obj.fecha_hora, timezone=tz)
        return fecha_local.strftime('%Y-%m-%d')

    def get_hora_formateada(self, obj):
        """
        Retorna la hora formateada en la zona horaria del usuario.
        """
        tz = self._get_user_timezone()
        fecha_local = timezone.localtime(obj.fecha_hora, timezone=tz)
        return fecha_local.strftime('%H:%M')


class ConsumoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear consumos.
    fecha_hora es opcional: si no se envía, se usa la fecha/hora actual al crear.
    Si se envía, la fecha se normaliza al día actual (solo se usa la hora).
    """
    fecha_hora = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Consumo
        fields = [
            'cantidad_ml', 'bebida', 'recipiente', 'fecha_hora',
            'nivel_sed', 'estado_animo', 'notas', 'ubicacion'
        ]

    def validate_cantidad_ml(self, value):
        """
        Valida que la cantidad sea positiva.
        """
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0")
        return value

    def validate_fecha_hora(self, value):
        """
        Valida que la fecha no sea futura desde la perspectiva del usuario.
        - Usa la zona horaria enviada en el request (?tz=America/Argentina/Buenos_Aires) si está disponible.
        - Normaliza el día al "hoy" del usuario (no al timezone del servidor).
        - Permite registros históricos dentro del mismo día, pero no permite horas futuras.
        Si la fecha viene sin zona horaria (naive), se asume que es UTC.
        """
        if value is None:
            return value

        request = self.context.get('request')

        # Resolver timezone del usuario, similar a ConsumoSerializer._get_user_timezone
        user_tz = None
        if request:
            tz_name = request.query_params.get('tz')
            if tz_name:
                try:
                    user_tz = ZoneInfo(tz_name)
                except (ValueError, KeyError):
                    user_tz = None
        if user_tz is None:
            user_tz = timezone.get_current_timezone()

        # Asegurar que value es aware
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.utc)

        # Trabajar en la zona horaria del usuario
        value_local = value.astimezone(user_tz)
        now_local = timezone.now().astimezone(user_tz)

        # Forzar la fecha al día actual del usuario, conservando la hora elegida
        value_local = value_local.replace(
            year=now_local.year,
            month=now_local.month,
            day=now_local.day,
        )

        if value_local > now_local:
            raise serializers.ValidationError("La fecha no puede ser futura")

        # Guardar en base de datos en UTC (o TZ por defecto de Django)
        return value_local.astimezone(timezone.utc)

    def create(self, validated_data):
        if validated_data.get('fecha_hora') is None:
            validated_data['fecha_hora'] = timezone.now()
        return super().create(validated_data)



class ConsumoStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de consumos.
    """
    total = serializers.IntegerField()
    activos = serializers.IntegerField()
    recientes_30_dias = serializers.IntegerField()
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
