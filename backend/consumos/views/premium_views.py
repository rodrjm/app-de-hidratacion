"""
Vistas para funcionalidades premium.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status

from ..models import Bebida, Recordatorio
from ..serializers.premium_serializers import (
    PremiumGoalSerializer, PremiumBeverageSerializer, 
    PremiumReminderSerializer, PremiumReminderCreateSerializer
)
from ..permissions import IsPremiumUser


class PremiumGoalView(APIView):
    """
    Vista para calcular meta personalizada premium.
    """
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get(self, request):
        """
        Calcula la meta personalizada basada en peso, edad y perfil del usuario.
        Usa el mismo método calcular_meta_hidratacion() que el resto de la aplicación.
        """
        user = request.user
        
        # Obtener datos del usuario
        peso_kg = user.peso
        nivel_actividad = getattr(user, 'nivel_actividad', 'moderado')
        
        # Usar el método estándar de cálculo de meta que incluye:
        # - Cálculo basado en edad y peso
        # - Reducción del 20% (porque el 20% viene de los alimentos)
        # - Límites de seguridad
        meta_ml = user.calcular_meta_hidratacion()
        
        # Fallback defensivo
        if not meta_ml or meta_ml <= 0:
            meta_ml = user.meta_diaria_ml or 2000
        
        # Factores de actividad (para información, aunque no se usen en el cálculo)
        activity_factors = {
            'sedentario': 1.0,
            'ligero': 1.1,
            'moderado': 1.2,
            'intenso': 1.4,
            'muy_intenso': 1.6
        }
        
        factor_actividad = activity_factors.get(nivel_actividad, 1.2)
        
        data = {
            'meta_ml': meta_ml,
            'peso_kg': peso_kg,
            'nivel_actividad': nivel_actividad,
            'factor_actividad': factor_actividad,
            'formula_usada': 'calcular_meta_hidratacion() - Basada en edad, peso y perfil de salud'
        }
        
        serializer = PremiumGoalSerializer(data)
        return Response(serializer.data)


class PremiumBeverageListView(APIView):
    """
    Vista para listar todas las bebidas (incluyendo premium).
    """
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get(self, request):
        """
        Retorna todas las bebidas disponibles para usuarios premium.
        """
        bebidas = Bebida.objects.filter(activa=True).order_by('nombre')
        
        data = []
        for bebida in bebidas:
            data.append({
                'id': bebida.id,
                'nombre': bebida.nombre,
                'factor_hidratacion': bebida.factor_hidratacion,
                'es_premium': bebida.es_premium,
                'descripcion': bebida.descripcion,
                'calorias_por_ml': bebida.calorias_por_ml
            })
        
        serializer = PremiumBeverageSerializer(data, many=True)
        return Response(serializer.data)


class PremiumReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar recordatorios ilimitados (premium).
    """
    queryset = Recordatorio.objects.all()
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get_serializer_class(self):
        """
        Retorna el serializer apropiado según la acción.
        """
        if self.action == 'create':
            return PremiumReminderCreateSerializer
        return PremiumReminderSerializer

    def get_queryset(self):
        """
        Filtra los recordatorios del usuario autenticado.
        """
        return Recordatorio.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """
        Asigna el usuario autenticado al crear un recordatorio.
        """
        serializer.save(usuario=self.request.user)
