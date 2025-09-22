from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Consumo, Recipiente, Bebida, MetaDiaria, Recordatorio
from .serializers import (
    ConsumoSerializer, ConsumoCreateSerializer, RecipienteSerializer,
    BebidaSerializer, MetaDiariaSerializer, RecordatorioSerializer,
    RecordatorioCreateSerializer, MetaFijaSerializer, RecordatorioStatsSerializer,
    SubscriptionStatusSerializer, PremiumFeaturesSerializer, UsageLimitsSerializer,
    MonetizationStatsSerializer
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


class MetaFijaView(APIView):
    """
    Vista para obtener la meta fija de hidratación.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna la meta fija de hidratación del usuario.
        """
        from django.conf import settings
        
        # Obtener meta fija desde settings o usar valor por defecto
        meta_fija_ml = getattr(settings, 'META_FIJA_ML', 2000)
        
        # Para usuarios premium, usar su meta personalizada
        if request.user.es_premium:
            meta_ml = request.user.meta_diaria_ml
            tipo_meta = 'personalizada'
            descripcion = 'Meta personalizada basada en tu perfil'
            es_personalizable = True
        else:
            meta_ml = meta_fija_ml
            tipo_meta = 'fija'
            descripcion = 'Meta fija para usuarios gratuitos'
            es_personalizable = False
        
        data = {
            'meta_ml': meta_ml,
            'tipo_meta': tipo_meta,
            'descripcion': descripcion,
            'es_personalizable': es_personalizable,
            'fecha_actualizacion': request.user.fecha_actualizacion
        }
        
        serializer = MetaFijaSerializer(data)
        return Response(serializer.data)


class RecordatorioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar recordatorios de hidratación.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchBackend, filters.OrderingFilter]
    filterset_fields = ['activo', 'tipo_recordatorio', 'frecuencia']
    search_fields = ['mensaje']
    ordering_fields = ['hora', 'fecha_creacion']
    ordering = ['hora']

    def get_serializer_class(self):
        """
        Retorna el serializer apropiado según la acción.
        """
        if self.action == 'create':
            return RecordatorioCreateSerializer
        return RecordatorioSerializer

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

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Alterna el estado activo de un recordatorio.
        """
        recordatorio = self.get_object()
        recordatorio.activo = not recordatorio.activo
        recordatorio.save(update_fields=['activo'])
        
        serializer = self.get_serializer(recordatorio)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """
        Retorna solo los recordatorios activos.
        """
        activos = self.get_queryset().filter(activo=True)
        serializer = self.get_serializer(activos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def proximos(self, request):
        """
        Retorna los próximos recordatorios programados.
        """
        from datetime import datetime, timedelta
        
        # Obtener próximos 7 días
        hoy = timezone.now().date()
        proximos_dias = [hoy + timedelta(days=i) for i in range(7)]
        
        recordatorios_proximos = []
        
        for recordatorio in self.get_queryset().filter(activo=True):
            proximo_envio = recordatorio.get_proximo_envio()
            if proximo_envio and proximo_envio.date() in proximos_dias:
                recordatorios_proximos.append({
                    'id': recordatorio.id,
                    'hora': recordatorio.hora,
                    'mensaje': recordatorio.get_mensaje_completo(),
                    'tipo_recordatorio': recordatorio.tipo_recordatorio,
                    'proximo_envio': proximo_envio.isoformat(),
                    'dias_semana': recordatorio.dias_semana
                })
        
        # Ordenar por próximo envío
        recordatorios_proximos.sort(key=lambda x: x['proximo_envio'])
        
        return Response(recordatorios_proximos)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Retorna estadísticas de recordatorios del usuario.
        """
        queryset = self.get_queryset()
        
        # Contar totales
        total_recordatorios = queryset.count()
        recordatorios_activos = queryset.filter(activo=True).count()
        recordatorios_inactivos = total_recordatorios - recordatorios_activos
        
        # Próximos recordatorios
        proximos = []
        for recordatorio in queryset.filter(activo=True)[:5]:
            proximo_envio = recordatorio.get_proximo_envio()
            if proximo_envio:
                proximos.append({
                    'id': recordatorio.id,
                    'hora': recordatorio.hora,
                    'mensaje': recordatorio.get_mensaje_completo(),
                    'proximo_envio': proximo_envio.isoformat()
                })
        
        # Agrupar por tipo
        recordatorios_por_tipo = {}
        for tipo, _ in Recordatorio._meta.get_field('tipo_recordatorio').choices:
            count = queryset.filter(tipo_recordatorio=tipo).count()
            if count > 0:
                recordatorios_por_tipo[tipo] = count
        
        # Agrupar por frecuencia
        recordatorios_por_frecuencia = {}
        for frecuencia, _ in Recordatorio._meta.get_field('frecuencia').choices:
            count = queryset.filter(frecuencia=frecuencia).count()
            if count > 0:
                recordatorios_por_frecuencia[frecuencia] = count
        
        data = {
            'total_recordatorios': total_recordatorios,
            'recordatorios_activos': recordatorios_activos,
            'recordatorios_inactivos': recordatorios_inactivos,
            'proximos_recordatorios': proximos,
            'recordatorios_por_tipo': recordatorios_por_tipo,
            'recordatorios_por_frecuencia': recordatorios_por_frecuencia
        }
        
        serializer = RecordatorioStatsSerializer(data)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def marcar_enviado(self, request, pk=None):
        """
        Marca un recordatorio como enviado.
        """
        recordatorio = self.get_object()
        recordatorio.marcar_enviado()
        
        serializer = self.get_serializer(recordatorio)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def crear_rapido(self, request):
        """
        Crea un recordatorio rápido con configuración mínima.
        """
        data = request.data.copy()
        
        # Valores por defecto
        if 'tipo_recordatorio' not in data:
            data['tipo_recordatorio'] = 'agua'
        if 'frecuencia' not in data:
            data['frecuencia'] = 'diario'
        if 'dias_semana' not in data:
            data['dias_semana'] = list(range(7))  # Todos los días
        
        serializer = RecordatorioCreateSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            recordatorio = serializer.save()
            response_serializer = RecordatorioSerializer(recordatorio)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionStatusView(APIView):
    """
    Vista para obtener el estado de suscripción del usuario.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna el estado de suscripción del usuario autenticado.
        """
        from django.conf import settings
        
        user = request.user
        is_premium = user.es_premium
        
        # Determinar tipo de suscripción
        if is_premium:
            subscription_type = "premium"
            subscription_end_date = None  # Por ahora no hay fecha de expiración
            days_remaining = None
        else:
            subscription_type = "gratuito"
            subscription_end_date = None
            days_remaining = None
        
        # Funcionalidades disponibles según el plan
        if is_premium:
            features_available = [
                "Meta diaria personalizada",
                "Estadísticas y análisis avanzados",
                "Recordatorios ilimitados",
                "Sin anuncios",
                "Exportación de datos",
                "Temas personalizados",
                "Sincronización en la nube",
                "Soporte prioritario"
            ]
        else:
            features_available = [
                "Meta diaria fija",
                "Estadísticas básicas",
                "Recordatorios limitados (3 máximo)",
                "Tema estándar"
            ]
        
        # Límites según el plan
        if is_premium:
            limitations = {
                "recordatorios_max": settings.META_MAX_RECORDATORIOS_PREMIUM,
                "consumos_diarios_max": 1000,
                "estadisticas_avanzadas": True,
                "exportacion_datos": True,
                "personalizacion_completa": True,
                "anuncios": False
            }
        else:
            limitations = {
                "recordatorios_max": settings.META_MAX_RECORDATORIOS_GRATUITOS,
                "consumos_diarios_max": 50,
                "estadisticas_avanzadas": False,
                "exportacion_datos": False,
                "personalizacion_completa": False,
                "anuncios": True
            }
        
        # Determinar si necesita upgrade
        upgrade_required = not is_premium
        
        data = {
            'is_premium': is_premium,
            'subscription_type': subscription_type,
            'subscription_end_date': subscription_end_date,
            'days_remaining': days_remaining,
            'features_available': features_available,
            'limitations': limitations,
            'upgrade_required': upgrade_required
        }
        
        serializer = SubscriptionStatusSerializer(data)
        return Response(serializer.data)


