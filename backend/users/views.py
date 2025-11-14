from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from rest_framework.throttling import ScopedRateThrottle
from .models import User, Sugerencia, Feedback
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    ChangePasswordSerializer, UserProfileUpdateSerializer, SugerenciaSerializer,
    FeedbackSerializer
)
from consumos.permissions import IsPremiumUser


class RegisterView(generics.CreateAPIView):
    """
    Vista para el registro de nuevos usuarios.
    Permite crear una cuenta con validación completa de datos.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo usuario y retorna información básica.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = serializer.save()
            
            # Generar tokens JWT para el usuario recién registrado
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Actualizar último acceso
            user.ultimo_acceso = timezone.now()
            user.save(update_fields=['ultimo_acceso'])
            
            # Preparar respuesta
            user_serializer = UserSerializer(user)
            
            return Response({
                'message': 'Usuario registrado exitosamente',
                'user': user_serializer.data,
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Error al crear el usuario',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para el login que incluye información del usuario.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        """
        Autentica al usuario y retorna tokens JWT con información del usuario.
        """
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Agregar mensaje de éxito
                response.data['message'] = 'Inicio de sesión exitoso'
                
            return response
            
        except Exception as e:
            return Response({
                'error': 'Error en el inicio de sesión',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Vista para cerrar sesión (invalidar token de refresh).
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        """
        Invalida el token de refresh del usuario.
        """
        try:
            refresh_token = request.data.get('refresh_token')
            
            if not refresh_token:
                return Response({
                    'error': 'Token de refresh requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Invalidar el token de refresh
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                'message': 'Sesión cerrada exitosamente'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al cerrar sesión',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Vista para obtener y actualizar el perfil del usuario autenticado.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Retorna el usuario autenticado.
        """
        return self.request.user

    def get_serializer_class(self):
        """
        Retorna el serializer apropiado según el método HTTP.
        """
        if self.request.method == 'PATCH':
            return UserProfileUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        """
        Actualiza el perfil del usuario y recalcula la meta de hidratación si es necesario.
        """
        try:
            response = super().update(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Recalcular meta de hidratación si se actualizaron datos relevantes
                user = self.get_object()
                if any(field in request.data for field in ['peso', 'fecha_nacimiento', 'es_fragil_o_insuficiencia_cardiaca']):
                    user.actualizar_meta_hidratacion()
                    # Actualizar la respuesta con la nueva meta
                    user_serializer = UserSerializer(user)
                    response.data = user_serializer.data
                
                response.data['message'] = 'Perfil actualizado exitosamente'
            
            return response
            
        except Exception as e:
            return Response({
                'error': 'Error al actualizar el perfil',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Vista para cambiar la contraseña del usuario autenticado.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Cambia la contraseña del usuario autenticado.
        """
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            try:
                serializer.save()
                return Response({
                    'message': 'Contraseña cambiada exitosamente'
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'error': 'Error al cambiar la contraseña',
                    'detail': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserStatsView(APIView):
    """
    Vista para obtener estadísticas del usuario.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna estadísticas básicas del usuario.
        """
        try:
            user = request.user
            
            # Calcular días desde el registro
            from datetime import date
            dias_registrado = (date.today() - user.fecha_creacion.date()).days
            
            # Obtener estadísticas de consumos (cuando se implemente)
            # Por ahora, retornar datos básicos
            stats = {
                'usuario': {
                    'username': user.username,
                    'email': user.email,
                    'fecha_registro': user.fecha_creacion,
                    'dias_registrado': dias_registrado,
                    'es_premium': user.es_premium,
                    'ultimo_acceso': user.ultimo_acceso,
                },
                'hidratacion': {
                    'meta_diaria_ml': user.meta_diaria_ml,
                    'meta_calculada_ml': user.calcular_meta_hidratacion(),
                    'nivel_actividad': user.nivel_actividad,
                    'recordar_notificaciones': user.recordar_notificaciones,
                },
                'configuracion': {
                    'hora_inicio': user.hora_inicio,
                    'hora_fin': user.hora_fin,
                    'intervalo_notificaciones': user.intervalo_notificaciones,
                }
            }
            
            return Response(stats, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener estadísticas',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class CheckUsernameView(APIView):
    """
    Vista para verificar la disponibilidad de un nombre de usuario.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Verifica si un nombre de usuario está disponible.
        """
        username = request.data.get('username', '').strip()
        
        if not username:
            return Response({
                'error': 'Nombre de usuario requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(username) < 3:
            return Response({
                'available': False,
                'message': 'El nombre de usuario debe tener al menos 3 caracteres'
            }, status=status.HTTP_200_OK)
        
        is_available = not User.objects.filter(username=username).exists()
        
        return Response({
            'available': is_available,
            'message': 'Nombre de usuario disponible' if is_available else 'Nombre de usuario no disponible'
        }, status=status.HTTP_200_OK)


class CheckEmailView(APIView):
    """
    Vista para verificar la disponibilidad de un correo electrónico.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Verifica si un correo electrónico está disponible.
        """
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                'error': 'Correo electrónico requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        is_available = not User.objects.filter(email=email).exists()
        
        return Response({
            'available': is_available,
            'message': 'Correo electrónico disponible' if is_available else 'Correo electrónico no disponible'
        }, status=status.HTTP_200_OK)


class SugerenciaCreateView(generics.CreateAPIView):
    """
    Vista para crear sugerencias de bebidas y actividades.
    Solo disponible para usuarios premium.
    """
    queryset = Sugerencia.objects.all()
    serializer_class = SugerenciaSerializer
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def create(self, request, *args, **kwargs):
        """
        Crea una nueva sugerencia asociada al usuario premium.
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        try:
            sugerencia = serializer.save()
            return Response({
                'message': 'Sugerencia enviada exitosamente',
                'sugerencia': serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': 'Error al crear la sugerencia',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class FeedbackCreateView(generics.CreateAPIView):
    """
    Vista para crear feedback general de los usuarios.
    Disponible para todos los usuarios autenticados.
    """
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo feedback asociado al usuario autenticado.
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        try:
            feedback = serializer.save()
            return Response({
                'message': 'Feedback enviado exitosamente. ¡Gracias por tu aporte!',
                'feedback': serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': 'Error al crear el feedback',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ReferidosInfoView(APIView):
    """
    Vista para obtener información de referidos del usuario autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna información sobre los referidos del usuario.
        """
        try:
            user = request.user
            
            # Asegurar que el usuario tenga un código de referido
            if not user.codigo_referido:
                user.generar_codigo_referido()
            
            referidos_pendientes = user.obtener_referidos_pendientes()
            tiene_recompensa = user.tiene_recompensa_disponible()
            
            return Response({
                'codigo_referido': user.codigo_referido,
                'referidos_verificados': user.referidos_verificados,
                'referidos_pendientes': referidos_pendientes,
                'recompensas_reclamadas': user.recompensas_reclamadas,
                'tiene_recompensa_disponible': tiene_recompensa,
                'progreso': {
                    'actual': referidos_pendientes,
                    'necesarios': 3,
                    'porcentaje': min((referidos_pendientes / 3) * 100, 100)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener información de referidos',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ReclamarRecompensaReferidoView(APIView):
    """
    Vista para reclamar una recompensa de referidos (1 mes Premium gratis).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Reclama una recompensa de referidos si el usuario tiene 3 referidos verificados disponibles.
        """
        try:
            user = request.user
            
            # Verificar que el usuario tenga una recompensa disponible
            if not user.tiene_recompensa_disponible():
                return Response({
                    'error': 'No tienes una recompensa disponible. Necesitas 3 referidos verificados.',
                    'referidos_pendientes': user.obtener_referidos_pendientes()
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calcular cuántas recompensas puede reclamar
            referidos_pendientes = user.obtener_referidos_pendientes()
            recompensas_a_reclamar = referidos_pendientes // 3
            
            if recompensas_a_reclamar == 0:
                return Response({
                    'error': 'No tienes recompensas disponibles para reclamar'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Incrementar contador de recompensas reclamadas
            user.recompensas_reclamadas += recompensas_a_reclamar
            user.save(update_fields=['recompensas_reclamadas'])
            
            # Activar Premium por 1 mes (30 días)
            from datetime import timedelta
            from django.utils import timezone
            
            if user.es_premium and hasattr(user, 'subscription_end_date') and user.subscription_end_date:
                # Si ya es premium, extender la suscripción
                nueva_fecha = max(user.subscription_end_date, timezone.now().date()) + timedelta(days=30 * recompensas_a_reclamar)
            else:
                # Si no es premium, activar por 30 días
                nueva_fecha = timezone.now().date() + timedelta(days=30 * recompensas_a_reclamar)
                user.es_premium = True
            
            # Guardar fecha de fin de suscripción si el modelo lo soporta
            # Por ahora, solo actualizamos es_premium
            user.save(update_fields=['es_premium'])
            
            return Response({
                'message': f'¡Recompensa reclamada exitosamente! Se te ha activado {recompensas_a_reclamar} mes(es) Premium gratis.',
                'recompensas_reclamadas': recompensas_a_reclamar,
                'es_premium': user.es_premium,
                'referidos_pendientes': user.obtener_referidos_pendientes()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al reclamar la recompensa',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class GoogleAuthView(APIView):
    """
    Vista para autenticación con Google.
    Crea un nuevo usuario si no existe, o autentica uno existente.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            credential = request.data.get('credential')
            if not credential:
                return Response({
                    'error': 'Credencial de Google requerida'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Decodificar la credencial (base64)
            try:
                credential_data = json.loads(base64.b64decode(credential).decode('utf-8'))
            except Exception:
                return Response({
                    'error': 'Credencial inválida'
                }, status=status.HTTP_400_BAD_REQUEST)

            email = credential_data.get('email')
            first_name = credential_data.get('first_name', '')
            last_name = credential_data.get('last_name', '')
            sub = credential_data.get('sub', '')

            if not email:
                return Response({
                    'error': 'Email no proporcionado por Google'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Buscar si el usuario ya existe
            is_new_user = False
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Crear nuevo usuario
                is_new_user = True
                
                # Generar username único
                import re
                username_base = re.sub(r'[^a-z0-9]', '', email.split('@')[0].lower())
                timestamp = int(timezone.now().timestamp() * 1000)
                username = f"{username_base}_{timestamp}"
                
                # Crear usuario sin contraseña (autenticación solo con Google)
                # Nota: peso y fecha_nacimiento se establecerán en onboarding
                # Usamos valores temporales para cumplir con los campos requeridos
                from datetime import date, timedelta
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    password=User.objects.make_random_password(),  # Contraseña aleatoria (no se usará)
                    peso=70.0,  # Valor temporal, se actualizará en onboarding
                    fecha_nacimiento=date.today() - timedelta(days=365*25)  # Valor temporal, se actualizará en onboarding
                )
                
                # Generar código de referido
                user.generar_codigo_referido()
                
                # Crear recipientes por defecto
                from consumos.models import Recipiente
                Recipiente.objects.create(
                    usuario=user,
                    nombre='Taza/Vaso',
                    cantidad_ml=250,
                    color='#3B82F6',
                    icono='cup',
                    es_favorito=True
                )
                Recipiente.objects.create(
                    usuario=user,
                    nombre='Botella/Termo pequeño',
                    cantidad_ml=500,
                    color='#10B981',
                    icono='bottle',
                    es_favorito=True
                )

            # Actualizar último acceso
            user.ultimo_acceso = timezone.now()
            user.save(update_fields=['ultimo_acceso'])

            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Serializar usuario
            user_serializer = UserSerializer(user)

            return Response({
                'user': user_serializer.data,
                'access': access_token,
                'refresh': str(refresh),
                'is_new_user': is_new_user
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Error en autenticación con Google',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
