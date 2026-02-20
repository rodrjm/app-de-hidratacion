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
        Lista los recipientes del usuario, asegurando que existan los por defecto (Vaso 250ml, Botella 500ml).
        Migra nombres antiguos (Taza/Vaso, Botella/Termo pequeño) a Vaso/Botella.
        """
        user = request.user
        Recipiente.objects.filter(usuario=user, nombre='Taza/Vaso').update(nombre='Vaso')
        Recipiente.objects.filter(usuario=user, nombre='Botella/Termo pequeño').update(nombre='Botella')
        Recipiente.objects.get_or_create(
            usuario=user,
            nombre='Vaso',
            defaults={'cantidad_ml': 250, 'color': '#3B82F6', 'icono': 'cup', 'es_favorito': True}
        )
        Recipiente.objects.get_or_create(
            usuario=user,
            nombre='Botella',
            defaults={'cantidad_ml': 500, 'color': '#10B981', 'icono': 'bottle', 'es_favorito': True}
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
    
    def update(self, request, *args, **kwargs):
        """
        Previene editar los recipientes por defecto (250ml y 500ml).
        """
        instance = self.get_object()
        if instance.cantidad_ml in (250, 500):
            return Response({
                'error': 'No puedes editar los recipientes por defecto (Vaso y Botella).',
                'detail': 'Recipiente por defecto no editable'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Previene eliminar los recipientes por defecto (250ml y 500ml) para TODOS los usuarios.
        """
        instance = self.get_object()
        if instance.cantidad_ml in (250, 500):
            return Response({
                'error': 'No puedes eliminar los recipientes por defecto (Vaso y Botella).',
                'detail': 'Recipiente por defecto no se puede eliminar'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
