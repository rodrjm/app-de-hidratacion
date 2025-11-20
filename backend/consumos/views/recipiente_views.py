"""
Vistas para la gestión de recipientes.
"""

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Recipiente
from ..serializers.recipiente_serializers import RecipienteSerializer
from .base_views import BaseViewSet, StatsMixin, FilterMixin


class RecipienteViewSet(BaseViewSet, StatsMixin, FilterMixin):
    """
    ViewSet para gestionar recipientes de hidratación.
    Los usuarios free solo pueden tener 2 recipientes (los por defecto).
    Los usuarios premium pueden tener recipientes ilimitados.
    """
    queryset = Recipiente.objects.all()
    serializer_class = RecipienteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['es_favorito', 'cantidad_ml']
    search_fields = ['nombre', 'color']
    ordering_fields = ['nombre', 'cantidad_ml', 'fecha_creacion']
    ordering = ['cantidad_ml']  # Ordenar por cantidad_ml de menor a mayor por defecto

    def list(self, request, *args, **kwargs):
        """
        Lista los recipientes del usuario, asegurando que existan los por defecto.
        """
        user = request.user
        
        # Asegurar que siempre existan los recipientes por defecto (solo una vez)
        nombres_defecto = ['Taza/Vaso', 'Botella/Termo pequeño']
        cantidades_defecto = [250, 500]
        colores_defecto = ['#3B82F6', '#10B981']
        iconos_defecto = ['cup', 'bottle']
        
        for nombre, cantidad, color, icono in zip(nombres_defecto, cantidades_defecto, colores_defecto, iconos_defecto):
            Recipiente.objects.get_or_create(
                usuario=user,
                nombre=nombre,
                defaults={
                    'cantidad_ml': cantidad,
                    'color': color,
                    'icono': icono,
                    'es_favorito': True
                }
            )
        
        return super().list(request, *args, **kwargs)
    
    def get_queryset(self):
        """
        Filtra los recipientes del usuario autenticado.
        """
        return self.queryset.filter(usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo recipiente validando el límite para usuarios free.
        """
        user = request.user
        
        # Verificar límite para usuarios free (solo 2 recipientes)
        if not user.es_premium:
            recipientes_count = Recipiente.objects.filter(usuario=user).count()
            if recipientes_count >= 2:
                return Response({
                    'error': 'Los usuarios free solo pueden tener 2 recipientes. Actualiza a Premium para agregar más recipientes.',
                    'detail': 'Límite de recipientes alcanzado'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Continuar con la creación normal
        return super().create(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """
        Previene eliminar los recipientes por defecto (250ml y 500ml) para TODOS los usuarios.
        Los recipientes por defecto deben estar siempre disponibles tanto para free como premium.
        """
        instance = self.get_object()
        
        # Los nombres por defecto que NO se pueden eliminar
        nombres_defecto = ['Taza/Vaso', 'Botella/Termo pequeño']
        if instance.nombre in nombres_defecto:
            return Response({
                'error': 'No puedes eliminar los recipientes por defecto. Estos recipientes siempre están disponibles para todos los usuarios.',
                'detail': 'Recipiente por defecto no se puede eliminar'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)