class PremiumFeaturesView(APIView):
    """
    Vista para obtener la lista de funcionalidades premium.
    No requiere autenticación para que sea visible para todos.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Retorna la lista de funcionalidades premium disponibles.
        """
        features = [
            {
                "id": "meta_personalizada",
                "name": "Meta Diaria Personalizada",
                "description": "Calcula tu meta de hidratación basada en tu peso, edad y nivel de actividad",
                "icon": "target",
                "category": "Personalización",
                "is_available": True
            },
            {
                "id": "estadisticas_avanzadas",
                "name": "Estadísticas y Análisis Avanzados",
                "description": "Gráficos detallados, tendencias y análisis de tu progreso de hidratación",
                "icon": "chart-line",
                "category": "Análisis",
                "is_available": True
            },
            {
                "id": "recordatorios_ilimitados",
                "name": "Recordatorios Ilimitados",
                "description": "Crea tantos recordatorios como necesites para mantenerte hidratado",
                "icon": "bell",
                "category": "Recordatorios",
                "is_available": True
            },
            {
                "id": "sin_anuncios",
                "name": "Sin Anuncios",
                "description": "Disfruta de la aplicación sin interrupciones publicitarias",
                "icon": "ad",
                "category": "Experiencia",
                "is_available": True
            },
            {
                "id": "exportacion_datos",
                "name": "Exportación de Datos",
                "description": "Exporta tus datos de hidratación en formato CSV o PDF",
                "icon": "download",
                "category": "Datos",
                "is_available": True
            },
            {
                "id": "temas_personalizados",
                "name": "Temas Personalizados",
                "description": "Personaliza la apariencia de la aplicación con diferentes temas",
                "icon": "palette",
                "category": "Personalización",
                "is_available": True
            },
            {
                "id": "sincronizacion_nube",
                "name": "Sincronización en la Nube",
                "description": "Sincroniza tus datos entre todos tus dispositivos",
                "icon": "cloud",
                "category": "Sincronización",
                "is_available": True
            },
            {
                "id": "soporte_prioritario",
                "name": "Soporte Prioritario",
                "description": "Recibe soporte técnico prioritario y respuesta rápida",
                "icon": "headset",
                "category": "Soporte",
                "is_available": True
            },
            {
                "id": "analisis_tendencias",
                "name": "Análisis de Tendencias",
                "description": "Identifica patrones en tu hidratación y recibe recomendaciones",
                "icon": "trending-up",
                "category": "Análisis",
                "is_available": True
            },
            {
                "id": "recordatorios_inteligentes",
                "name": "Recordatorios Inteligentes",
                "description": "Recordatorios que se adaptan a tu rutina y patrones de hidratación",
                "icon": "brain",
                "category": "Recordatorios",
                "is_available": True
            }
        ]
        
        # Obtener categorías únicas
        categories = list(set(feature["category"] for feature in features))
        categories.sort()
        
        data = {
            'features': features,
            'total_features': len(features),
            'categories': categories
        }
        
        serializer = PremiumFeaturesSerializer(data)
        return Response(serializer.data)


