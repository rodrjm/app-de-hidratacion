from rest_framework import serializers
from django.utils import timezone
from .models import Consumo, Recipiente, Bebida, MetaDiaria, Recordatorio


class BebidaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Bebida.
    """
    class Meta:
        model = Bebida
        fields = [
            'id', 'nombre', 'factor_hidratacion', 'descripcion',
            'es_agua', 'calorias_por_ml', 'activa', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class RecipienteSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Recipiente.
    """
    usuario = serializers.StringRelatedField(read_only=True)
    hidratacion_efectiva_ml = serializers.SerializerMethodField()

    class Meta:
        model = Recipiente
        fields = [
            'id', 'usuario', 'nombre', 'cantidad_ml', 'color',
            'icono', 'es_favorito', 'fecha_creacion', 'hidratacion_efectiva_ml'
        ]
        read_only_fields = ['id', 'usuario', 'fecha_creacion']

    def get_hidratacion_efectiva_ml(self, obj):
        """
        Calcula la hidratación efectiva considerando el factor de la bebida.
        Por defecto, asume agua (factor 1.0).
        """
        return obj.cantidad_ml

    def validate_nombre(self, value):
        """
        Valida que el nombre del recipiente sea único para el usuario.
        """
        user = self.context['request'].user
        if self.instance:
            # Para actualización, excluir el objeto actual
            if Recipiente.objects.filter(
                usuario=user, nombre=value
            ).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(
                    'Ya tienes un recipiente con este nombre.'
                )
        else:
            # Para creación
            if Recipiente.objects.filter(usuario=user, nombre=value).exists():
                raise serializers.ValidationError(
                    'Ya tienes un recipiente con este nombre.'
                )
        return value

    def validate_cantidad_ml(self, value):
        """
        Valida que la cantidad esté en un rango razonable.
        """
        if value < 1:
            raise serializers.ValidationError(
                'La capacidad debe ser al menos 1ml.'
            )
        if value > 5000:
            raise serializers.ValidationError(
                'La capacidad no puede exceder 5000ml.'
            )
        return value


class ConsumoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Consumo.
    """
    usuario = serializers.StringRelatedField(read_only=True)
    bebida_nombre = serializers.CharField(source='bebida.nombre', read_only=True)
    recipiente_nombre = serializers.CharField(
        source='recipiente.nombre', read_only=True
    )
    hidratacion_efectiva_porcentaje = serializers.SerializerMethodField()
    meta_diaria_progreso = serializers.SerializerMethodField()

    class Meta:
        model = Consumo
        fields = [
            'id', 'usuario', 'bebida', 'bebida_nombre', 'recipiente',
            'recipiente_nombre', 'cantidad_ml', 'cantidad_hidratacion_efectiva',
            'hidratacion_efectiva_porcentaje', 'fecha_hora', 'notas',
            'ubicacion', 'temperatura_ambiente', 'nivel_sed', 'estado_animo',
            'fecha_creacion', 'meta_diaria_progreso'
        ]
        read_only_fields = [
            'id', 'usuario', 'cantidad_hidratacion_efectiva',
            'fecha_creacion', 'meta_diaria_progreso'
        ]

    def get_hidratacion_efectiva_porcentaje(self, obj):
        """
        Retorna el porcentaje de hidratación efectiva.
        """
        return obj.get_hidratacion_efectiva_porcentaje()

    def get_meta_diaria_progreso(self, obj):
        """
        Calcula el progreso hacia la meta diaria.
        """
        try:
            meta_diaria = MetaDiaria.objects.get(
                usuario=obj.usuario,
                fecha=obj.fecha_hora.date()
            )
            return {
                'meta_ml': meta_diaria.meta_ml,
                'consumido_ml': meta_diaria.consumido_ml,
                'hidratacion_efectiva_ml': meta_diaria.hidratacion_efectiva_ml,
                'progreso_porcentaje': meta_diaria.get_progreso_porcentaje(),
                'completada': meta_diaria.completada
            }
        except MetaDiaria.DoesNotExist:
            return None

    def validate_bebida(self, value):
        """
        Valida que la bebida esté activa.
        """
        if not value.activa:
            raise serializers.ValidationError(
                'Esta bebida no está disponible.'
            )
        return value

    def validate_recipiente(self, value):
        """
        Valida que el recipiente pertenezca al usuario.
        """
        if value and value.usuario != self.context['request'].user:
            raise serializers.ValidationError(
                'No tienes permisos para usar este recipiente.'
            )
        return value

    def validate_cantidad_ml(self, value):
        """
        Valida que la cantidad esté en un rango razonable.
        """
        if value < 1:
            raise serializers.ValidationError(
                'La cantidad debe ser al menos 1ml.'
            )
        if value > 5000:
            raise serializers.ValidationError(
                'La cantidad no puede exceder 5000ml.'
            )
        return value

    def validate_fecha_hora(self, value):
        """
        Valida que la fecha no sea futura.
        """
        if value > timezone.now():
            raise serializers.ValidationError(
                'No puedes registrar consumos futuros.'
            )
        return value

    def validate(self, attrs):
        """
        Validaciones adicionales del serializer.
        """
        # Validar que el recipiente tenga la capacidad suficiente
        recipiente = attrs.get('recipiente')
        cantidad = attrs.get('cantidad_ml')
        
        if recipiente and cantidad and cantidad > recipiente.cantidad_ml:
            raise serializers.ValidationError({
                'cantidad_ml': f'La cantidad ({cantidad}ml) excede la capacidad del recipiente ({recipiente.cantidad_ml}ml).'
            })

        return attrs

    def create(self, validated_data):
        """
        Crea un nuevo consumo y actualiza la meta diaria.
        """
        # Asignar el usuario autenticado
        validated_data['usuario'] = self.context['request'].user
        
        # Crear el consumo
        consumo = super().create(validated_data)
        
        # Actualizar la meta diaria
        self._actualizar_meta_diaria(consumo)
        
        return consumo

    def update(self, instance, validated_data):
        """
        Actualiza un consumo y recalcula la meta diaria.
        """
        # Actualizar el consumo
        consumo = super().update(instance, validated_data)
        
        # Actualizar la meta diaria
        self._actualizar_meta_diaria(consumo)
        
        return consumo

    def _actualizar_meta_diaria(self, consumo):
        """
        Actualiza la meta diaria del usuario.
        """
        try:
            meta_diaria = MetaDiaria.objects.get(
                usuario=consumo.usuario,
                fecha=consumo.fecha_hora.date()
            )
            meta_diaria.actualizar_consumo()
        except MetaDiaria.DoesNotExist:
            # Crear nueva meta diaria si no existe
            MetaDiaria.objects.create(
                usuario=consumo.usuario,
                fecha=consumo.fecha_hora.date(),
                meta_ml=consumo.usuario.meta_diaria_ml
            ).actualizar_consumo()


class ConsumoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para crear consumos.
    """
    bebida_nombre = serializers.CharField(source='bebida.nombre', read_only=True)
    recipiente_nombre = serializers.CharField(
        source='recipiente.nombre', read_only=True
    )

    class Meta:
        model = Consumo
        fields = [
            'id', 'bebida', 'bebida_nombre', 'recipiente', 'recipiente_nombre',
            'cantidad_ml', 'cantidad_hidratacion_efectiva', 'fecha_hora',
            'notas', 'ubicacion', 'temperatura_ambiente', 'nivel_sed',
            'estado_animo', 'fecha_creacion'
        ]
        read_only_fields = [
            'id', 'cantidad_hidratacion_efectiva', 'fecha_creacion'
        ]

    def validate_bebida(self, value):
        """Valida que la bebida esté activa."""
        if not value.activa:
            raise serializers.ValidationError(
                'Esta bebida no está disponible.'
            )
        return value

    def validate_recipiente(self, value):
        """Valida que el recipiente pertenezca al usuario."""
        if value and value.usuario != self.context['request'].user:
            raise serializers.ValidationError(
                'No tienes permisos para usar este recipiente.'
            )
        return value

    def validate_cantidad_ml(self, value):
        """Valida la cantidad."""
        if value < 1 or value > 5000:
            raise serializers.ValidationError(
                'La cantidad debe estar entre 1 y 5000ml.'
            )
        return value

    def validate_fecha_hora(self, value):
        """Valida que la fecha no sea futura."""
        if value > timezone.now():
            raise serializers.ValidationError(
                'No puedes registrar consumos futuros.'
            )
        return value

    def create(self, validated_data):
        """Crea el consumo y actualiza la meta diaria."""
        validated_data['usuario'] = self.context['request'].user
        consumo = super().create(validated_data)
        
        # Actualizar meta diaria
        try:
            meta_diaria = MetaDiaria.objects.get(
                usuario=consumo.usuario,
                fecha=consumo.fecha_hora.date()
            )
            meta_diaria.actualizar_consumo()
        except MetaDiaria.DoesNotExist:
            MetaDiaria.objects.create(
                usuario=consumo.usuario,
                fecha=consumo.fecha_hora.date(),
                meta_ml=consumo.usuario.meta_diaria_ml
            ).actualizar_consumo()
        
        return consumo


class MetaDiariaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo MetaDiaria.
    """
    usuario = serializers.StringRelatedField(read_only=True)
    progreso_porcentaje = serializers.SerializerMethodField()
    hidratacion_efectiva_porcentaje = serializers.SerializerMethodField()

    class Meta:
        model = MetaDiaria
        fields = [
            'id', 'usuario', 'fecha', 'meta_ml', 'consumido_ml',
            'hidratacion_efectiva_ml', 'completada', 'progreso_porcentaje',
            'hidratacion_efectiva_porcentaje', 'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = [
            'id', 'usuario', 'consumido_ml', 'hidratacion_efectiva_ml',
            'completada', 'fecha_creacion', 'fecha_actualizacion'
        ]

    def get_progreso_porcentaje(self, obj):
        """Retorna el porcentaje de progreso."""
        return obj.get_progreso_porcentaje()

    def get_hidratacion_efectiva_porcentaje(self, obj):
        """Retorna el porcentaje de hidratación efectiva."""
        return obj.get_hidratacion_efectiva_porcentaje()


class ConsumoStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de consumos.
    """
    fecha = serializers.DateField()
    total_consumido_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    meta_ml = serializers.IntegerField()
    progreso_porcentaje = serializers.FloatField()
    completada = serializers.BooleanField()
    consumos_count = serializers.IntegerField()
    bebidas_mas_consumidas = serializers.ListField(
        child=serializers.DictField()
    )
    recipientes_mas_usados = serializers.ListField(
        child=serializers.DictField()
    )


class RecordatorioSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Recordatorio.
    """
    usuario = serializers.StringRelatedField(read_only=True)
    dias_semana_display = serializers.CharField(source='get_dias_semana_display', read_only=True)
    mensaje_completo = serializers.CharField(source='get_mensaje_completo', read_only=True)
    proximo_envio = serializers.SerializerMethodField()

    class Meta:
        model = Recordatorio
        fields = [
            'id', 'usuario', 'hora', 'mensaje', 'mensaje_completo',
            'activo', 'dias_semana', 'dias_semana_display', 'tipo_recordatorio',
            'frecuencia', 'sonido', 'vibracion', 'fecha_creacion',
            'fecha_actualizacion', 'ultimo_enviado', 'proximo_envio'
        ]
        read_only_fields = [
            'id', 'usuario', 'fecha_creacion', 'fecha_actualizacion',
            'ultimo_enviado', 'proximo_envio'
        ]

    def get_proximo_envio(self, obj):
        """
        Retorna el próximo envío del recordatorio.
        """
        proximo = obj.get_proximo_envio()
        return proximo.isoformat() if proximo else None

    def validate_hora(self, value):
        """
        Valida que la hora sea válida.
        """
        if not value:
            raise serializers.ValidationError('La hora es requerida.')
        return value

    def validate_dias_semana(self, value):
        """
        Valida que los días de la semana sean válidos.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError('Los días deben ser una lista.')
        
        dias_validos = list(range(7))  # 0-6
        for dia in value:
            if not isinstance(dia, int) or dia not in dias_validos:
                raise serializers.ValidationError(
                    f'Día inválido: {dia}. Debe ser un número entre 0 y 6.'
                )
        
        return value

    def validate(self, attrs):
        """
        Validaciones adicionales del serializer.
        """
        # Validar que no haya duplicados de hora y tipo para el mismo usuario
        if self.instance:
            # Para actualización
            usuario = self.instance.usuario
            hora = attrs.get('hora', self.instance.hora)
            tipo = attrs.get('tipo_recordatorio', self.instance.tipo_recordatorio)
            
            if Recordatorio.objects.filter(
                usuario=usuario, hora=hora, tipo_recordatorio=tipo
            ).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError({
                    'hora': 'Ya tienes un recordatorio a esta hora con el mismo tipo.'
                })
        else:
            # Para creación
            usuario = self.context['request'].user
            hora = attrs.get('hora')
            tipo = attrs.get('tipo_recordatorio', 'agua')
            
            if Recordatorio.objects.filter(
                usuario=usuario, hora=hora, tipo_recordatorio=tipo
            ).exists():
                raise serializers.ValidationError({
                    'hora': 'Ya tienes un recordatorio a esta hora con el mismo tipo.'
                })

        return attrs

    def create(self, validated_data):
        """
        Crea un nuevo recordatorio asignando el usuario autenticado.
        """
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class RecordatorioCreateSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para crear recordatorios.
    """
    class Meta:
        model = Recordatorio
        fields = [
            'hora', 'mensaje', 'tipo_recordatorio', 'frecuencia',
            'dias_semana', 'sonido', 'vibracion'
        ]

    def validate_hora(self, value):
        """Valida la hora."""
        if not value:
            raise serializers.ValidationError('La hora es requerida.')
        return value

    def validate_dias_semana(self, value):
        """Valida los días de la semana."""
        if not isinstance(value, list):
            raise serializers.ValidationError('Los días deben ser una lista.')
        
        dias_validos = list(range(7))
        for dia in value:
            if not isinstance(dia, int) or dia not in dias_validos:
                raise serializers.ValidationError(
                    f'Día inválido: {dia}. Debe ser un número entre 0 y 6.'
                )
        
        return value

    def create(self, validated_data):
        """Crea el recordatorio asignando el usuario."""
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class MetaFijaSerializer(serializers.Serializer):
    """
    Serializer para la meta fija de hidratación.
    """
    meta_ml = serializers.IntegerField()
    tipo_meta = serializers.CharField()
    descripcion = serializers.CharField()
    es_personalizable = serializers.BooleanField()
    fecha_actualizacion = serializers.DateTimeField()


class RecordatorioStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de recordatorios.
    """
    total_recordatorios = serializers.IntegerField()
    recordatorios_activos = serializers.IntegerField()
    recordatorios_inactivos = serializers.IntegerField()
    proximos_recordatorios = serializers.ListField(
        child=serializers.DictField()
    )
    recordatorios_por_tipo = serializers.DictField()
    recordatorios_por_frecuencia = serializers.DictField()


class SubscriptionStatusSerializer(serializers.Serializer):
    """
    Serializer para el estado de suscripción del usuario.
    """
    is_premium = serializers.BooleanField()
    subscription_type = serializers.CharField()
    subscription_end_date = serializers.DateTimeField(allow_null=True)
    days_remaining = serializers.IntegerField(allow_null=True)
    features_available = serializers.ListField(
        child=serializers.CharField()
    )
    limitations = serializers.DictField()
    upgrade_required = serializers.BooleanField()


