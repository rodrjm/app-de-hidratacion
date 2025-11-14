from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import User
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    ChangePasswordSerializer, UserProfileUpdateSerializer
)


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
                if any(field in request.data for field in ['peso', 'edad', 'nivel_actividad']):
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