class UsageLimitsView(APIView):
    """
    Vista para obtener los límites de uso del usuario.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna los límites de uso actuales del usuario.
        """
        from django.conf import settings
        
        user = request.user
        is_premium = user.es_premium
        
        # Obtener uso actual
        recordatorios_actuales = Recordatorio.objects.filter(usuario=user).count()
        consumos_hoy = Consumo.objects.filter(
            usuario=user,
            fecha_hora__date=timezone.now().date()
        ).count()
        
        if is_premium:
            recordatorios_max = settings.META_MAX_RECORDATORIOS_PREMIUM
            consumos_max = 1000
        else:
            recordatorios_max = settings.META_MAX_RECORDATORIOS_GRATUITOS
            consumos_max = 50
        
        data = {
            'recordatorios': {
                'actual': recordatorios_actuales,
                'maximo': recordatorios_max,
                'porcentaje': (recordatorios_actuales / recordatorios_max * 100) if recordatorios_max > 0 else 0,
                'restantes': max(0, recordatorios_max - recordatorios_actuales)
            },
            'consumos_diarios': {
                'actual': consumos_hoy,
                'maximo': consumos_max,
                'porcentaje': (consumos_hoy / consumos_max * 100) if consumos_max > 0 else 0,
                'restantes': max(0, consumos_max - consumos_hoy)
            },
            'estadisticas_avanzadas': {
                'disponible': is_premium,
                'descripcion': "Gráficos detallados y análisis avanzados" if is_premium else "Solo disponible en versión premium"
            },
            'exportacion_datos': {
                'disponible': is_premium,
                'descripcion': "Exporta tus datos en CSV/PDF" if is_premium else "Solo disponible en versión premium"
            },
            'personalizacion': {
                'disponible': is_premium,
                'descripcion': "Temas y personalización completa" if is_premium else "Solo disponible en versión premium"
            }
        }
        
        serializer = UsageLimitsSerializer(data)
        return Response(serializer.data)


