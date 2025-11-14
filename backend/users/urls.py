from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, LogoutView,
    UserProfileView, ChangePasswordView, UserStatsView,
    CheckUsernameView, CheckEmailView, SugerenciaCreateView, FeedbackCreateView,
    ReferidosInfoView, ReclamarRecompensaReferidoView, GoogleAuthView
)

app_name = 'users'

urlpatterns = [
    # Autenticación
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google-auth/', GoogleAuthView.as_view(), name='google_auth'),
    
    # Perfil de usuario
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('stats/', UserStatsView.as_view(), name='stats'),
    
    # Validaciones
    path('check-username/', CheckUsernameView.as_view(), name='check_username'),
    path('check-email/', CheckEmailView.as_view(), name='check_email'),
    
    # Sugerencias (solo premium)
    path('sugerencias/', SugerenciaCreateView.as_view(), name='sugerencias_create'),
    
    # Feedback (todos los usuarios autenticados)
    path('feedback/', FeedbackCreateView.as_view(), name='feedback_create'),
    
    # Referidos
    path('referidos/info/', ReferidosInfoView.as_view(), name='referidos_info'),
    path('referidos/reclamar/', ReclamarRecompensaReferidoView.as_view(), name='referidos_reclamar'),
]
