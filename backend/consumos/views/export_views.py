"""
Vista para exportar datos de consumos.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from django.http import HttpResponse
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
import csv
import io

from ..models import Consumo
from ..serializers.consumo_serializers import ConsumoSerializer


class ConsumoExportView(APIView):
    """
    Vista para exportar datos de consumos en diferentes formatos.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'export'

    def get_throttles(self):
        """
        Aumenta el límite para usuarios premium usando un scope distinto.
        """
        if getattr(self.request.user, 'es_premium', False):
            self.throttle_scope = 'export_premium'
        else:
            self.throttle_scope = 'export'
        return super().get_throttles()

    def get(self, request):
        """
        Exporta datos de consumos según los parámetros especificados.
        """
        print("🔍 Export endpoint called")
        print(f"Format: {request.query_params.get('format', 'csv')}")
        print(f"User: {request.user}")
        
        try:
            # Obtener parámetros
            format_type = request.query_params.get('format', 'csv')
            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')

            # Determinar rango de fechas
            if date_from and date_to:
                try:
                    fecha_inicio = datetime.strptime(date_from, '%Y-%m-%d').date()
                    fecha_fin = datetime.strptime(date_to, '%Y-%m-%d').date()
                except ValueError:
                    return Response({
                        'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Por defecto, últimos 30 días
                fecha_fin = timezone.now().date()
                fecha_inicio = fecha_fin - timedelta(days=30)

            print(f"Date range: {fecha_inicio} to {fecha_fin}")

            # Filtrar consumos
            consumos = Consumo.objects.filter(
                usuario=request.user,
                fecha_hora__date__range=[fecha_inicio, fecha_fin]
            ).select_related('bebida', 'recipiente').order_by('-fecha_hora')

            print(f"Found {consumos.count()} consumos")

            # Calcular estadísticas
            stats = consumos.aggregate(
                total_ml=Sum('cantidad_ml'),
                total_hidratacion=Sum('cantidad_hidratacion_efectiva'),
                cantidad_consumos=Count('id'),
                promedio_diario=Avg('cantidad_ml')
            )

            # Preparar datos
            consumos_data = ConsumoSerializer(consumos, many=True).data
            
            summary = {
                'total_ml': stats['total_ml'] or 0,
                'total_hidratacion_efectiva_ml': stats['total_hidratacion'] or 0,
                'cantidad_consumos': stats['cantidad_consumos'] or 0,
                'periodo': f"{fecha_inicio} a {fecha_fin}",
                'promedio_diario_ml': round(stats['promedio_diario'] or 0, 2)
            }

            print(f"Summary: {summary}")

            if format_type == 'csv':
                print("Returning CSV")
                return self._export_csv(consumos_data, summary, fecha_inicio, fecha_fin)
            elif format_type == 'json':
                print("Returning JSON")
                return Response({
                    'consumos': consumos_data,
                    'summary': summary
                })
            else:
                return Response({
                    'error': 'Formato no soportado. Use: csv o json'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"❌ Error en export view: {e}")
            print(traceback.format_exc())
            return Response({
                'error': f'Error interno: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _export_csv(self, consumos_data, summary, fecha_inicio, fecha_fin):
        """
        Exporta datos en formato CSV.
        """
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        filename = f"hidratacion_{fecha_inicio}_{fecha_fin}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        # Crear CSV usando StringIO para evitar problemas de encoding
        import io
        import csv
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        headers = [
            'Fecha', 'Hora', 'Bebida', 'Cantidad (ml)', 
            'Hidratación Efectiva (ml)', 'Recipiente', 
            'Nivel de Sed', 'Estado de Ánimo', 'Ubicación', 'Notas'
        ]
        writer.writerow(headers)

        # Datos de consumos
        for consumo in consumos_data:
            fecha_obj = datetime.fromisoformat(consumo['fecha_hora'].replace('Z', '+00:00'))
            
            row = [
                fecha_obj.strftime('%Y-%m-%d'),
                fecha_obj.strftime('%H:%M'),
                consumo.get('bebida_nombre', 'N/A'),
                consumo['cantidad_ml'],
                consumo.get('hidratacion_efectiva_ml', 'N/A'),
                consumo.get('recipiente_nombre', 'N/A'),
                self._get_nivel_sed_text(consumo.get('nivel_sed')),
                self._get_estado_animo_text(consumo.get('estado_animo')),
                consumo.get('ubicacion', 'N/A'),
                consumo.get('notas', 'N/A')
            ]
            writer.writerow(row)

        # Agregar resumen
        writer.writerow([])  # Línea vacía
        writer.writerow(['RESUMEN DEL PERÍODO'])
        writer.writerow(['Período', f"{fecha_inicio} a {fecha_fin}"])
        writer.writerow(['Total Consumido (ml)', summary['total_ml']])
        writer.writerow(['Hidratación Efectiva (ml)', summary['total_hidratacion_efectiva_ml']])
        writer.writerow(['Cantidad de Consumos', summary['cantidad_consumos']])
        writer.writerow(['Promedio Diario (ml)', summary['promedio_diario_ml']])

        # Escribir al response
        response.write(output.getvalue())
        output.close()
        
        return response

    def _get_nivel_sed_text(self, nivel):
        """
        Convierte nivel numérico a texto.
        """
        niveles = {
            1: 'Muy poca sed',
            2: 'Poca sed',
            3: 'Sed normal',
            4: 'Mucha sed',
            5: 'Muy sediento'
        }
        return niveles.get(nivel, 'N/A')

    def _get_estado_animo_text(self, estado):
        """
        Convierte estado de ánimo a texto legible.
        """
        estados = {
            'excelente': 'Excelente',
            'bueno': 'Bueno',
            'regular': 'Regular',
            'malo': 'Malo',
            'terrible': 'Terrible'
        }
        return estados.get(estado, estado or 'N/A')
