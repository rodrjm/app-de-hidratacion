from django.contrib import admin
from .models import Bebida, Recipiente, Consumo, MetaDiaria


@admin.register(Bebida)
class BebidaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'factor_hidratacion', 'es_agua', 'calorias_por_ml', 'activa']
    list_filter = ['es_agua', 'activa', 'factor_hidratacion']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']


@admin.register(Recipiente)
class RecipienteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'usuario', 'cantidad_ml', 'es_favorito', 'fecha_creacion']
    list_filter = ['es_favorito', 'fecha_creacion']
    search_fields = ['nombre', 'usuario__username']
    ordering = ['-fecha_creacion']


@admin.register(Consumo)
class ConsumoAdmin(admin.ModelAdmin):
    list_display = [
        'usuario', 'bebida', 'cantidad_ml', 'cantidad_hidratacion_efectiva',
        'fecha_hora', 'nivel_sed'
    ]
    list_filter = ['bebida', 'nivel_sed', 'estado_animo', 'fecha_hora']
    search_fields = ['usuario__username', 'bebida__nombre', 'notas']
    ordering = ['-fecha_hora']
    date_hierarchy = 'fecha_hora'


@admin.register(MetaDiaria)
class MetaDiariaAdmin(admin.ModelAdmin):
    list_display = [
        'usuario', 'fecha', 'meta_ml', 'consumido_ml', 
        'hidratacion_efectiva_ml', 'completada'
    ]
    list_filter = ['completada', 'fecha']
    search_fields = ['usuario__username']
    ordering = ['-fecha']
    date_hierarchy = 'fecha'
