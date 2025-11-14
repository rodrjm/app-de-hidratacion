from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Configuración personalizada del admin para el modelo User.
    """
    list_display = [
        'username', 'email', 'first_name', 'last_name', 
        'peso', 'edad', 'es_premium', 'fecha_creacion', 'ultimo_acceso'
    ]
    list_filter = [
        'es_premium', 'genero', 'nivel_actividad', 'recordar_notificaciones',
        'is_active', 'is_staff', 'is_superuser', 'fecha_creacion'
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-fecha_creacion']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'email', 'fecha_nacimiento', 'genero')
        }),
        ('Datos de Hidratación', {
            'fields': ('peso', 'edad', 'nivel_actividad', 'meta_diaria_ml')
        }),
        ('Configuración de Notificaciones', {
            'fields': ('recordar_notificaciones', 'hora_inicio', 'hora_fin', 'intervalo_notificaciones')
        }),
        ('Permisos', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'es_premium', 'groups', 'user_permissions')
        }),
        ('Fechas Importantes', {
            'fields': ('last_login', 'fecha_creacion', 'fecha_actualizacion', 'ultimo_acceso')
        })
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'peso', 'edad')
        }),
    )
    
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion', 'last_login']
    
    def get_queryset(self, request):
        """Optimizar consultas con select_related."""
        return super().get_queryset(request).select_related()
