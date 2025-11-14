"""
Serializers optimizados para mejor performance.
"""

from rest_framework import serializers
from django.db.models import Prefetch
from ..models import Consumo, Bebida, Recipiente, MetaDiaria, Recordatorio


class OptimizedBebidaSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para bebidas con campos específicos.
    """
    class Meta:
        model = Bebida
        fields = ['id', 'nombre', 'factor_hidratacion', 'es_agua', 'es_premium', 'activa']
        read_only_fields = ['id']


class OptimizedRecipienteSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para recipientes con campos específicos.
    """
    class Meta:
        model = Recipiente
        fields = ['id', 'nombre', 'cantidad_ml', 'es_favorito', 'color', 'icono']
        read_only_fields = ['id']


class OptimizedConsumoSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para consumos con relaciones optimizadas.
    """
    bebida = OptimizedBebidaSerializer(read_only=True)
    recipiente = OptimizedRecipienteSerializer(read_only=True)
    
    class Meta:
        model = Consumo
        fields = [
            'id', 'cantidad_ml', 'cantidad_hidratacion_efectiva',
            'fecha_hora', 'bebida', 'recipiente', 'nivel_sed',
            'estado_animo', 'notas', 'ubicacion'
        ]
        read_only_fields = ['id', 'cantidad_hidratacion_efectiva']


class OptimizedConsumoListSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para listas de consumos (solo campos esenciales).
    """
    bebida_nombre = serializers.CharField(source='bebida.nombre', read_only=True)
    recipiente_nombre = serializers.CharField(source='recipiente.nombre', read_only=True)
    
    class Meta:
        model = Consumo
        fields = [
            'id', 'cantidad_ml', 'fecha_hora', 'bebida_nombre',
            'recipiente_nombre', 'nivel_sed', 'estado_animo'
        ]


class OptimizedMetaDiariaSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para metas diarias.
    """
    class Meta:
        model = MetaDiaria
        fields = [
            'id', 'fecha', 'meta_ml', 'consumido_ml',
            'hidratacion_efectiva_ml', 'completada', 'progreso_porcentaje'
        ]
        read_only_fields = ['id', 'progreso_porcentaje']


class OptimizedRecordatorioSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para recordatorios.
    """
    class Meta:
        model = Recordatorio
        fields = [
            'id', 'hora', 'mensaje', 'activo', 'dias_semana',
            'tipo_recordatorio', 'frecuencia', 'sonido', 'vibracion'
        ]
        read_only_fields = ['id']


class StatsSummarySerializer(serializers.Serializer):
    """
    Serializer optimizado para resúmenes estadísticos.
    """
    fecha = serializers.DateField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    meta_ml = serializers.IntegerField()
    progreso_porcentaje = serializers.FloatField()
    completada = serializers.BooleanField()


class PerformanceStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de performance.
    """
    total_consumos = serializers.IntegerField()
    total_ml = serializers.IntegerField()
    promedio_ml_por_consumo = serializers.FloatField()
    dias_activos = serializers.IntegerField()
    meta_completada_dias = serializers.IntegerField()
    bebida_mas_consumida = serializers.CharField()
    recipiente_mas_usado = serializers.CharField()


class CacheStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de caché.
    """
    cache_hits = serializers.IntegerField()
    cache_misses = serializers.IntegerField()
    hit_rate = serializers.FloatField()
    total_requests = serializers.IntegerField()
    avg_response_time = serializers.FloatField()


class QueryOptimizationSerializer(serializers.Serializer):
    """
    Serializer para métricas de optimización de consultas.
    """
    query_count = serializers.IntegerField()
    duplicate_queries = serializers.IntegerField()
    slow_queries = serializers.IntegerField()
    optimization_score = serializers.FloatField()
    recommendations = serializers.ListField(
        child=serializers.CharField()
    )
