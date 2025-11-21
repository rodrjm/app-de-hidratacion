from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import transaction
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()
from .models import Sugerencia, Feedback


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer para el registro de nuevos usuarios.
    Incluye validación de contraseña y campos específicos de Dosis vital: Tu aplicación de hidratación personal.
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        help_text='Contraseña del usuario (mínimo 8 caracteres)'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        help_text='Confirmación de la contraseña'
    )
    email = serializers.EmailField(
        required=True,
        help_text='Correo electrónico único del usuario'
    )

    codigo_referido = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=20,
        help_text='Código de referido opcional del usuario que invitó'
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'peso', 'fecha_nacimiento',
            'es_fragil_o_insuficiencia_cardiaca', 'genero', 'nivel_actividad', 'meta_diaria_ml',
            'recordar_notificaciones', 'hora_inicio', 'hora_fin',
            'intervalo_notificaciones', 'codigo_referido'
        ]
        extra_kwargs = {
            'username': {
                'help_text': 'Nombre de usuario único (mínimo 3 caracteres)'
            },
            'first_name': {
                'required': True,
                'help_text': 'Nombre del usuario (obligatorio)'
            },
            'last_name': {
                'required': True,
                'help_text': 'Apellido del usuario (obligatorio)'
            },
            'peso': {
                'required': True,
                'help_text': 'Peso en kilogramos (obligatorio)'
            },
            'fecha_nacimiento': {
                'required': True,
                'help_text': 'Fecha de nacimiento (YYYY-MM-DD) (obligatorio)'
            },
            'es_fragil_o_insuficiencia_cardiaca': {
                'required': False,
                'help_text': 'Indica si es persona frágil o con insuficiencia cardíaca (solo para >65 años)'
            },
            'genero': {
                'required': False,
                'help_text': 'Género: M (Masculino), F (Femenino), O (Otro)'
            },
            'nivel_actividad': {
                'required': False,
                'help_text': 'Nivel de actividad física'
            },
            'meta_diaria_ml': {
                'required': False,
                'help_text': 'Meta diaria de hidratación en mililitros'
            },
            'recordar_notificaciones': {
                'required': False,
                'help_text': 'Recibir recordatorios de hidratación'
            },
            'hora_inicio': {
                'required': False,
                'help_text': 'Hora de inicio para recordatorios (HH:MM)'
            },
            'hora_fin': {
                'required': False,
                'help_text': 'Hora de fin para recordatorios (HH:MM)'
            },
            'intervalo_notificaciones': {
                'required': False,
                'help_text': 'Intervalo entre recordatorios en minutos'
            }
        }

    def validate_username(self, value):
        """Valida que el username sea único y tenga al menos 3 caracteres."""
        if len(value) < 3:
            raise serializers.ValidationError(
                'El nombre de usuario debe tener al menos 3 caracteres.'
            )

        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                'Ya existe un usuario con este nombre de usuario.'
            )
        
        return value

    def validate_email(self, value):
        """Valida que el email sea único."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                'Ya existe un usuario con este correo electrónico.'
            )
        return value

    def validate_password(self, value):
        """Valida la contraseña usando los validadores de Django."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, attrs):
        """Valida que las contraseñas coincidan."""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        if password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })

        # Calcular meta de hidratación automáticamente
        if attrs.get('peso') and attrs.get('fecha_nacimiento'):
            # Crear un usuario temporal para calcular la meta
            temp_user = User(
                peso=attrs.get('peso'),
                fecha_nacimiento=attrs.get('fecha_nacimiento'),
                es_fragil_o_insuficiencia_cardiaca=attrs.get('es_fragil_o_insuficiencia_cardiaca', False)
            )
            attrs['meta_diaria_ml'] = temp_user.calcular_meta_hidratacion()

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """
        Crea un nuevo usuario con contraseña hasheada y recipientes por defecto.
        Operación atómica para asegurar consistencia de datos.
        """
        # Remover password_confirm de los datos validados
        validated_data.pop('password_confirm', None)
        
        # Extraer la contraseña y código de referido
        password = validated_data.pop('password')
        codigo_referido_usado = validated_data.pop('codigo_referido', None)
        
        # Crear el usuario
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Generar código de referido único para el nuevo usuario
        user.generar_codigo_referido()
        
        # Si el usuario usó un código de referido, procesarlo
        if codigo_referido_usado:
            try:
                # Buscar el usuario que tiene ese código
                referente = User.objects.get(codigo_referido=codigo_referido_usado)
                # Guardar el código usado
                user.codigo_referido_usado = codigo_referido_usado
                user.save(update_fields=['codigo_referido_usado'])
                # Incrementar contador de referidos verificados del referente
                referente.referidos_verificados += 1
                referente.save(update_fields=['referidos_verificados'])
            except User.DoesNotExist:
                # Código de referido inválido, simplemente ignorarlo
                pass
        
        # Crear recipientes por defecto usando helper
        from .utils import crear_recipientes_por_defecto
        crear_recipientes_por_defecto(user)
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar información del usuario.
    Excluye campos sensibles como la contraseña.
    """
    nombre_completo = serializers.CharField(source='get_nombre_completo', read_only=True)
    edad = serializers.IntegerField(source='edad_calculada', read_only=True)
    meta_calculada = serializers.SerializerMethodField()
    es_activo_hoy = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nombre_completo', 'peso', 'edad', 'fecha_nacimiento',
            'genero', 'nivel_actividad', 'meta_diaria_ml', 'meta_calculada',
            'recordar_notificaciones', 'hora_inicio', 'hora_fin',
            'intervalo_notificaciones', 'es_premium', 'fecha_creacion',
            'fecha_actualizacion', 'ultimo_acceso', 'es_activo_hoy'
        ]
        read_only_fields = [
            'id', 'fecha_creacion', 'fecha_actualizacion',
            'ultimo_acceso', 'es_premium', 'edad'
        ]

    def _get_meta_segura(self, obj):
        """
        Calcula la meta dinámica asegurando que nunca sea cero
        incluso si faltan datos históricos.
        """
        meta = obj.calcular_meta_hidratacion()
        if not meta or meta <= 0:
            meta = obj.meta_diaria_ml or 2000
        return meta

    def get_meta_calculada(self, obj):
        """Retorna la meta de hidratación calculada automáticamente."""
        return self._get_meta_segura(obj)

    def get_es_activo_hoy(self, obj):
        """Indica si el usuario ha tenido actividad hoy."""
        return obj.es_usuario_activo_hoy()
    
    def to_representation(self, instance):
        """
        Asegura que la meta diaria enviada al frontend esté siempre calculada
        con la fórmula más reciente, evitando valores almacenados obsoletos.
        """
        data = super().to_representation(instance)
        meta_segura = self._get_meta_segura(instance)
        data['meta_diaria_ml'] = meta_segura
        data['meta_calculada'] = meta_segura
        return data


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para el login que incluye información adicional del usuario.
    Permite autenticación con email en lugar de username.
    """
    username_field = 'email'  # Cambiar a email para autenticación

    def validate(self, attrs):
        """Valida las credenciales usando email y actualiza el último acceso."""
        # Obtener email y password
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Debe incluir "email" y "password".')
        
        # Buscar usuario por email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('No se encontró un usuario con este correo electrónico.')
        
        # Verificar contraseña
        if not user.check_password(password):
            raise serializers.ValidationError('Contraseña incorrecta.')
        
        if not user.is_active:
            raise serializers.ValidationError('Esta cuenta está desactivada.')
        
        # Asignar usuario para que el método get_token pueda usarlo
        self.user = user
        
        # Actualizar último acceso
        user.ultimo_acceso = timezone.now()
        user.save(update_fields=['ultimo_acceso'])
        
        # Generar tokens
        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        # Agregar información del usuario a la respuesta
        user_serializer = UserSerializer(user)
        data['user'] = user_serializer.data
        
        return data

    @classmethod
    def get_token(cls, user):
        """Genera el token JWT con claims personalizados."""
        token = super().get_token(user)
        
        # Agregar claims personalizados
        token['username'] = user.username
        token['email'] = user.email
        token['es_premium'] = user.es_premium
        
        return token


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer para cambiar la contraseña del usuario.
    """
    old_password = serializers.CharField(
        write_only=True,
        help_text='Contraseña actual del usuario'
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        help_text='Nueva contraseña (mínimo 8 caracteres)'
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        help_text='Confirmación de la nueva contraseña'
    )

    def validate_old_password(self, value):
        """Valida que la contraseña actual sea correcta."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value

    def validate_new_password(self, value):
        """Valida la nueva contraseña."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, attrs):
        """Valida que las nuevas contraseñas coincidan."""
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')

        if new_password != new_password_confirm:
            raise serializers.ValidationError({
                'new_password_confirm': 'Las contraseñas no coinciden.'
            })

        return attrs

    def save(self):
        """Cambia la contraseña del usuario."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar el perfil del usuario.
    Excluye campos que no deben ser modificados directamente.
    """
    meta_calculada = serializers.SerializerMethodField()

    edad = serializers.IntegerField(source='edad_calculada', read_only=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'peso', 'edad', 'fecha_nacimiento',
            'es_fragil_o_insuficiencia_cardiaca', 'genero', 'nivel_actividad', 'meta_diaria_ml', 'meta_calculada',
            'recordar_notificaciones', 'hora_inicio', 'hora_fin',
            'intervalo_notificaciones'
        ]

    def get_meta_calculada(self, obj):
        """Retorna la meta de hidratación calculada automáticamente."""
        meta = obj.calcular_meta_hidratacion()
        if not meta or meta <= 0:
            meta = obj.meta_diaria_ml or 2000
        return meta

    def validate(self, attrs):
        """Valida y recalcula la meta de hidratación si es necesario."""
        # Si se actualizan datos que afectan la meta, recalcular
        if any(field in attrs for field in ['peso', 'fecha_nacimiento', 'es_fragil_o_insuficiencia_cardiaca']):
            peso = attrs.get('peso', self.instance.peso if self.instance else None)
            fecha_nacimiento = attrs.get('fecha_nacimiento', self.instance.fecha_nacimiento if self.instance else None)
            es_fragil = attrs.get('es_fragil_o_insuficiencia_cardiaca', 
                                self.instance.es_fragil_o_insuficiencia_cardiaca if self.instance else False)
            
            if peso and fecha_nacimiento:
                temp_user = User(
                    peso=peso,
                    fecha_nacimiento=fecha_nacimiento,
                    es_fragil_o_insuficiencia_cardiaca=es_fragil
                )
                attrs['meta_diaria_ml'] = temp_user.calcular_meta_hidratacion()

        return attrs


class SugerenciaSerializer(serializers.ModelSerializer):
    """
    Serializer para crear sugerencias de bebidas y actividades.
    Solo disponible para usuarios premium.
    """
    
    class Meta:
        model = Sugerencia
        fields = ['id', 'tipo', 'nombre', 'comentarios', 'intensidad_estimada', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']
    
    def validate_tipo(self, value):
        """Valida que el tipo sea válido."""
        if value not in ['bebida', 'actividad']:
            raise serializers.ValidationError('El tipo debe ser "bebida" o "actividad".')
        return value
    
    def validate_nombre(self, value):
        """Valida que el nombre no esté vacío."""
        if not value or not value.strip():
            raise serializers.ValidationError('El nombre es requerido.')
        if len(value.strip()) < 2:
            raise serializers.ValidationError('El nombre debe tener al menos 2 caracteres.')
        return value.strip()
    
    def validate_intensidad_estimada(self, value):
        """Valida que la intensidad sea válida si se proporciona."""
        if value and value not in ['baja', 'media', 'alta']:
            raise serializers.ValidationError('La intensidad debe ser "baja", "media" o "alta".')
        return value
    
    def validate(self, attrs):
        """Valida y establece valores por defecto."""
        tipo = attrs.get('tipo')
        intensidad = attrs.get('intensidad_estimada')
        
        # Para actividades, si no se proporciona intensidad, usar 'media' por defecto
        if tipo == 'actividad' and not intensidad:
            attrs['intensidad_estimada'] = 'media'
        
        if tipo == 'bebida' and intensidad:
            raise serializers.ValidationError({
                'intensidad_estimada': 'La intensidad estimada solo es válida para actividades.'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Crea una nueva sugerencia asociada al usuario actual."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['usuario'] = request.user
        return super().create(validated_data)


class FeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer para crear feedback general de los usuarios.
    """
    
    class Meta:
        model = Feedback
        fields = ['id', 'tipo', 'mensaje', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']
    
    def validate_tipo(self, value):
        """Valida que el tipo sea válido."""
        if value not in ['idea_sugerencia', 'reporte_error', 'pregunta_general']:
            raise serializers.ValidationError('El tipo de feedback no es válido.')
        return value
    
    def validate_mensaje(self, value):
        """Valida que el mensaje no esté vacío."""
        if not value or not value.strip():
            raise serializers.ValidationError('El mensaje es requerido.')
        if len(value.strip()) < 10:
            raise serializers.ValidationError('El mensaje debe tener al menos 10 caracteres.')
        return value.strip()
    
    def create(self, validated_data):
        """Crea un nuevo feedback asociado al usuario actual."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['usuario'] = request.user
        return super().create(validated_data)
