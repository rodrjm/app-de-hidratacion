import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { apiService } from '@/services/api';

interface OnboardingForm {
  peso: number;
}

const Onboarding: React.FC = () => {
  const { refreshUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<OnboardingForm>();

  const onSubmit = async (data: OnboardingForm) => {
    try {
      // Actualizar el perfil del usuario con el peso
      await apiService.patch('/users/profile/', {
        peso: data.peso
      });

      // Recargar datos del usuario para obtener la meta calculada
      await refreshUser();

      toast.success('¡Configuración completada! 🎉');
      
      // Usar window.location para forzar una navegación completa y evitar problemas de redirección
      window.location.href = '/dashboard';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar los datos';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-secondary-500 rounded-full flex items-center justify-center mb-4 shadow-medium">
            <Droplets className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-display font-bold text-neutral-700">
            ¡Casi listo, che!
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Para calcular tu meta de hidratación personalizada, necesitamos conocer tu peso.
          </p>
        </div>

        {/* Onboarding Form */}
        <Card className="shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                label="Tu Peso (kg)"
                type="number"
                placeholder="Ej: 75"
                step="0.1"
                min="10"
                max="500"
                {...register('peso', {
                  required: 'El peso es obligatorio',
                  min: { value: 10, message: 'El peso debe ser al menos 10 kg' },
                  max: { value: 500, message: 'El peso debe ser menor a 500 kg' }
                })}
                error={errors.peso?.message}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Se usará para calcular tu meta de hidratación diaria personalizada
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-display font-bold"
            >
              ¡Comenzar a hidratarme!
            </Button>
          </form>
        </Card>

        {/* Info */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            Podrás modificar estos datos más tarde en tu perfil
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