class PremiumFeatureSerializer(serializers.Serializer):
    """
    Serializer para una funcionalidad premium.
    """
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    icon = serializers.CharField()
    category = serializers.CharField()
    is_available = serializers.BooleanField()


class PremiumFeaturesSerializer(serializers.Serializer):
    """
    Serializer para la lista de funcionalidades premium.
    """
    features = serializers.ListField(
        child=PremiumFeatureSerializer()
    )
    total_features = serializers.IntegerField()
    categories = serializers.ListField(
        child=serializers.CharField()
    )


class UsageLimitsSerializer(serializers.Serializer):
    """
    Serializer para los límites de uso del usuario.
    """
    recordatorios = serializers.DictField()
    consumos_diarios = serializers.DictField()
    estadisticas_avanzadas = serializers.DictField()
    exportacion_datos = serializers.DictField()
    personalizacion = serializers.DictField()


class MonetizationStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de monetización.
    """
    usuarios_totales = serializers.IntegerField()
    usuarios_premium = serializers.IntegerField()
    usuarios_gratuitos = serializers.IntegerField()
    conversion_rate = serializers.FloatField()
    ingresos_mensuales = serializers.DecimalField(max_digits=10, decimal_places=2)
    funcionalidades_mas_usadas = serializers.ListField(
        child=serializers.DictField()
    )


class PremiumGoalSerializer(serializers.Serializer):
    """
    Serializer para la meta personalizada premium.
    """
    meta_recomendada_ml = serializers.IntegerField()
    meta_actual_ml = serializers.IntegerField()
    diferencia_ml = serializers.IntegerField()
    factor_actividad = serializers.FloatField()
    peso_usuario = serializers.FloatField()
    nivel_actividad = serializers.CharField()
    formula_usada = serializers.CharField()
    recomendaciones = serializers.ListField(
        child=serializers.CharField()
    )
    fecha_calculo = serializers.DateTimeField()


class PremiumBeverageSerializer(serializers.ModelSerializer):
    """
    Serializer para bebidas premium.
    """
    categoria = serializers.SerializerMethodField()
    es_disponible = serializers.SerializerMethodField()
    
    class Meta:
        model = Bebida
        fields = [
            'id', 'nombre', 'factor_hidratacion', 'es_agua', 
            'calorias_por_ml', 'activa', 'es_premium', 'categoria', 
            'es_disponible', 'fecha_creacion'
        ]
    
    def get_categoria(self, obj):
        """
        Determina la categoría de la bebida.
        """
        if obj.es_agua:
            return 'Agua'
        elif obj.factor_hidratacion >= 0.8:
            return 'Hidratante'
        elif obj.factor_hidratacion >= 0.5:
            return 'Moderada'
        else:
            return 'Deshidratante'
    
    def get_es_disponible(self, obj):
        """
        Determina si la bebida está disponible para el usuario.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return not obj.es_premium
        
        # Si es premium, solo disponible para usuarios premium
        if obj.es_premium:
            return hasattr(request.user, 'es_premium') and request.user.es_premium
        
        return True


