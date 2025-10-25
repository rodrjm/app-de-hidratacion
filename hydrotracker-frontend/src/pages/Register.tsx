import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Droplets, Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { RegisterForm } from '@/types';

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>();

  const password = watch('password');

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

  const checkUsername = async (username: string) => {
    if (username.length < 3) return;
    
    setIsCheckingUsername(true);
    try {
      // Simular verificación de username
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsernameAvailable(username !== 'admin' && username !== 'test');
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-500 rounded-full flex items-center justify-center mb-4">
            <Droplets className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Únete a HydroTracker y mejora tu hidratación
          </p>
        </div>

        {/* Register Form */}
        <Card className="shadow-strong">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <div>
              <Input
                label="Nombre de usuario"
                placeholder="Elige un nombre de usuario"
                {...register('username', {
                  required: 'El usuario es requerido',
                  minLength: {
                    value: 3,
                    message: 'El usuario debe tener al menos 3 caracteres'
                  },
                  onChange: (e) => checkUsername(e.target.value)
                })}
                error={errors.username?.message}
                rightIcon={
                  <div className="flex items-center space-x-2">
                    {isCheckingUsername && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
                    )}
                    {usernameAvailable === true && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {usernameAvailable === false && (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                }
              />
              {usernameAvailable === false && (
                <p className="mt-1 text-sm text-red-600">
                  Este nombre de usuario no está disponible
                </p>
              )}
            </div>

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

            {/* Password */}
            <div>
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
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

            {/* Weight (Optional) */}
            <div>
              <Input
                label="Peso (kg) - Opcional"
                type="number"
                placeholder="70"
                {...register('peso', {
                  min: {
                    value: 20,
                    message: 'El peso debe ser mayor a 20kg'
                  },
                  max: {
                    value: 300,
                    message: 'El peso debe ser menor a 300kg'
                  }
                })}
                error={errors.peso?.message}
                helperText="Para calcular tu meta de hidratación personalizada"
              />
            </div>

            {/* Age (Optional) */}
            <div>
              <Input
                label="Edad - Opcional"
                type="number"
                placeholder="25"
                {...register('edad', {
                  min: {
                    value: 1,
                    message: 'La edad debe ser mayor a 1'
                  },
                  max: {
                    value: 120,
                    message: 'La edad debe ser menor a 120'
                  }
                })}
                error={errors.edad?.message}
              />
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de actividad
              </label>
              <select
                {...register('nivel_actividad', { required: 'Selecciona tu nivel de actividad' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Selecciona tu nivel</option>
                <option value="sedentario">Sedentario</option>
                <option value="ligero">Actividad ligera</option>
                <option value="moderado">Actividad moderada</option>
                <option value="intenso">Actividad intensa</option>
                <option value="muy_intenso">Actividad muy intensa</option>
              </select>
              {errors.nivel_actividad && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.nivel_actividad.message}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                {...register('acceptTerms', {
                  required: 'Debes aceptar los términos y condiciones'
                })}
              />
              <label className="ml-2 text-sm text-gray-600">
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
              disabled={isLoading || usernameAvailable === false || emailAvailable === false}
              className="w-full"
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
                  ¿Ya tienes cuenta?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-colors duration-200"
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
