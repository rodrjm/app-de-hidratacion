from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Consumo, Recipiente, Bebida, MetaDiaria
from .serializers import (
    ConsumoSerializer, ConsumoCreateSerializer, RecipienteSerializer,
    BebidaSerializer, MetaDiariaSerializer
)


class ConsumoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar consumos de hidratación.
    Permite CRUD completo con filtros por fecha y usuario.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend, filters.SearchBackend, filters.OrderingFilter
    ]
    filterset_fields = [
        'fecha_hora', 'bebida', 'recipiente', 'nivel_sed', 'estado_animo'
    ]
    search_fields = [
        'notas', 'ubicacion', 'bebida__nombre', 'recipiente__nombre'
    ]
    ordering_fields = [
        'fecha_hora', 'cantidad_ml', 'cantidad_hidratacion_efectiva'
    ]
    ordering = ['-fecha_hora']

    def get_serializer_class(self):
        """
        Retorna el serializer apropiado según la acción.
        """
        if self.action == 'create':
            return ConsumoCreateSerializer
        return ConsumoSerializer

    def get_queryset(self):
        """
        Filtra los consumos del usuario autenticado.
        """
        queryset = Consumo.objects.filter(usuario=self.request.user)
        
        # Filtro por fecha específica
        fecha = self.request.query_params.get('date', None)
        if fecha:
            try:
                fecha_obj = timezone.datetime.strptime(fecha, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_hora__date=fecha_obj)
            except ValueError:
                pass
        
        # Filtro por rango de fechas
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        fecha_fin = self.request.query_params.get('fecha_fin', None)
        
        if fecha_inicio:
            try:
                fecha_inicio_obj = timezone.datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_hora__date__gte=fecha_inicio_obj)
            except ValueError:
                pass
        
        if fecha_fin:
            try:
                fecha_fin_obj = timezone.datetime.strptime(fecha_fin, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_hora__date__lte=fecha_fin_obj)
            except ValueError:
                pass
        
        return queryset.select_related('bebida', 'recipiente', 'usuario')

    def perform_create(self, serializer):
        """
        Asigna el usuario autenticado al crear un consumo.
        """
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Retorna estadísticas de consumos del usuario.
        """
        # Obtener parámetros de fecha
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        if not fecha_inicio:
            fecha_inicio = (timezone.now() - timedelta(days=30)).date()
        else:
            try:
                fecha_inicio = timezone.datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            except ValueError:
                fecha_inicio = (timezone.now() - timedelta(days=30)).date()
        
        if not fecha_fin:
            fecha_fin = timezone.now().date()
        else:
            try:
                fecha_fin = timezone.datetime.strptime(fecha_fin, '%Y-%m-%d').date()
            except ValueError:
                fecha_fin = timezone.now().date()
        
        # Filtrar consumos en el rango de fechas
        consumos = self.get_queryset().filter(
            fecha_hora__date__range=[fecha_inicio, fecha_fin]
        )
        
        # Calcular estadísticas
        total_consumido = consumos.aggregate(
            total=Sum('cantidad_ml')
        )['total'] or 0
        
        total_hidratacion_efectiva = consumos.aggregate(
            total=Sum('cantidad_hidratacion_efectiva')
        )['total'] or 0
        
        # Bebidas más consumidas
        bebidas_stats = consumos.values('bebida__nombre', 'bebida__factor_hidratacion').annotate(
            cantidad=Sum('cantidad_ml'),
            hidratacion_efectiva=Sum('cantidad_hidratacion_efectiva'),
            veces=Count('id')
        ).order_by('-cantidad')[:5]
        
        # Recipientes más usados
        recipientes_stats = consumos.values('recipiente__nombre', 'recipiente__cantidad_ml').annotate(
            cantidad=Sum('cantidad_ml'),
            veces=Count('id')
        ).order_by('-cantidad')[:5]
        
        # Estadísticas por día
        stats_por_dia = []
        current_date = fecha_inicio
        while current_date <= fecha_fin:
            consumos_dia = consumos.filter(fecha_hora__date=current_date)
            
            total_dia = consumos_dia.aggregate(total=Sum('cantidad_ml'))['total'] or 0
            hidratacion_dia = consumos_dia.aggregate(total=Sum('cantidad_hidratacion_efectiva'))['total'] or 0
            
            # Obtener meta del día
            try:
                meta_diaria = MetaDiaria.objects.get(
                    usuario=request.user,
                    fecha=current_date
                )
                meta_ml = meta_diaria.meta_ml
                progreso = meta_diaria.get_progreso_porcentaje()
                completada = meta_diaria.completada
            except MetaDiaria.DoesNotExist:
                meta_ml = request.user.meta_diaria_ml
                progreso = (hidratacion_dia / meta_ml * 100) if meta_ml > 0 else 0
                completada = hidratacion_dia >= meta_ml
            
            stats_por_dia.append({
                'fecha': current_date,
                'total_consumido_ml': total_dia,
                'total_hidratacion_efectiva_ml': hidratacion_dia,
                'meta_ml': meta_ml,
                'progreso_porcentaje': min(progreso, 100),
                'completada': completada,
                'consumos_count': consumos_dia.count()
            })
            
            current_date += timedelta(days=1)
        
        return Response({
            'periodo': {
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin,
                'dias': (fecha_fin - fecha_inicio).days + 1
            },
            'totales': {
                'total_consumido_ml': total_consumido,
                'total_hidratacion_efectiva_ml': total_hidratacion_efectiva,
                'promedio_diario_ml': total_consumido / max((fecha_fin - fecha_inicio).days + 1, 1),
                'consumos_count': consumos.count()
            },
            'bebidas_mas_consumidas': list(bebidas_stats),
            'recipientes_mas_usados': list(recipientes_stats),
            'estadisticas_por_dia': stats_por_dia
        })

    @action(detail=False, methods=['get'])
    def hoy(self, request):
        """
        Retorna los consumos del día actual.
        """
        hoy = timezone.now().date()
        consumos_hoy = self.get_queryset().filter(fecha_hora__date=hoy)
        
        # Calcular totales del día
        totales = consumos_hoy.aggregate(
            total_ml=Sum('cantidad_ml'),
            total_hidratacion=Sum('cantidad_hidratacion_efectiva')
        )
        
        # Obtener meta del día
        try:
            meta_diaria = MetaDiaria.objects.get(
                usuario=request.user,
                fecha=hoy
            )
            meta_ml = meta_diaria.meta_ml
            progreso = meta_diaria.get_progreso_porcentaje()
            completada = meta_diaria.completada
        except MetaDiaria.DoesNotExist:
            meta_ml = request.user.meta_diaria_ml
            total_hidratacion = totales['total_hidratacion'] or 0
            progreso = (total_hidratacion / meta_ml * 100) if meta_ml > 0 else 0
            completada = total_hidratacion >= meta_ml
        
        serializer = self.get_serializer(consumos_hoy, many=True)
        
        return Response({
            'fecha': hoy,
            'consumos': serializer.data,
            'resumen': {
                'total_ml': totales['total_ml'] or 0,
                'total_hidratacion_ml': totales['total_hidratacion'] or 0,
                'meta_ml': meta_ml,
                'progreso_porcentaje': min(progreso, 100),
                'completada': completada,
                'consumos_count': consumos_hoy.count()
            }
        })

    @action(detail=False, methods=['post'])
    def quick_add(self, request):
        """
        Endpoint rápido para agregar un consumo con datos mínimos.
        """
        data = request.data.copy()
        
        # Si no se especifica fecha, usar ahora
        if 'fecha_hora' not in data:
            data['fecha_hora'] = timezone.now()
        
        # Si no se especifica bebida, usar agua por defecto
        if 'bebida' not in data:
            try:
                agua = Bebida.objects.get(nombre='Agua', activa=True)
                data['bebida'] = agua.id
            except Bebida.DoesNotExist:
                return Response({
                    'error': 'No se encontró bebida de agua por defecto'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ConsumoCreateSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            consumo = serializer.save()
            response_serializer = ConsumoSerializer(consumo)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecipienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar recipientes personalizados.
    Permite CRUD completo solo para recipientes del usuario.
    """
    serializer_class = RecipienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchBackend, filters.OrderingFilter]
    filterset_fields = ['es_favorito', 'cantidad_ml']
    search_fields = ['nombre']
    ordering_fields = ['nombre', 'cantidad_ml', 'fecha_creacion']
    ordering = ['-es_favorito', 'nombre']

    def get_queryset(self):
        """
        Filtra los recipientes del usuario autenticado.
        """
        return Recipiente.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """
        Asigna el usuario autenticado al crear un recipiente.
        """
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """
        Alterna el estado de favorito de un recipiente.
        """
        recipiente = self.get_object()
        recipiente.es_favorito = not recipiente.es_favorito
        recipiente.save(update_fields=['es_favorito'])
        
        serializer = self.get_serializer(recipiente)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def favoritos(self, request):
        """
        Retorna solo los recipientes marcados como favoritos.
        """
        favoritos = self.get_queryset().filter(es_favorito=True)
        serializer = self.get_serializer(favoritos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_capacidad(self, request):
        """
        Retorna recipientes agrupados por capacidad.
        """
        capacidad = request.query_params.get('capacidad')
        if capacidad:
            try:
                capacidad_ml = int(capacidad)
                recipientes = self.get_queryset().filter(cantidad_ml=capacidad_ml)
            except ValueError:
                return Response({
                    'error': 'Capacidad debe ser un número válido'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            recipientes = self.get_queryset()
        
        serializer = self.get_serializer(recipientes, many=True)
        return Response(serializer.data)


class BebidaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para bebidas disponibles.
    """
    serializer_class = BebidaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchBackend, filters.OrderingFilter]
    filterset_fields = ['es_agua', 'activa', 'factor_hidratacion']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'factor_hidratacion', 'calorias_por_ml']
    ordering = ['nombre']

    def get_queryset(self):
        """
        Retorna solo bebidas activas.
        """
        return Bebida.objects.filter(activa=True)

    @action(detail=False, methods=['get'])
    def hidratantes(self, request):
        """
        Retorna bebidas con factor de hidratación >= 0.8.
        """
        hidratantes = self.get_queryset().filter(factor_hidratacion__gte=0.8)
        serializer = self.get_serializer(hidratantes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def agua(self, request):
        """
        Retorna solo bebidas de agua.
        """
        agua = self.get_queryset().filter(es_agua=True)
        serializer = self.get_serializer(agua, many=True)
        return Response(serializer.data)


class MetaDiariaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para metas diarias.
    """
    serializer_class = MetaDiariaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fecha', 'completada']
    ordering_fields = ['fecha', 'meta_ml', 'consumido_ml']
    ordering = ['-fecha']

    def get_queryset(self):
        """
        Filtra las metas del usuario autenticado.
        """
        return MetaDiaria.objects.filter(usuario=self.request.user)

    @action(detail=False, methods=['get'])
    def resumen_semanal(self, request):
        """
        Retorna resumen de la semana actual.
        """
        hoy = timezone.now().date()
        inicio_semana = hoy - timedelta(days=hoy.weekday())
        fin_semana = inicio_semana + timedelta(days=6)
        
        metas_semana = self.get_queryset().filter(
            fecha__range=[inicio_semana, fin_semana]
        )
        
        # Calcular estadísticas de la semana
        total_meta = metas_semana.aggregate(total=Sum('meta_ml'))['total'] or 0
        total_consumido = metas_semana.aggregate(total=Sum('consumido_ml'))['total'] or 0
        total_hidratacion = metas_semana.aggregate(total=Sum('hidratacion_efectiva_ml'))['total'] or 0
        dias_completados = metas_semana.filter(completada=True).count()
        
        serializer = self.get_serializer(metas_semana, many=True)
        
        return Response({
            'periodo': {
                'inicio_semana': inicio_semana,
                'fin_semana': fin_semana
            },
            'resumen': {
                'total_meta_ml': total_meta,
                'total_consumido_ml': total_consumido,
                'total_hidratacion_efectiva_ml': total_hidratacion,
                'dias_completados': dias_completados,
                'dias_totales': 7,
                'promedio_diario_ml': total_consumido / 7,
                'eficiencia_hidratacion': (total_hidratacion / total_consumido * 100) if total_consumido > 0 else 0
            },
            'metas_diarias': serializer.data
        })
