from django.contrib import admin
from .models import Actividad


@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = [
        'usuario', 'tipo_actividad', 'duracion_minutos', 'intensidad',
        'fecha_hora', 'pse_calculado', 'fecha_creacion'
    ]
    list_filter = [
        'tipo_actividad', 'intensidad', 'fecha_hora', 'fecha_creacion'
    ]
    search_fields = ['usuario__username', 'usuario__email']
    readonly_fields = ['pse_calculado', 'fecha_creacion', 'fecha_actualizacion']
    ordering = ['-fecha_hora']
    
    fieldsets = (
        ('Información de la Actividad', {
            'fields': ('usuario', 'tipo_actividad', 'duracion_minutos', 'intensidad', 'fecha_hora')
        }),
        ('Cálculo de PSE', {
            'fields': ('pse_calculado',)
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_actualizacion')
        }),
    )

