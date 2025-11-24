import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { RegisterForm } from '@/types';
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

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  const { register: registerUser, isLoading, error, clearError, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  // Obtener código de referido de la URL
  const codigoReferidoFromUrl = searchParams.get('ref') || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterForm>({
    defaultValues: {
      peso_unidad: 'kg',
      codigo_referido: codigoReferidoFromUrl
    }
  });

  // Cargar Google Identity Services
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Actualizar código de referido si viene en la URL
  useEffect(() => {
    if (codigoReferidoFromUrl) {
      setValue('codigo_referido', codigoReferidoFromUrl);
    }
  }, [codigoReferidoFromUrl, setValue]);

  const password = watch('password');
  const fechaNacimiento = watch('fecha_nacimiento');
  const pesoUnidad = watch('peso_unidad');

  // Calcular edad para mostrar campo de fragilidad si es necesario
  const calcularEdad = (fecha: string): number | null => {
    if (!fecha) return null;
    const fechaNac = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  };

  const edadCalculada = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const mostrarCampoFragilidad = edadCalculada !== null && edadCalculada > 65;

  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError();
      await registerUser(data);
      toast.success('¡Cuenta creada exitosamente! 🎉');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al crear la cuenta');
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

  const checkEmail = async (email: string) => {
    if (!email.includes('@')) return;
    
    setIsCheckingEmail(true);
    try {
      // Simular verificación de email
      await new Promise(resolve => setTimeout(resolve, 500));
      setEmailAvailable(!email.includes('test@'));
    } catch (error) {
      setEmailAvailable(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Validación de peso según unidad
  const validarPeso = (value: number) => {
    if (!value) return 'El peso es requerido';
    if (pesoUnidad === 'kg') {
      if (value < 1) return 'El peso debe ser mayor a 1 kg';
      if (value > 500) return 'El peso debe ser menor a 500 kg';
    } else {
      // lb
      if (value < 2.2) return 'El peso debe ser mayor a 2.2 lb';
      if (value > 1100) return 'El peso debe ser menor a 1100 lb';
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center flex flex-col items-center">
          <BrandLogo size={109} className="mb-6" withText />
          <h2 className="text-2xl font-display font-bold text-neutral-700 mt-4">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Únete a Dosis vital y mejora tu hidratación
          </p>
        </div>

        {/* Register Form */}
        <Card className="shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@email.com"
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  },
                  onChange: (e) => checkEmail(e.target.value)
                })}
                error={errors.email?.message}
                rightIcon={
                  <div className="flex items-center space-x-2">
                    {isCheckingEmail && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
                    )}
                    {emailAvailable === true && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {emailAvailable === false && (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                }
              />
              {emailAvailable === false && (
                <p className="mt-1 text-sm text-red-600">
                  Este email ya está registrado
                </p>
              )}
            </div>

            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Nombre"
                  type="text"
                  placeholder="Juan"
                  {...register('first_name', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 2,
                      message: 'El nombre debe tener al menos 2 caracteres'
                    }
                  })}
                  error={errors.first_name?.message}
                />
              </div>
              <div>
                <Input
                  label="Apellido"
                  type="text"
                  placeholder="Pérez"
                  {...register('last_name', {
                    required: 'El apellido es requerido',
                    minLength: {
                      value: 2,
                      message: 'El apellido debe tener al menos 2 caracteres'
                    }
                  })}
                  error={errors.last_name?.message}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres'
                  }
                })}
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Input
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
                error={errors.confirmPassword?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </div>

            {/* Weight with Unit Selector */}
            <div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Peso"
                    type="number"
                    step="0.1"
                    placeholder={pesoUnidad === 'kg' ? '70' : '154'}
                    {...register('peso', {
                      required: 'El peso es requerido',
                      validate: validarPeso,
                      valueAsNumber: true
                    })}
                    error={errors.peso?.message}
                  />
                </div>
                <div className="w-24 mt-6">
                  <select
                    {...register('peso_unidad')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-10"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Se usará para calcular tu meta de hidratación personalizada
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <Input
                label="Fecha de nacimiento"
                type="date"
                {...register('fecha_nacimiento', {
                  required: 'La fecha de nacimiento es requerida',
                  validate: (value) => {
                    if (!value) return 'La fecha de nacimiento es requerida';
                    const fecha = new Date(value);
                    const hoy = new Date();
                    const edad = hoy.getFullYear() - fecha.getFullYear();
                    const mes = hoy.getMonth() - fecha.getMonth();
                    const edadReal = mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate()) ? edad - 1 : edad;
                    if (edadReal < 0) return 'La fecha no puede ser futura';
                    if (edadReal > 120) return 'La edad no puede ser mayor a 120 años';
                    return true;
                  }
                })}
                error={errors.fecha_nacimiento?.message}
                helperText={edadCalculada !== null ? `Edad: ${edadCalculada} años (calculada automáticamente)` : 'La edad se calculará automáticamente'}
              />
            </div>

            {/* Fragility Field (only for >65 years) */}
            {mostrarCampoFragilidad && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="es_fragil"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    {...register('es_fragil_o_insuficiencia_cardiaca')}
                  />
                  <label htmlFor="es_fragil" className="ml-2 text-sm text-gray-700">
                    Soy una persona frágil o con insuficiencia cardíaca
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Esto ajustará tu meta de hidratación diaria según recomendaciones médicas
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Código de Referido (Opcional) */}
            <div>
              <Input
                label="Código de Referido (Opcional)"
                type="text"
                placeholder="ABC12345"
                {...register('codigo_referido')}
                error={errors.codigo_referido?.message}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Si tenés un código de referido, ingresalo aquí para ayudar a quien te invitó
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="acceptTerms"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                {...register('acceptTerms', {
                  required: 'Debes aceptar los términos y condiciones'
                })}
              />
              <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600">
                Acepto los{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  política de privacidad
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading || emailAvailable === false}
              className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-display font-bold"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  O continúa con
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleAuthButton 
                onClick={handleGoogleLogin}
                text="Registrarse con Google"
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    ¿Ya tienes cuenta?
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-colors duration-200"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </Card>

        {/* Benefits */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Únete a miles de usuarios que ya están mejorando su hidratación
          </p>
          <div className="grid grid-cols-1 gap-3 text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <span>💧</span>
              <span>Seguimiento inteligente de hidratación</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>📊</span>
              <span>Estadísticas detalladas y personalizadas</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>🔔</span>
              <span>Recordatorios personalizados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
