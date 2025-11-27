import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import ErrorAlert from '@/components/ui/ErrorAlert';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { LoginForm } from '@/types';
import BrandLogo from '@/components/common/BrandLogo';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            callback: (response: { access_token: string }) => void;
            scope?: string;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, isLoading, error, clearError, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  // Limpiar errores al montar el componente (evitar mostrar errores de sesiones anteriores)
  useEffect(() => {
    clearError();
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();

  // Cargar Google Identity Services
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const onSubmit = async (data: LoginForm) => {
    try {
      clearError();
      await login(data.email, data.password, data.rememberMe || false);
      toast.success('¡Bienvenido de vuelta! 🎉');
      navigate('/dashboard');
    } catch (error) {
      // El error ya viene con el mensaje específico del servicio
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    if (!window.google) {
      toast.error('Google Auth no está disponible. Intenta más tarde.');
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    if (!clientId) {
      toast.error('Google Client ID no configurado. Por favor, contacta al administrador.');
      console.error('VITE_GOOGLE_CLIENT_ID no está configurado');
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        callback: async (response) => {
          // Solo bloquear cuando realmente se está procesando la respuesta
          setIsGoogleLoading(true);
          try {
            // Obtener información del usuario usando el token
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${response.access_token}`
              }
            });
            
            if (!userInfoResponse.ok) {
              throw new Error('Error al obtener información del usuario de Google');
            }
            
            const userInfo = await userInfoResponse.json();

            // Enviar credencial a nuestro backend
            const credential = btoa(JSON.stringify({
              email: userInfo.email,
              first_name: userInfo.given_name || '',
              last_name: userInfo.family_name || '',
              picture: userInfo.picture,
              sub: userInfo.id
            }));

            const result = await loginWithGoogle(credential);
            
            if (result.is_new_user) {
              // Usuario nuevo, redirigir a onboarding
              navigate('/onboarding');
            } else {
              // Usuario existente, ir al dashboard
              toast.success('¡Bienvenido de vuelta! 🎉');
              navigate('/dashboard');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al autenticar con Google';
            toast.error(errorMessage);
            console.error('Error en autenticación con Google:', error);
            setIsGoogleLoading(false);
          }
        },
        scope: 'email profile',
        error_callback: (error) => {
          console.error('Error de Google OAuth:', error);
          setIsGoogleLoading(false);
          
          if (error.type === 'popup_closed') {
            toast.error('Ventana de autenticación cerrada');
          } else if (error.type === 'popup_blocked') {
            toast.error('El popup fue bloqueado. Por favor, permite popups para este sitio.');
          } else if (error.message?.includes('redirect_uri_mismatch')) {
            toast.error('Error de configuración de Google OAuth. Por favor, contacta al administrador.');
          } else {
            toast.error(`Error de autenticación: ${error.message || 'Error desconocido'}`);
          }
        }
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Error al iniciar autenticación con Google:', error);
      toast.error('Error al iniciar autenticación con Google');
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center flex flex-col items-center">
          <BrandLogo size={109} className="mb-6" withText />
          <p className="mt-2 text-sm text-neutral-600">
            Tu asistente de hidratación personal
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@email.com"
                {...register('email', {
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                error={errors.email?.message}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            <div>
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
                })}
                error={errors.password?.message}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </div>

            {error && (
              <ErrorAlert 
                error={error}
                className="mb-4"
              />
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-neutral-300 rounded"
                />
                <span className="ml-2 text-sm text-neutral-600">
                  Recordarme
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-accent-600 hover:text-accent-500"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="w-full bg-accent-500 hover:bg-accent-600 text-white font-display font-bold"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">
                  O continúa con
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleAuthButton 
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">
                    ¿No tienes cuenta?
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-medium text-sm font-display font-bold text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-colors duration-200"
              >
                Crear cuenta nueva
              </Link>
            </div>
          </div>
        </Card>

        {/* Features */}
        <div className="text-center">
          <p className="text-sm text-neutral-600 mb-4">
            Únete a miles de usuarios que ya están mejorando su hidratación
          </p>
          <div className="flex justify-center space-x-6 text-xs text-neutral-500">
            <span>💧 Seguimiento inteligente</span>
            <span>📊 Estadísticas detalladas</span>
            <span>🔔 Recordatorios personalizados</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
