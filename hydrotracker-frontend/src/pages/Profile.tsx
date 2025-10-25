import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Settings, Save, Eye, EyeOff, Camera, Bell, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { User as UserType } from '@/types';

const Profile: React.FC = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors }
  } = useForm<UserType>({
    defaultValues: user || {}
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch,
    formState: { errors: passwordErrors }
  } = useForm();

  const newPassword = watch('newPassword');

  const onSubmitProfile = async (data: Partial<UserType>) => {
    try {
      await updateProfile(data);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    }
  };

  const onSubmitPassword = async (data: any) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success('Contraseña cambiada exitosamente');
    } catch (error) {
      toast.error('Error al cambiar la contraseña');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'password', label: 'Seguridad', icon: Shield },
    { id: 'preferences', label: 'Preferencias', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mi Perfil
              </h1>
              <p className="text-gray-600">
                Gestiona tu información personal
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${user?.es_premium ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {user?.es_premium ? 'Premium' : 'Gratuito'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card title="Información Personal" subtitle="Actualiza tu información básica">
                <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Nombre de usuario"
                      {...registerProfile('username', {
                        required: 'El usuario es requerido'
                      })}
                      error={profileErrors.username?.message}
                    />

                    <Input
                      label="Correo electrónico"
                      type="email"
                      {...registerProfile('email', {
                        required: 'El email es requerido',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      })}
                      error={profileErrors.email?.message}
                    />

                    <Input
                      label="Peso (kg)"
                      type="number"
                      {...registerProfile('peso', {
                        min: { value: 20, message: 'Peso mínimo: 20kg' },
                        max: { value: 300, message: 'Peso máximo: 300kg' }
                      })}
                      error={profileErrors.peso?.message}
                    />

                    <Input
                      label="Edad"
                      type="number"
                      {...registerProfile('edad', {
                        min: { value: 1, message: 'Edad mínima: 1 año' },
                        max: { value: 120, message: 'Edad máxima: 120 años' }
                      })}
                      error={profileErrors.edad?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nivel de actividad
                    </label>
                    <select
                      {...registerProfile('nivel_actividad')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="sedentario">Sedentario</option>
                      <option value="ligero">Actividad ligera</option>
                      <option value="moderado">Actividad moderada</option>
                      <option value="intenso">Actividad intensa</option>
                      <option value="muy_intenso">Actividad muy intensa</option>
                    </select>
                  </div>

                  <div>
                    <Input
                      label="Meta diaria (ml)"
                      type="number"
                      {...registerProfile('meta_diaria_ml', {
                        min: { value: 500, message: 'Meta mínima: 500ml' },
                        max: { value: 10000, message: 'Meta máxima: 10000ml' }
                      })}
                      error={profileErrors.meta_diaria_ml?.message}
                      helperText="Tu objetivo diario de hidratación"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <Card title="Seguridad" subtitle="Cambia tu contraseña">
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                  <Input
                    label="Contraseña actual"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...registerPassword('currentPassword', {
                      required: 'La contraseña actual es requerida'
                    })}
                    error={passwordErrors.currentPassword?.message}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                  />

                  <Input
                    label="Nueva contraseña"
                    type={showNewPassword ? 'text' : 'password'}
                    {...registerPassword('newPassword', {
                      required: 'La nueva contraseña es requerida',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                      }
                    })}
                    error={passwordErrors.newPassword?.message}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                  />

                  <Input
                    label="Confirmar nueva contraseña"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...registerPassword('confirmPassword', {
                      required: 'Confirma tu nueva contraseña',
                      validate: value => value === newPassword || 'Las contraseñas no coinciden'
                    })}
                    error={passwordErrors.confirmPassword?.message}
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

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Cambiar Contraseña
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <Card title="Notificaciones" subtitle="Configura cómo quieres recibir recordatorios">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Recordatorios de hidratación</h4>
                        <p className="text-sm text-gray-600">Recibe notificaciones para beber agua</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Recordatorios de meta</h4>
                        <p className="text-sm text-gray-600">Notificaciones cuando estés cerca de tu meta</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Resumen diario</h4>
                        <p className="text-sm text-gray-600">Recibe un resumen de tu hidratación al final del día</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>

                <Card title="Configuración de Hidratación" subtitle="Personaliza tu experiencia">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora de inicio de recordatorios
                      </label>
                      <input
                        type="time"
                        defaultValue="08:00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora de fin de recordatorios
                      </label>
                      <input
                        type="time"
                        defaultValue="22:00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intervalo entre recordatorios (minutos)
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="30">30 minutos</option>
                        <option value="60" selected>60 minutos</option>
                        <option value="90">90 minutos</option>
                        <option value="120">120 minutos</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
