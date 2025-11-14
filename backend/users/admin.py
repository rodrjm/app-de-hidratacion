from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Sugerencia, Feedback


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Configuración personalizada del admin para el modelo User.
    """
    list_display = [
        'username', 'email', 'first_name', 'last_name', 
        'peso', 'fecha_nacimiento', 'es_premium', 'fecha_creacion', 'ultimo_acceso'
    ]
    
    def get_edad_calculada(self, obj):
        """Muestra la edad calculada en el admin."""
        return obj.edad_calculada
    get_edad_calculada.short_description = 'Edad (calculada)'
    list_filter = [
        'es_premium', 'genero', 'nivel_actividad', 'recordar_notificaciones',
        'is_active', 'is_staff', 'is_superuser', 'fecha_creacion'
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-fecha_creacion']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'email', 'fecha_nacimiento', 'genero', 'es_fragil_o_insuficiencia_cardiaca')
        }),
        ('Datos de Hidratación', {
            'fields': ('peso', 'nivel_actividad', 'meta_diaria_ml')
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
            'fields': ('username', 'email', 'password1', 'password2', 'peso', 'fecha_nacimiento')
        }),
    )
    
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion', 'last_login']
    
    def get_queryset(self, request):
        """Optimizar consultas con select_related."""
        return super().get_queryset(request).select_related()


@admin.register(Sugerencia)
class SugerenciaAdmin(admin.ModelAdmin):
    """
    Configuración del admin para el modelo Sugerencia.
    """
    list_display = ['usuario', 'tipo', 'nombre', 'intensidad_estimada', 'fecha_creacion', 'procesada']
    list_filter = ['tipo', 'procesada', 'fecha_creacion', 'intensidad_estimada']
    search_fields = ['nombre', 'comentarios', 'usuario__username', 'usuario__email']
    ordering = ['-fecha_creacion']
    readonly_fields = ['fecha_creacion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('usuario', 'tipo', 'nombre')
        }),
        ('Detalles', {
            'fields': ('comentarios', 'intensidad_estimada')
        }),
        ('Estado', {
            'fields': ('procesada', 'fecha_creacion')
        }),
    )
    
    def get_queryset(self, request):
        """Optimizar consultas con select_related."""
        return super().get_queryset(request).select_related('usuario')


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """
    Configuración del admin para el modelo Feedback.
    """
    list_display = ['usuario', 'tipo', 'mensaje_preview', 'fecha_creacion', 'procesado']
    list_filter = ['tipo', 'procesado', 'fecha_creacion']
    search_fields = ['mensaje', 'usuario__username', 'usuario__email']
    ordering = ['-fecha_creacion']
    readonly_fields = ['fecha_creacion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('usuario', 'tipo')
        }),
        ('Contenido', {
            'fields': ('mensaje',)
        }),
        ('Estado', {
            'fields': ('procesado', 'fecha_creacion')
        }),
    )
    
    def mensaje_preview(self, obj):
        """Muestra una vista previa del mensaje."""
        return obj.mensaje[:100] + '...' if len(obj.mensaje) > 100 else obj.mensaje
    mensaje_preview.short_description = 'Mensaje'
    
    def get_queryset(self, request):
        """Optimizar consultas con select_related."""
        return super().get_queryset(request).select_related('usuario')