class PremiumReminderSerializer(serializers.ModelSerializer):
    """
    Serializer para recordatorios premium (sin límites).
    """
    usuario = serializers.StringRelatedField(read_only=True)
    dias_semana_display = serializers.CharField(source='get_dias_semana_display', read_only=True)
    mensaje_completo = serializers.CharField(source='get_mensaje_completo', read_only=True)
    proximo_envio = serializers.SerializerMethodField()
    es_premium = serializers.SerializerMethodField()
    
    class Meta:
        model = Recordatorio
        fields = [
            'id', 'usuario', 'hora', 'mensaje', 'mensaje_completo',
            'activo', 'dias_semana', 'dias_semana_display', 'tipo_recordatorio',
            'frecuencia', 'sonido', 'vibracion', 'fecha_creacion',
            'fecha_actualizacion', 'ultimo_enviado', 'proximo_envio', 'es_premium'
        ]
        read_only_fields = [
            'id', 'usuario', 'fecha_creacion', 'fecha_actualizacion',
            'ultimo_enviado', 'proximo_envio', 'es_premium'
        ]
    
    def get_proximo_envio(self, obj):
        """
        Retorna el próximo envío del recordatorio.
        """
        proximo = obj.get_proximo_envio()
        return proximo.isoformat() if proximo else None
    
    def get_es_premium(self, obj):
        """
        Indica que este recordatorio es de un usuario premium.
        """
        return True
    
    def validate_hora(self, value):
        """
        Valida que la hora sea válida.
        """
        if not value:
            raise serializers.ValidationError('La hora es requerida.')
        return value
    
    def validate_dias_semana(self, value):
        """
        Valida que los días de la semana sean válidos.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError('Los días deben ser una lista.')
        
        dias_validos = list(range(7))  # 0-6
        for dia in value:
            if not isinstance(dia, int) or dia not in dias_validos:
                raise serializers.ValidationError(
                    f'Día inválido: {dia}. Debe ser un número entre 0 y 6.'
                )
        
        return value
    
    def validate(self, attrs):
        """
        Validaciones adicionales del serializer.
        """
        # Para usuarios premium, no hay límite de recordatorios
        # Solo validamos que no haya duplicados de hora y tipo
        if self.instance:
            # Para actualización
            usuario = self.instance.usuario
            hora = attrs.get('hora', self.instance.hora)
            tipo = attrs.get('tipo_recordatorio', self.instance.tipo_recordatorio)
            
            if Recordatorio.objects.filter(
                usuario=usuario, hora=hora, tipo_recordatorio=tipo
            ).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError({
                    'hora': 'Ya tienes un recordatorio a esta hora con el mismo tipo.'
                })
        else:
            # Para creación
            usuario = self.context['request'].user
            hora = attrs.get('hora')
            tipo = attrs.get('tipo_recordatorio', 'agua')
            
            if Recordatorio.objects.filter(
                usuario=usuario, hora=hora, tipo_recordatorio=tipo
            ).exists():
                raise serializers.ValidationError({
                    'hora': 'Ya tienes un recordatorio a esta hora con el mismo tipo.'
                })

        return attrs
    
    def create(self, validated_data):
        """
        Crea un nuevo recordatorio asignando el usuario autenticado.
        """
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class PremiumReminderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para crear recordatorios premium.
    """
    class Meta:
        model = Recordatorio
        fields = [
            'hora', 'mensaje', 'tipo_recordatorio', 'frecuencia',
            'dias_semana', 'sonido', 'vibracion'
        ]
    
    def validate_hora(self, value):
        """Valida la hora."""
        if not value:
            raise serializers.ValidationError('La hora es requerida.')
        return value
    
    def validate_dias_semana(self, value):
        """Valida los días de la semana."""
        if not isinstance(value, list):
            raise serializers.ValidationError('Los días deben ser una lista.')
        
        dias_validos = list(range(7))
        for dia in value:
            if not isinstance(dia, int) or dia not in dias_validos:
                raise serializers.ValidationError(
                    f'Día inválido: {dia}. Debe ser un número entre 0 y 6.'
                )
        
        return value
    
    def create(self, validated_data):
        """Crea el recordatorio asignando el usuario."""
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class BebidaInfoSerializer(serializers.ModelSerializer):
    """
    Serializer para incluir información básica de la bebida en el historial.
    """
    class Meta:
        model = Bebida
        fields = ['id', 'nombre', 'factor_hidratacion', 'es_agua', 'es_premium']


