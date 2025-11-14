"""
Vistas para estadísticas y análisis avanzados.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView

from ..models import Consumo
from ..serializers.stats_serializers import (
    ConsumoHistorySerializer, ConsumoSummarySerializer,
    ConsumoDailySummarySerializer, ConsumoWeeklySummarySerializer,
    ConsumoMonthlySummarySerializer, ConsumoTrendSerializer,
    ConsumoInsightsSerializer
)
from ..permissions import IsPremiumUser


class ConsumoHistoryView(ListAPIView):
    """
    Vista para obtener el historial detallado de consumos.
    Solo accesible para usuarios premium.
    """
    serializer_class = ConsumoHistorySerializer
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get_queryset(self):
        """
        Filtra los consumos del usuario autenticado.
        """
        return Consumo.objects.filter(usuario=self.request.user).order_by('-fecha_hora')


class ConsumoSummaryView(APIView):
    """
    Vista para obtener estadísticas agregadas de consumos.
    Solo accesible para usuarios premium.
    """
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get(self, request):
        """
        Retorna estadísticas agregadas según el periodo solicitado.
        """
        period = request.query_params.get('period', 'daily')
        
        # Obtener rango de fechas
        from django.utils import timezone
        from datetime import timedelta
        
        fecha_fin = timezone.now().date()
        if period == 'daily':
            fecha_inicio = fecha_fin
        elif period == 'weekly':
            fecha_inicio = fecha_fin - timedelta(days=7)
        elif period == 'monthly':
            fecha_inicio = fecha_fin - timedelta(days=30)
        else:
            return Response({
                'error': 'Periodo no válido. Use: daily, weekly, o monthly'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Filtrar consumos del usuario en el rango de fechas
        consumos = Consumo.objects.filter(
            usuario=request.user,
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        )
        
        # Calcular estadísticas
        from django.db.models import Sum, Count
        
        total_ml = consumos.aggregate(total=Sum('cantidad_ml'))['total'] or 0
        total_hidratacion = consumos.aggregate(total=Sum('cantidad_hidratacion_efectiva'))['total'] or 0
        cantidad_consumos = consumos.count()
        
        data = {
            'periodo': period,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_ml': total_ml,
            'total_hidratacion_efectiva_ml': total_hidratacion,
            'cantidad_consumos': cantidad_consumos,
            'promedio_diario_ml': total_ml / max(1, (fecha_fin - fecha_inicio).days + 1)
        }
        
        serializer = ConsumoSummarySerializer(data)
        return Response(serializer.data)


class ConsumoTrendsView(APIView):
    """
    Vista para obtener tendencias de consumo.
    Solo accesible para usuarios premium.
    """
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get(self, request):
        """
        Retorna tendencias de consumo del usuario.
        """
        from ..services.consumo_service import ConsumoService
        
        service = ConsumoService(request.user)
        period = request.query_params.get('period', 'weekly')
        
        try:
            trends = service.get_trends(period)
            serializer = ConsumoTrendSerializer(trends)
            return Response(serializer.data)
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ConsumoInsightsView(APIView):
    """
    Vista para obtener insights y análisis avanzados de consumos.
    Solo accesible para usuarios premium.
    """
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def get(self, request):
        """
        Retorna insights y análisis de consumos del usuario.
        """
        from ..services.consumo_service import ConsumoService
        
        service = ConsumoService(request.user)
        days = int(request.query_params.get('days', 30))
        
        try:
            insights = service.get_insights(days)
            serializer = ConsumoInsightsSerializer(insights)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
