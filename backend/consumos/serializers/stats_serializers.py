"""
Serializers para estadísticas y análisis.
"""

from rest_framework import serializers


class ConsumoHistorySerializer(serializers.Serializer):
    """
    Serializer para historial de consumos.
    """
    id = serializers.IntegerField()
    cantidad_ml = serializers.IntegerField()
    bebida_nombre = serializers.CharField()
    recipiente_nombre = serializers.CharField()
    hidratacion_efectiva_ml = serializers.IntegerField()
    fecha_hora = serializers.DateTimeField()
    nivel_sed = serializers.IntegerField()
    estado_animo = serializers.IntegerField()
    notas = serializers.CharField(allow_blank=True)
    ubicacion = serializers.CharField(allow_blank=True)


class ConsumoSummarySerializer(serializers.Serializer):
    """
    Serializer para resumen de consumos.
    """
    periodo = serializers.CharField()
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    promedio_diario_ml = serializers.FloatField()


class ConsumoDailySummarySerializer(serializers.Serializer):
    """
    Serializer para resumen diario.
    """
    fecha = serializers.DateField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    meta_ml = serializers.IntegerField()
    progreso_porcentaje = serializers.FloatField()
    completada = serializers.BooleanField()


class ConsumoWeeklySummarySerializer(serializers.Serializer):
    """
    Serializer para resumen semanal.
    """
    semana_inicio = serializers.DateField()
    semana_fin = serializers.DateField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    promedio_diario_ml = serializers.FloatField()


class ConsumoMonthlySummarySerializer(serializers.Serializer):
    """
    Serializer para resumen mensual.
    """
    mes_inicio = serializers.DateField()
    mes_fin = serializers.DateField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    promedio_diario_ml = serializers.FloatField()


class ConsumoTrendSerializer(serializers.Serializer):
    """
    Serializer para tendencias de consumo.
    """
    periodo = serializers.CharField()
    tendencia = serializers.CharField()
    cambio_porcentaje = serializers.FloatField()
    cambio_ml = serializers.IntegerField()
    total_anterior = serializers.IntegerField()
    total_actual = serializers.IntegerField()


class ConsumoInsightsSerializer(serializers.Serializer):
    """
    Serializer para insights de consumo.
    """
    total_consumos = serializers.IntegerField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    periodo_analisis = serializers.CharField()
    insights = serializers.ListField()
    patrones = serializers.ListField()
    recomendaciones = serializers.ListField()
