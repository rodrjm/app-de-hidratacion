from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from rest_framework.throttling import ScopedRateThrottle
import json
import base64
import logging
from .models import User, Sugerencia, Feedback
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    ChangePasswordSerializer, UserProfileUpdateSerializer, SugerenciaSerializer,
    FeedbackSerializer
)
from consumos.permissions import IsPremiumUser
from django.db import transaction
from django.core.exceptions import ValidationError
from django.conf import settings
from .utils import crear_recipientes_por_defecto

logger = logging.getLogger(__name__)
# Usar settings.DEBUG directamente en lugar de variable local


class RegisterView(generics.CreateAPIView):
    """
    Vista para el registro de nuevos usuarios.
    
    Permite crear una cuenta con validación completa de datos. Al registrarse,
    el usuario recibe automáticamente:
    - Tokens JWT para autenticación
    - Recipientes por defecto (250ml y 500ml)
    - Código de referido único
    
    Si el usuario proporciona un código de referido válido, se procesa
    automáticamente y se incrementa el contador del referente.
    
    Endpoint: POST /api/register/
    
    Permissions:
        - AllowAny: Cualquiera puede registrarse
        
    Returns:
        - 201 Created: Usuario creado exitosamente
        - 400 Bad Request: Datos inválidos o errores de validación
        - 500 Internal Server Error: Error inesperado del servidor
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo usuario y retorna información básica.
        Operación atómica para asegurar consistencia de datos.
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
            
            logger.info(f'Usuario registrado exitosamente - Email: {user.email}')
            
            return Response({
                'message': 'Usuario registrado exitosamente',
                'user': user_serializer.data,
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            logger.warning(f'Error de validación al crear usuario: {e}')
            return Response({
                'error': 'Error de validación',
                'detail': str(e) if settings.DEBUG else 'Datos inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error inesperado al crear usuario: {e}', exc_info=True)
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f'Traceback completo: {error_traceback}')
            return Response({
                'error': 'Error al crear el usuario',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor',
                'traceback': error_traceback if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        email = request.data.get('email', '')
        ip_address = self._get_client_ip(request)
        
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Log de login exitoso
                user_email = response.data.get('user', {}).get('email', email)
                logger.info(
                    f'Login exitoso - Email: {user_email}, IP: {ip_address}',
                    extra={'event_type': 'login_success', 'email': user_email, 'ip': ip_address}
                )
                # Agregar mensaje de éxito
                response.data['message'] = 'Inicio de sesión exitoso'
                
            return response
            
        except Exception as e:
            # Log de intento de login fallido
            logger.warning(
                f'Intento de login fallido - Email: {email}, IP: {ip_address}, Error: {str(e)}',
                extra={'event_type': 'login_failed', 'email': email, 'ip': ip_address}
            )
            return Response({
                'error': 'Error en el inicio de sesión',
                'detail': 'Credenciales inválidas' if not settings.DEBUG else str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Obtiene la IP del cliente desde el request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


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

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """
        Actualiza el perfil del usuario y recalcula la meta de hidratación si es necesario.
        Operación atómica para asegurar consistencia de datos.
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
                logger.info(f'Perfil actualizado - Usuario: {user.email}')
            
            return response
            
        except ValidationError as e:
            logger.warning(f'Error de validación al actualizar perfil - Usuario: {request.user.email}, Error: {e}')
            return Response({
                'error': 'Error de validación',
                'detail': str(e) if settings.DEBUG else 'Datos inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error inesperado al actualizar perfil - Usuario: {request.user.email}, Error: {e}', exc_info=True)
            return Response({
                'error': 'Error al actualizar el perfil',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChangePasswordView(APIView):
    """
    Vista para cambiar la contraseña del usuario autenticado.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'  # Usar mismo rate limit que login

    def post(self, request):
        """
        Cambia la contraseña del usuario autenticado.
        """
        user = request.user
        ip_address = self._get_client_ip(request)
        
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            try:
                serializer.save()
                # Log de cambio de contraseña exitoso
                logger.info(
                    f'Cambio de contraseña exitoso - Usuario: {user.email}, IP: {ip_address}',
                    extra={
                        'event_type': 'password_change_success',
                        'user_id': user.id,
                        'email': user.email,
                        'ip': ip_address
                    }
                )
                return Response({
                    'message': 'Contraseña cambiada exitosamente'
                }, status=status.HTTP_200_OK)
            except Exception as e:
                # Log de error al cambiar contraseña
                logger.warning(
                    f'Error al cambiar contraseña - Usuario: {user.email}, IP: {ip_address}, Error: {str(e)}',
                    extra={
                        'event_type': 'password_change_failed',
                        'user_id': user.id,
                        'email': user.email,
                        'ip': ip_address
                    }
                )
                return Response({
                    'error': 'Error al cambiar la contraseña',
                    'detail': 'Error al procesar la solicitud' if not settings.DEBUG else str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log de validación fallida
        logger.warning(
            f'Intento de cambio de contraseña con datos inválidos - Usuario: {user.email}, IP: {ip_address}',
            extra={
                'event_type': 'password_change_validation_failed',
                'user_id': user.id,
                'email': user.email,
                'ip': ip_address
            }
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Obtiene la IP del cliente desde el request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


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
        # Validación de entrada
        username = request.data.get('username', '')
        if not username:
            return Response({
                'error': 'Nombre de usuario requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sanitizar entrada
        username = str(username).strip()
        
        # Validar longitud mínima
        if len(username) < 3:
            return Response({
                'available': False,
                'message': 'El nombre de usuario debe tener al menos 3 caracteres'
            }, status=status.HTTP_200_OK)
        
        # Validar caracteres permitidos (solo alfanuméricos, guiones y guiones bajos)
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            return Response({
                'available': False,
                'message': 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'
            }, status=status.HTTP_200_OK)
        
        try:
            is_available = not User.objects.filter(username=username).exists()
            
            return Response({
                'available': is_available,
                'message': 'Nombre de usuario disponible' if is_available else 'Nombre de usuario no disponible'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error al verificar username: {e}', exc_info=True)
            return Response({
                'error': 'Error al verificar disponibilidad',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckEmailView(APIView):
    """
    Vista para verificar la disponibilidad de un correo electrónico.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Verifica si un correo electrónico está disponible.
        """
        # Validación de entrada
        email = request.data.get('email', '')
        if not email:
            return Response({
                'error': 'Correo electrónico requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sanitizar y normalizar email
        email = str(email).strip().lower()
        
        # Validar formato de email básico
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return Response({
                'available': False,
                'message': 'Formato de correo electrónico inválido'
            }, status=status.HTTP_200_OK)
        
        try:
            is_available = not User.objects.filter(email=email).exists()
            
            return Response({
                'available': is_available,
                'message': 'Correo electrónico disponible' if is_available else 'Correo electrónico no disponible'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error al verificar email: {e}', exc_info=True)
            return Response({
                'error': 'Error al verificar disponibilidad',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            logger.info(f'Sugerencia creada - Usuario: {request.user.email}, Tipo: {sugerencia.tipo}')
            return Response({
                'message': 'Sugerencia enviada exitosamente',
                'sugerencia': serializer.data
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            logger.warning(f'Error de validación al crear sugerencia - Usuario: {request.user.email}, Error: {e}')
            return Response({
                'error': 'Error de validación',
                'detail': str(e) if settings.DEBUG else 'Datos inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error inesperado al crear sugerencia - Usuario: {request.user.email}, Error: {e}', exc_info=True)
            return Response({
                'error': 'Error al crear la sugerencia',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            logger.info(f'Feedback creado - Usuario: {request.user.email}, Tipo: {feedback.tipo}')
            return Response({
                'message': 'Feedback enviado exitosamente. ¡Gracias por tu aporte!',
                'feedback': serializer.data
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            logger.warning(f'Error de validación al crear feedback - Usuario: {request.user.email}, Error: {e}')
            return Response({
                'error': 'Error de validación',
                'detail': str(e) if settings.DEBUG else 'Datos inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error inesperado al crear feedback - Usuario: {request.user.email}, Error: {e}', exc_info=True)
            return Response({
                'error': 'Error al crear el feedback',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            
        except ValueError as e:
            logger.warning(f'Error de validación al obtener información de referidos - Usuario: {request.user.email}, Error: {e}')
            return Response({
                'error': 'Error de validación',
                'detail': str(e) if settings.DEBUG else 'Datos inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error inesperado al obtener información de referidos - Usuario: {request.user.email}, Error: {e}', exc_info=True)
            return Response({
                'error': 'Error al obtener información de referidos',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReclamarRecompensaReferidoView(APIView):
    """
    Vista para reclamar una recompensa de referidos (1 mes Premium gratis).
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        """
        Reclama una recompensa de referidos si el usuario tiene 3 referidos verificados disponibles.
        Operación atómica para asegurar consistencia de datos.
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
            
            logger.info(f'Recompensa de referidos reclamada - Usuario: {user.email}, Recompensas: {recompensas_a_reclamar}')
            
            return Response({
                'message': f'¡Recompensa reclamada exitosamente! Se te ha activado {recompensas_a_reclamar} mes(es) Premium gratis.',
                'recompensas_reclamadas': recompensas_a_reclamar,
                'es_premium': user.es_premium,
                'referidos_pendientes': user.obtener_referidos_pendientes()
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            logger.warning(f'Error de validación al reclamar recompensa - Usuario: {request.user.email}, Error: {e}')
            return Response({
                'error': 'Error de validación',
                'detail': str(e) if settings.DEBUG else 'Datos inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error inesperado al reclamar recompensa - Usuario: {request.user.email}, Error: {e}', exc_info=True)
            return Response({
                'error': 'Error al reclamar la recompensa',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleAuthView(APIView):
    """
    Vista para autenticación con Google.
    Crea un nuevo usuario si no existe, o autentica uno existente.
    
    NOTA: Esta implementación acepta credenciales codificadas en base64 desde el frontend.
    Para mayor seguridad en producción, se recomienda implementar validación real del token
    JWT de Google usando la librería google-auth.
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        """
        Autentica con Google. Operación atómica para asegurar consistencia.
        """
        # Validación de entrada
        credential = request.data.get('credential')
        if not credential:
            logger.warning('Intento de autenticación Google sin credencial')
            return Response({
                'error': 'Credencial de Google requerida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar formato básico de la credencial (debe ser string no vacío)
        if not isinstance(credential, str) or len(credential.strip()) == 0:
            logger.warning('Credencial de Google con formato inválido')
            return Response({
                'error': 'Formato de credencial inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:

            # Decodificar la credencial (base64)
            # NOTA: En producción, esto debería validar el token JWT real de Google
            try:
                decoded_credential = base64.b64decode(credential).decode('utf-8')
                credential_data = json.loads(decoded_credential)
            except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as e:
                logger.warning(f'Error decodificando credencial de Google: {e}')
                return Response({
                    'error': 'Credencial inválida'
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f'Error inesperado decodificando credencial: {e}', exc_info=True)
                return Response({
                    'error': 'Error procesando credencial'
                }, status=status.HTTP_400_BAD_REQUEST)

            email = credential_data.get('email')
            first_name = credential_data.get('first_name', '')
            last_name = credential_data.get('last_name', '')
            sub = credential_data.get('sub', '')

            if not email:
                logger.warning('Autenticación Google sin email')
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
                
                # Crear recipientes por defecto usando helper
                crear_recipientes_por_defecto(user)

            # Actualizar último acceso
            user.ultimo_acceso = timezone.now()
            user.save(update_fields=['ultimo_acceso'])

            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Serializar usuario
            user_serializer = UserSerializer(user)

            logger.info(f'Autenticación Google exitosa - Email: {email}, Nuevo usuario: {is_new_user}')
            
            return Response({
                'user': user_serializer.data,
                'access': access_token,
                'refresh': str(refresh),
                'is_new_user': is_new_user
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.warning(f'Error de validación en autenticación Google: {e}')
            return Response({
                'error': 'Datos de autenticación inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Error inesperado en autenticación Google: {e}', exc_info=True)
            return Response({
                'error': 'Error en autenticación con Google',
                'detail': str(e) if settings.DEBUG else 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