class MonetizationStatsView(APIView):
    """
    Vista para obtener estadísticas de monetización (solo para administradores).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna estadísticas de monetización del sistema.
        """
        from django.contrib.auth import get_user_model
        from decimal import Decimal
        
        # Solo administradores pueden ver estas estadísticas
        if not request.user.is_staff:
            return Response({
                'error': 'No tienes permisos para ver estas estadísticas'
            }, status=status.HTTP_403_FORBIDDEN)
        
        User = get_user_model()
        
        # Calcular estadísticas
        usuarios_totales = User.objects.count()
        usuarios_premium = User.objects.filter(es_premium=True).count()
        usuarios_gratuitos = usuarios_totales - usuarios_premium
        
        conversion_rate = (usuarios_premium / usuarios_totales * 100) if usuarios_totales > 0 else 0
        
        # Simular ingresos mensuales (esto debería venir de un sistema de pagos real)
        ingresos_mensuales = Decimal('0.00')  # Placeholder
        
        # Funcionalidades más usadas (simulado)
        funcionalidades_mas_usadas = [
            {'nombre': 'Recordatorios', 'uso': 85, 'premium': False},
            {'nombre': 'Estadísticas Básicas', 'uso': 70, 'premium': False},
            {'nombre': 'Meta Personalizada', 'uso': 45, 'premium': True},
            {'nombre': 'Exportación de Datos', 'uso': 30, 'premium': True},
            {'nombre': 'Temas Personalizados', 'uso': 25, 'premium': True}
        ]
        
        data = {
            'usuarios_totales': usuarios_totales,
            'usuarios_premium': usuarios_premium,
            'usuarios_gratuitos': usuarios_gratuitos,
            'conversion_rate': round(conversion_rate, 2),
            'ingresos_mensuales': ingresos_mensuales,
            'funcionalidades_mas_usadas': funcionalidades_mas_usadas
        }
        
        serializer = MonetizationStatsSerializer(data)
        return Response(serializer.data)


class UpgradePromptView(APIView):
    """
    Vista para mostrar información de upgrade al usuario.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna información personalizada de upgrade para el usuario.
        """
        user = request.user
        
        if user.es_premium:
            return Response({
                'message': 'Ya tienes una suscripción premium activa',
                'is_premium': True
            })
        
        # Obtener uso actual para personalizar el mensaje
        recordatorios_actuales = Recordatorio.objects.filter(usuario=user).count()
        consumos_este_mes = Consumo.objects.filter(
            usuario=user,
            fecha_hora__date__gte=timezone.now().date() - timedelta(days=30)
        ).count()
        
        # Determinar qué funcionalidades le interesarían más
        recomendaciones = []
        
        if recordatorios_actuales >= 2:  # Cerca del límite
            recomendaciones.append({
                'funcionalidad': 'Recordatorios Ilimitados',
                'descripcion': f'Actualmente tienes {recordatorios_actuales} recordatorios. Con Premium puedes crear ilimitados.',
                'icon': 'bell'
            })
        
        if consumos_este_mes > 20:
            recomendaciones.append({
                'funcionalidad': 'Estadísticas Avanzadas',
                'descripcion': 'Con tantos registros, las estadísticas avanzadas te ayudarían a analizar tu progreso.',
                'icon': 'chart-line'
            })
        
        # Recomendaciones por defecto si no hay patrones específicos
        if not recomendaciones:
            recomendaciones = [
                {
                    'funcionalidad': 'Meta Personalizada',
                    'descripcion': 'Calcula tu meta ideal basada en tu perfil personal.',
                    'icon': 'target'
                },
                {
                    'funcionalidad': 'Sin Anuncios',
                    'descripcion': 'Disfruta de la aplicación sin interrupciones.',
                    'icon': 'ad'
                }
            ]
        
        data = {
            'is_premium': False,
            'recomendaciones': recomendaciones,
            'beneficios_principales': [
                'Meta diaria personalizada',
                'Recordatorios ilimitados',
                'Estadísticas avanzadas',
                'Sin anuncios'
            ],
            'precio_mensual': 4.99,
            'precio_anual': 49.99,
            'ahorro_anual': 10.89
        }
        
        return Response(data)