class ConsumoHistorySerializer(serializers.ModelSerializer):
    """
    Serializer para el historial detallado de consumos.
    """
    bebida = BebidaInfoSerializer(read_only=True)
    recipiente_nombre = serializers.CharField(source='recipiente.nombre', read_only=True)
    hidratacion_efectiva_ml = serializers.SerializerMethodField()
    fecha_formateada = serializers.SerializerMethodField()
    hora_formateada = serializers.SerializerMethodField()
    
    class Meta:
        model = Consumo
        fields = [
            'id', 'cantidad_ml', 'bebida', 'recipiente_nombre',
            'hidratacion_efectiva_ml', 'fecha_hora', 'fecha_formateada',
            'hora_formateada', 'nivel_sed', 'estado_animo', 'notas',
            'ubicacion', 'fecha_creacion'
        ]
    
    def get_hidratacion_efectiva_ml(self, obj):
        """Retorna la hidratación efectiva en ml."""
        return obj.cantidad_hidratacion_efectiva
    
    def get_fecha_formateada(self, obj):
        """Retorna la fecha formateada."""
        return obj.fecha_hora.strftime('%Y-%m-%d')
    
    def get_hora_formateada(self, obj):
        """Retorna la hora formateada."""
        return obj.fecha_hora.strftime('%H:%M')


class ConsumoSummarySerializer(serializers.Serializer):
    """
    Serializer para estadísticas agregadas de consumos.
    """
    periodo = serializers.CharField()
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    promedio_diario_ml = serializers.FloatField()
    bebida_mas_consumida = serializers.CharField()
    factor_hidratacion_promedio = serializers.FloatField()
    progreso_meta = serializers.FloatField()


class ConsumoDailySummarySerializer(serializers.Serializer):
    """
    Serializer para resumen diario de consumos.
    """
    fecha = serializers.DateField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    meta_ml = serializers.IntegerField()
    progreso_porcentaje = serializers.FloatField()
    completada = serializers.BooleanField()
    consumos_por_hora = serializers.ListField(
        child=serializers.DictField()
    )


class ConsumoWeeklySummarySerializer(serializers.Serializer):
    """
    Serializer para resumen semanal de consumos.
    """
    semana_inicio = serializers.DateField()
    semana_fin = serializers.DateField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    promedio_diario_ml = serializers.FloatField()
    dias_completados = serializers.IntegerField()
    dias_totales = serializers.IntegerField()
    eficiencia_hidratacion = serializers.FloatField()
    dias_detalle = serializers.ListField(
        child=serializers.DictField()
    )


class ConsumoMonthlySummarySerializer(serializers.Serializer):
    """
    Serializer para resumen mensual de consumos.
    """
    mes = serializers.CharField()
    año = serializers.IntegerField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    cantidad_consumos = serializers.IntegerField()
    promedio_diario_ml = serializers.FloatField()
    dias_activos = serializers.IntegerField()
    dias_totales = serializers.IntegerField()
    eficiencia_hidratacion = serializers.FloatField()
    tendencia = serializers.CharField()
    semanas_detalle = serializers.ListField(
        child=serializers.DictField()
    )


class ConsumoTrendSerializer(serializers.Serializer):
    """
    Serializer para tendencias de consumo.
    """
    periodo = serializers.CharField()
    tendencia = serializers.CharField()
    cambio_porcentaje = serializers.FloatField()
    cambio_ml = serializers.IntegerField()
    promedio_anterior = serializers.FloatField()
    promedio_actual = serializers.FloatField()
    recomendaciones = serializers.ListField(
        child=serializers.CharField()
    )


class ConsumoInsightsSerializer(serializers.Serializer):
    """
    Serializer para insights y análisis de consumos.
    """
    total_consumos = serializers.IntegerField()
    total_ml = serializers.IntegerField()
    total_hidratacion_efectiva_ml = serializers.IntegerField()
    periodo_analisis = serializers.CharField()
    insights = serializers.ListField(
        child=serializers.DictField()
    )
    patrones = serializers.ListField(
        child=serializers.DictField()
    )
    recomendaciones = serializers.ListField(
        child=serializers.CharField()
    )
    estadisticas_avanzadas = serializers.DictField()
