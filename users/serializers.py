from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer para el registro de nuevos usuarios.
    Incluye validación de contraseña y campos específicos de HydroTracker.
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

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'peso', 'edad', 'fecha_nacimiento',
            'genero', 'nivel_actividad', 'meta_diaria_ml',
            'recordar_notificaciones', 'hora_inicio', 'hora_fin',
            'intervalo_notificaciones'
        ]
        extra_kwargs = {
            'username': {
                'help_text': 'Nombre de usuario único (mínimo 3 caracteres)'
            },
            'first_name': {
                'required': False,
                'help_text': 'Nombre del usuario'
            },
            'last_name': {
                'required': False,
                'help_text': 'Apellido del usuario'
            },
            'peso': {
                'required': False,
                'help_text': 'Peso en kilogramos (20-300 kg)'
            },
            'edad': {
                'required': False,
                'help_text': 'Edad en años (1-120 años)'
            },
            'fecha_nacimiento': {
                'required': False,
                'help_text': 'Fecha de nacimiento (YYYY-MM-DD)'
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

        # Calcular meta de hidratación si se proporcionan datos suficientes
        if attrs.get('peso') and not attrs.get('meta_diaria_ml'):
            # Crear un usuario temporal para calcular la meta
            temp_user = User(
                peso=attrs.get('peso'),
                edad=attrs.get('edad'),
                nivel_actividad=attrs.get('nivel_actividad', 'moderado')
            )
            attrs['meta_diaria_ml'] = temp_user.calcular_meta_hidratacion()

        return attrs

    def create(self, validated_data):
        """Crea un nuevo usuario con contraseña hasheada."""
        # Remover password_confirm de los datos validados
        validated_data.pop('password_confirm', None)
        
        # Extraer la contraseña
        password = validated_data.pop('password')
        
        # Crear el usuario
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar información del usuario.
    Excluye campos sensibles como la contraseña.
    """
    nombre_completo = serializers.CharField(source='get_nombre_completo', read_only=True)
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
            'ultimo_acceso', 'es_premium'
        ]

    def get_meta_calculada(self, obj):
        """Retorna la meta de hidratación calculada automáticamente."""
        return obj.calcular_meta_hidratacion()

    def get_es_activo_hoy(self, obj):
        """Indica si el usuario ha tenido actividad hoy."""
        return obj.es_usuario_activo_hoy()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para el login que incluye información adicional del usuario.
    """
    username_field = 'username'

    def validate(self, attrs):
        """Valida las credenciales y actualiza el último acceso."""
        data = super().validate(attrs)
        
        # Actualizar último acceso
        self.user.ultimo_acceso = self.user.fecha_actualizacion
        self.user.save(update_fields=['ultimo_acceso'])
        
        # Agregar información del usuario a la respuesta
        user_serializer = UserSerializer(self.user)
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

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'peso', 'edad', 'fecha_nacimiento',
            'genero', 'nivel_actividad', 'meta_diaria_ml', 'meta_calculada',
            'recordar_notificaciones', 'hora_inicio', 'hora_fin',
            'intervalo_notificaciones'
        ]

    def get_meta_calculada(self, obj):
        """Retorna la meta de hidratación calculada automáticamente."""
        return obj.calcular_meta_hidratacion()

    def validate(self, attrs):
        """Valida y recalcula la meta de hidratación si es necesario."""
        # Si se actualizan datos que afectan la meta, recalcular
        if any(field in attrs for field in ['peso', 'edad', 'nivel_actividad']):
            peso = attrs.get('peso', self.instance.peso if self.instance else None)
            edad = attrs.get('edad', self.instance.edad if self.instance else None)
            nivel_actividad = attrs.get('nivel_actividad', 
                                     self.instance.nivel_actividad if self.instance else 'moderado')
            
            if peso:
                temp_user = User(
                    peso=peso,
                    edad=edad,
                    nivel_actividad=nivel_actividad
                )
                attrs['meta_diaria_ml'] = temp_user.calcular_meta_hidratacion()

        return attrs
