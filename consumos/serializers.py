from rest_framework import serializers
from django.utils import timezone
from .models import Consumo, Recipiente, Bebida, MetaDiaria


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
