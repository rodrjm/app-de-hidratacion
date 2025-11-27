import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { User, Save, Eye, EyeOff, Shield, LogOut, AlertTriangle, Bell, Crown, CheckCircle2, Zap, Ban, Lock, CreditCard, Settings, Copy, Share2, Gift } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';
import { User as UserType } from '@/types';
import { monetizationService } from '@/services/monetization';
import { referidosService } from '@/services/referidos';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import AdSenseBlock from '@/components/ads/AdSenseBlock';

// ID del bloque de anuncios para Configuración/Ajustes
const AD_SETTINGS_ID = '3403345967';

type TabType = 'basic' | 'security' | 'preferences' | 'account' | 'catalogs';

const TAB_IDS: TabType[] = ['basic', 'security', 'preferences', 'account', 'catalogs'];

const getInitialTab = (): TabType => {
  const stored = localStorage.getItem('profile_active_tab') as TabType | null;
  if (stored && TAB_IDS.includes(stored)) {
    return stored;
  }
  return 'basic';
};

const Profile: React.FC = () => {
  const { user, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Preferencias de notificaciones
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('22:00');
  const [intervalMinutes, setIntervalMinutes] = useState<number>(() => {
    // Si el usuario no es premium, solo permitir 240 o 360 minutos
    if (!user?.es_premium) {
      return 240;
    }
    return 60;
  });

  // Ajustar intervalo si el usuario no es premium y tiene un valor no permitido
  useEffect(() => {
    if (!user?.es_premium && intervalMinutes < 240) {
      setIntervalMinutes(240);
    }
  }, [user?.es_premium, intervalMinutes]);

  // Premium state
  const [premiumLoading, setPremiumLoading] = useState(true);
  const [premiumStatus, setPremiumStatus] = useState<{ is_premium: boolean; subscription_end_date?: string } | null>(null);
  const [premiumFeatures, setPremiumFeatures] = useState<string[]>([]);
  const [premiumUpgrade, setPremiumUpgrade] = useState<{ message: string; features: string[] } | null>(null);
  const [noAds, setNoAds] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [referidosInfo, setReferidosInfo] = useState<{
    codigo_referido: string;
    referidos_verificados: number;
    referidos_pendientes: number;
    tiene_recompensa_disponible: boolean;
  } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [loadingReferidos, setLoadingReferidos] = useState(false);

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

  // Load premium data when account tab is active
  useEffect(() => {
    if (activeTab === 'account') {
      const loadPremium = async () => {
        try {
          setPremiumLoading(true);
          const [st, pf, up, na] = await Promise.all([
            monetizationService.getSubscriptionStatus(),
            monetizationService.getPremiumFeatures(),
            monetizationService.getUpgradePrompt(),
            monetizationService.getNoAdsStatus()
          ]);
          setPremiumStatus(st);
          setPremiumFeatures(pf.features || []);
          setPremiumUpgrade(up);
          setNoAds(!!na.is_premium);
        } catch (error) {
          console.error('Error loading premium data:', error);
        } finally {
          setPremiumLoading(false);
        }
      };
      loadPremium();
    }
  }, [activeTab]);

  // Load referidos data when account tab is active
  useEffect(() => {
    if (activeTab === 'account') {
      const loadReferidos = async () => {
        try {
          setLoadingReferidos(true);
          const info = await referidosService.getReferidosInfo();
          setReferidosInfo(info);
          setReferralCount(info.referidos_pendientes);
        } catch (error) {
          setReferidosInfo(null);
          toast.error('No pudimos cargar tu código de referidos. Intenta nuevamente.');
        } finally {
          setLoadingReferidos(false);
        }
      };
      loadReferidos();
    }
  }, [activeTab]);

  const onSubmitProfile = async (_data: Partial<UserType>) => {
    toast.success('Perfil actualizado (demo)');
  };

  const onSubmitPassword = async (_data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    try {
      // TODO: Implementar cambio de contraseña cuando esté disponible en el backend
      toast.success('Contraseña cambiada (demo)');
    } catch (error) {
      toast.error('Error al cambiar la contraseña');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const handleUpgrade = () => {
    navigate('/premium');
  };

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    localStorage.setItem('profile_active_tab', tabId);
  };

const tabs = [
  { id: 'basic' as TabType, label: 'Información Básica', icon: User },
  { id: 'security' as TabType, label: 'Seguridad', icon: Lock },
  { id: 'preferences' as TabType, label: 'Preferencias y Recordatorios', icon: Bell },
  { id: 'account' as TabType, label: 'Cuenta y Suscripción', icon: CreditCard },
  { id: 'catalogs' as TabType, label: 'Catálogos y Herramientas', icon: Settings }
  ];

  const getTituloSeccion = (seccion: TabType): string => {
    switch (seccion) {
      case 'basic':
        return 'Información Básica';
      case 'security':
        return 'Seguridad y Contraseña';
      case 'preferences':
        return 'Preferencias y Recordatorios';
      case 'account':
        return 'Cuenta y Suscripción';
      case 'catalogs':
        return 'Catálogos y Herramientas';
      default:
        return 'Mi Perfil';
    }
  };

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab);
  const ActiveIcon = activeTabConfig?.icon || User;

  return (
    <div className="min-h-screen bg-primary-50">
      <PageHeader
        title={getTituloSeccion(activeTab)}
        subtitle="Gestiona tu perfil y personaliza tu experiencia de hidratación"
        icon={<ActiveIcon className="w-10 h-10" />}
        actions={
          user?.es_premium ? (
            <span className="px-3 py-1 bg-white/20 text-white text-sm font-display font-medium rounded-full border border-white/30">
              Premium
            </span>
          ) : null
        }
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="flex-shrink-0 w-16">
            <Card className="p-1.5">
              <nav className="flex flex-col space-y-1.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center justify-center px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-white text-accent-700 shadow-md ring-1 ring-accent-200'
                          : 'text-neutral-500 hover:bg-white/70 shadow-sm'
                      }`}
                      title={tab.label}
                      aria-label={tab.label}
                    >
                      <Icon 
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent-600' : 'text-neutral-500'}`}
                        strokeWidth={2}
                      />
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* 1. Información Básica Tab */}
            {activeTab === 'basic' && (
              <Card title="Información Personal" subtitle="Actualiza tu información básica">
                <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                  {/* Nombre y Apellido - Solo lectura */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-display font-medium text-neutral-700 mb-2">
                        Nombre
                      </label>
                      <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                        {user?.first_name || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-display font-medium text-neutral-700 mb-2">
                        Apellido
                      </label>
                      <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                        {user?.last_name || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Correo electrónico - Solo lectura */}
                  <div>
                    <label className="block text-sm font-display font-medium text-neutral-700 mb-2">
                      Correo electrónico
                    </label>
                    <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                      {user?.email || '-'}
                    </div>
                  </div>

                  {/* Fecha de nacimiento - Editable */}
                  <div>
                    <Input
                      label="Fecha de nacimiento"
                      type="date"
                      {...registerProfile('fecha_nacimiento', {
                        required: 'La fecha de nacimiento es requerida',
                        validate: (value) => {
                          if (!value) return 'La fecha de nacimiento es requerida';
                          const fechaNac = new Date(value);
                          const hoy = new Date();
                          if (fechaNac >= hoy) return 'La fecha de nacimiento debe ser anterior a hoy';
                          const edad = hoy.getFullYear() - fechaNac.getFullYear();
                          if (edad > 120) return 'La fecha de nacimiento no puede ser anterior a 120 años';
                          return true;
                        }
                      })}
                      error={profileErrors.fecha_nacimiento?.message}
                    />
                  </div>

                  {/* Peso - Editable */}
                  <div>
                    <Input
                      label="Peso (kg)"
                      type="number"
                      {...registerProfile('peso', {
                        min: { value: 20, message: 'Peso mínimo: 20kg' },
                        max: { value: 300, message: 'Peso máximo: 300kg' }
                      })}
                      error={profileErrors.peso?.message}
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

            {/* 2. Seguridad Tab */}
            {activeTab === 'security' && (
              <Card title="Seguridad" subtitle="Cambia tu contraseña">
                <form onSubmit={handleSubmitPassword((data) => onSubmitPassword(data as { currentPassword: string; newPassword: string; confirmPassword: string }))} className="space-y-6">
                  <Input
                    label="Contraseña actual"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...registerPassword('currentPassword', {
                      required: 'La contraseña actual es requerida'
                    })}
                    error={passwordErrors.currentPassword?.message as string | undefined}
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
                    error={passwordErrors.newPassword?.message as string | undefined}
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
                    error={passwordErrors.confirmPassword?.message as string | undefined}
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

            {/* 3. Preferencias y Recordatorios Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <Card title="Notificaciones" subtitle="Configura cómo quieres recibir recordatorios">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display font-medium text-neutral-700">Recordatorios de hidratación</h4>
                        <p className="text-sm text-neutral-600">Recibe notificaciones para beber agua</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <span className="sr-only">Activar recordatorios de hidratación</span>
                        <input
                          aria-label="Activar recordatorios de hidratación"
                          type="checkbox"
                          className="sr-only peer"
                          checked={remindersEnabled}
                          onChange={(e) => setRemindersEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                      </label>
                    </div>

                    {/* Intervalo entre recordatorios - Movido arriba, debajo del toggle */}
                    <div className={`${remindersEnabled ? '' : 'opacity-50 pointer-events-none'}`} aria-disabled={!remindersEnabled}>
                      <label className="block text-sm font-display font-medium text-neutral-700 mb-2" htmlFor="intervalo-recordatorios">
                        Intervalo entre recordatorios (minutos)
                      </label>
                      <div className="relative">
                        <select
                          id="intervalo-recordatorios"
                          className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 appearance-none bg-white disabled:bg-neutral-50 disabled:cursor-not-allowed"
                          value={intervalMinutes}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value !== 'premium') {
                              setIntervalMinutes(Number(value));
                            }
                          }}
                          disabled={!remindersEnabled}
                        >
                          {user?.es_premium ? (
                            <>
                              <option value="15">15 minutos</option>
                              <option value="30">30 minutos</option>
                              <option value="45">45 minutos</option>
                              <option value="60">60 minutos</option>
                              <option value="90">90 minutos</option>
                              <option value="120">120 minutos</option>
                              <option value="180">180 minutos</option>
                              <option value="240">240 minutos</option>
                              <option value="360">360 minutos</option>
                            </>
                          ) : (
                            <>
                              <option value="240">240 minutos (Recomendado)</option>
                              <option value="360">360 minutos</option>
                              <option value="premium" disabled className="text-neutral-400 font-bold">
                                30, 60 o 90 minutos o más 👑 Premium
                              </option>
                            </>
                          )}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {!user?.es_premium && remindersEnabled && (
                        <p className="mt-2 text-xs text-neutral-600">
                          Desbloquea intervalos más cortos y mayor precisión con{' '}
                          <button
                            type="button"
                            onClick={() => navigate('/premium')}
                            className="text-accent-500 hover:text-accent-600 font-display font-medium underline"
                          >
                            Dosis vital: Tu aplicación de hidratación personal Premium
                          </button>
                          .
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-medium text-neutral-700">Recordatorios de meta</h4>
                          {!user?.es_premium && (
                            <Crown className="w-4 h-4 text-secondary-500" />
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">Notificaciones cuando estés cerca de tu meta</p>
                      </div>
                      <label className={`relative inline-flex items-center ${user?.es_premium ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <span className="sr-only">Activar recordatorios de meta</span>
                        <input 
                          aria-label="Activar recordatorios de meta" 
                          type="checkbox" 
                          className="sr-only peer" 
                          defaultChecked={user?.es_premium}
                          disabled={!user?.es_premium}
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500 ${!user?.es_premium ? 'opacity-50' : ''}`}></div>
                      </label>
                    </div>
                    {!user?.es_premium && (
                      <p className="text-xs text-accent-600 ml-0" style={{ fontSize: '0.85em', marginLeft: '20px' }}>
                        🔔 Desbloquea notificaciones inteligentes basadas en tu meta con{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/premium')}
                          className="text-accent-600 hover:text-accent-700 font-display font-medium underline"
                        >
                          Premium
                        </button>
                        .
                      </p>
                    )}

                    {user?.es_premium && (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-display font-medium text-neutral-700">Resumen diario</h4>
                          <p className="text-sm text-neutral-600">Recibe un resumen de tu hidratación al final del día</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <span className="sr-only">Activar resumen diario</span>
                          <input aria-label="Activar resumen diario" type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                        </label>
                      </div>
                    )}
                  </div>
                </Card>

                <Card title="Configuración de Hidratación" subtitle="Personaliza tu experiencia">
                  <div className={`space-y-4 ${remindersEnabled ? '' : 'opacity-50 pointer-events-none'}`} aria-disabled={!remindersEnabled}>
                    <div>
                      <p className="block text-sm font-display font-medium text-neutral-700 mb-2">
                        Hora de inicio de recordatorios
                      </p>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        disabled={!remindersEnabled}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                    </div>

                    <div>
                      <p className="block text-sm font-display font-medium text-neutral-700 mb-2">
                        Hora de fin de recordatorios
                      </p>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        disabled={!remindersEnabled}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          toast.success('Preferencias guardadas');
                        }}
                        disabled={!remindersEnabled}
                      >
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* 4. Cuenta y Suscripción Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <Card title="Información de la Cuenta" subtitle="Detalles de tu cuenta">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-display font-medium text-neutral-700 mb-1">
                          Nombre y apellido
                        </p>
                        <p className="text-sm text-neutral-700 bg-neutral-50 px-3 py-2 rounded-lg">
                          {user?.first_name && user?.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user?.first_name || user?.last_name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="block text-sm font-display font-medium text-neutral-700 mb-1">
                          Correo electrónico
                        </p>
                        <p className="text-sm text-neutral-700 bg-neutral-50 px-3 py-2 rounded-lg">
                          {user?.email}
                        </p>
                      </div>
                      <div>
                        <p className="block text-sm font-display font-medium text-neutral-700 mb-1">
                          Tipo de cuenta
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${user?.es_premium ? 'bg-secondary-500' : 'bg-neutral-400'}`} />
                          <p className="text-sm text-neutral-700">
                            {user?.es_premium ? 'Premium' : 'Gratuito'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="block text-sm font-display font-medium text-neutral-700 mb-1">
                          Miembro desde
                        </p>
                        <p className="text-sm text-neutral-700 bg-neutral-50 px-3 py-2 rounded-lg">
                          {user?.fecha_creacion ? new Date(user.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Premium Card - Movido aquí desde Settings */}
                <Card title="Dosis vital: Tu aplicación de hidratación personal Premium">
                  {premiumLoading ? (
                    <div className="text-neutral-500">Cargando...</div>
                  ) : (
                    <div className="space-y-4">
                      {premiumStatus?.is_premium ? (
                        <>
                          {/* Información detallada de suscripción para usuarios Premium */}
                          <div className="space-y-3 pb-4 border-b border-neutral-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-display font-medium text-neutral-500 mb-1">Estado</p>
                                <p className="text-sm text-neutral-700 font-display font-medium">
                                  Usuario Premium activo
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-display font-medium text-neutral-500 mb-1">Plan Actual</p>
                                <p className="text-sm text-neutral-700">
                                  Mensual
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-display font-medium text-neutral-500 mb-1">Próxima Facturación</p>
                                <p className="text-sm text-neutral-700">
                                  {premiumStatus?.subscription_end_date 
                                    ? new Date(premiumStatus.subscription_end_date).toLocaleDateString('es-ES')
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-display font-medium text-neutral-500 mb-1">Método de Pago</p>
                                <p className="text-sm text-neutral-700">
                                  Visa terminada en 4242
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Botones de gestión */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                toast('Funcionalidad de editar plan próximamente disponible', { icon: 'ℹ️' });
                              }}
                              className="flex-1"
                            >
                              Editar Plan
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowCancelSubscriptionModal(true)}
                              className="flex-1 border-error-300 text-error-600 hover:bg-error-50 hover:border-error-400"
                            >
                              Cancelar Suscripción
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-neutral-700 font-display font-medium">
                              Usuario Free
                            </p>
                          </div>
                          <Button variant="primary" onClick={handleUpgrade}>
                            Ver Premium
                          </Button>
                        </div>
                      )}

                      {premiumFeatures.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-display font-medium text-neutral-700 mb-2">Funcionalidades Premium</h4>
                          <ul className="grid sm:grid-cols-2 gap-3">
                            {premiumFeatures.map((f) => (
                              <li key={f} className="flex items-center text-neutral-700">
                                <CheckCircle2 className="w-5 h-5 text-secondary-500 mr-2" /> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {premiumUpgrade && !premiumStatus?.is_premium && (
                        <div className="mt-4 p-4 bg-accent-50 border border-accent-200 rounded-lg">
                          <p className="font-display font-medium text-neutral-700 mb-2">{premiumUpgrade.message}</p>
                          {premiumUpgrade.features && premiumUpgrade.features.length > 0 && (
                            <ul className="list-disc list-inside text-sm text-neutral-600 mb-3">
                              {premiumUpgrade.features.map((f) => (
                                <li key={f}>{f}</li>
                              ))}
                            </ul>
                          )}
                          <Button variant="primary" onClick={handleUpgrade} size="sm">
                            <Zap className="w-4 h-4 mr-2" />
                            Actualizar
                          </Button>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center">
                          {noAds ? (
                            <Ban className="w-5 h-5 text-secondary-500 mr-2" />
                          ) : (
                            <Ban className="w-5 h-5 text-neutral-400 mr-2" />
                          )}
                          <span className="text-neutral-700">{noAds ? 'Anuncios deshabilitados' : 'Anuncios habilitados (usuario free)'}</span>
                        </div>
                        {!premiumStatus?.is_premium && (
                          <Button variant="outline" onClick={handleUpgrade} size="sm">Eliminar anuncios</Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Programa de Referidos */}
                <Card title="Programa de Referidos">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-display font-bold text-neutral-700 mb-2">
                        ¡Recomendá y gana 1 mes Premium gratis!
                      </h3>
                      <p className="text-sm text-neutral-600 mb-4">
                        Ganá un mes gratis por cada 3 amigos que se registren y verifiquen su cuenta con tu código.
                      </p>
                    </div>

                    {/* Barra de progreso */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-display font-medium text-neutral-700">
                          Progreso: {referidosInfo?.referidos_pendientes || referralCount}/3 Referidos
                        </span>
                        {referidosInfo?.tiene_recompensa_disponible && (
                          <span className="text-sm font-display font-medium text-secondary-500 flex items-center">
                            <Gift className="w-4 h-4 mr-1" />
                            ¡Recompensa disponible!
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-secondary-500 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${Math.min(((referidosInfo?.referidos_pendientes || referralCount) / 3) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        {[1, 2, 3].map((num) => (
                          <div
                            key={num}
                            className={`w-2 h-2 rounded-full ${
                              num <= (referidosInfo?.referidos_pendientes || referralCount) ? 'bg-secondary-500' : 'bg-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Código de referido */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
                      <label className="block text-xs font-display font-medium text-neutral-500 mb-2">
                        Tu Código de Referido
                      </label>
                      {referidosInfo ? (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white border border-neutral-300 rounded px-3 py-2 text-lg font-mono font-bold text-neutral-700">
                            {referidosInfo.codigo_referido}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(referidosInfo.codigo_referido);
                              setCodeCopied(true);
                              toast.success('Código copiado al portapapeles');
                              setTimeout(() => setCodeCopied(false), 2000);
                            }}
                            className="flex-shrink-0"
                          >
                            <Copy className={`w-4 h-4 ${codeCopied ? 'text-secondary-500' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const message = encodeURIComponent(
                                `¡Sumate a "Dosis vital: Tu aplicación de hidratación personal" y controlá tu hidratación de manera científica! 🚰\n\nUsá mi código de referido: ${referidosInfo.codigo_referido}\n\nRegistrate aquí: ${window.location.origin}/register?ref=${referidosInfo.codigo_referido}`
                              );
                              window.open(`https://wa.me/?text=${message}`, '_blank');
                            }}
                            className="flex-shrink-0"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">Generando tu código único...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            loading={loadingReferidos}
                            disabled
                          >
                            Cargando
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Botón de Reclamar Recompensa */}
                    {referidosInfo?.tiene_recompensa_disponible && (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => setShowClaimRewardModal(true)}
                        disabled={loadingReferidos}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Reclamar 1 Mes Premium Gratis
                      </Button>
                    )}
                  </div>
                </Card>
                {/* Anuncio en Configuración/Ajustes */}
                {!premiumStatus?.is_premium && (
                  <div className="my-6">
                    <AdSenseBlock 
                      adSlotId={AD_SETTINGS_ID} 
                      className="w-full mx-auto"
                      style={{ minHeight: '90px' }}
                      format="auto" 
                    />
                  </div>
                )}

                <Card title="Zona de Peligro" subtitle="Acciones que no se pueden deshacer">
                  <div className="space-y-4">
                    <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-display font-medium text-error-900 mb-1">
                            Cerrar Sesión
                          </h4>
                          <p className="text-sm text-error-700 mb-3">
                            Esto cerrará tu sesión actual y tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
                          </p>
                          <div className="flex space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowLogoutConfirm(true)}
                              className="border-error-300 text-error-700 hover:bg-error-50"
                            >
                              <LogOut className="w-4 h-4 mr-2" />
                              Cerrar Sesión
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Logout Confirmation Modal */}
                {showLogoutConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                      <div className="flex items-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-error-600 mr-3" />
                        <h3 className="text-lg font-display font-bold text-neutral-700">
                          Confirmar Cierre de Sesión
                        </h3>
                      </div>
                      <p className="text-neutral-600 mb-6">
                        ¿Estás seguro de que quieres cerrar sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
                      </p>
                      <div className="flex space-x-3 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLogoutConfirm(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleLogout}
                          loading={isLoading}
                          disabled={isLoading}
                          className="bg-error hover:bg-error-600"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Catálogos y Herramientas Tab */}
            {activeTab === 'catalogs' && (
              <div className="space-y-6">
                <Card title="Catálogo de Bebidas">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-display font-medium text-neutral-700">Consulta todas las bebidas</h3>
                      <p className="text-sm text-neutral-500">Incluye catálogo premium si tu cuenta tiene acceso</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/bebidas')}>
                      Ver Bebidas
                    </Button>
                  </div>
                </Card>

                <Card title="Recipientes">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-display font-medium text-neutral-700">Gestiona tus recipientes</h3>
                      <p className="text-sm text-neutral-500">Agrega, edita o elimina recipientes</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/recipientes')}>
                      Abrir
                    </Button>
                  </div>
                </Card>

                <Card title="Feedback y Soporte">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-display font-medium text-neutral-700 mb-1">Ayúdanos a mejorar "Dosis vital: Tu aplicación de hidratación personal"</h3>
                      <p className="text-sm text-neutral-500">Envía tu opinión o reporta errores</p>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => setShowFeedbackModal(true)}
                    >
                      Enviar Feedback
                    </Button>
                  </div>
                </Card>
              </div>
            )}
            
            {showFeedbackModal && (
              <FeedbackModal
                onClose={() => setShowFeedbackModal(false)}
              />
            )}

            {/* Modal de Reclamar Recompensa de Referidos */}
            {showClaimRewardModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                  <div className="flex items-center mb-4">
                    <Gift className="w-6 h-6 text-secondary-500 mr-3" />
                    <h3 className="text-lg font-display font-bold text-neutral-700">
                      ¡Felicidades! Tenés un mes Premium gratis
                    </h3>
                  </div>
                  
                  <p className="text-neutral-600 mb-6">
                    Has completado 3 referidos exitosos. ¿Querés activar tu mes Premium gratis ahora?
                  </p>

                  <div className="flex space-x-3 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClaimRewardModal(false)}
                    >
                      Más tarde
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await referidosService.reclamarRecompensa();
                          toast.success(response.message);
                          setShowClaimRewardModal(false);
                          
                          // Recargar datos de referidos
                          const info = await referidosService.getReferidosInfo();
                          setReferidosInfo(info);
                          setReferralCount(info.referidos_pendientes);
                          
                          // Recargar datos de premium
                          if (activeTab === 'account') {
                            const [st] = await Promise.all([
                              monetizationService.getSubscriptionStatus()
                            ]);
                            setPremiumStatus(st);
                          }
                          
                          // Recargar usuario para actualizar estado premium
                          window.location.reload();
                        } catch (error) {
                          const errorMessage = error instanceof Error ? error.message : 'Error al activar el mes Premium gratis';
                          toast.error(errorMessage);
                        }
                      }}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Activar Ahora
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Cancelación de Suscripción */}
            {showCancelSubscriptionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-error-600 mr-3" />
                    <h3 className="text-lg font-display font-bold text-neutral-700">
                      ¿Estás seguro que deseas cancelar Premium?
                    </h3>
                  </div>
                  
                  <p className="text-neutral-600 mb-4">
                    Al cancelar, perderás el acceso a las funciones Premium (Meta personalizada, Recordatorios inteligentes, Catálogo Premium, etc.) al final de tu ciclo de facturación actual ({premiumStatus?.subscription_end_date ? new Date(premiumStatus.subscription_end_date).toLocaleDateString('es-ES') : 'N/A'}).
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-display font-medium text-neutral-700 mb-2">
                      ¿Hay algo que podamos hacer para que sigas con nosotros? (Opcional)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Comparte tu razón o sugerencia..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowCancelSubscriptionModal(false);
                        setCancelReason('');
                      }}
                    >
                      Volver / Mantener Suscripción
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          // Aquí iría la llamada al API para cancelar la suscripción
                          toast.success('Suscripción cancelada. Tendrás acceso Premium hasta el final de tu ciclo de facturación.');
                          setShowCancelSubscriptionModal(false);
                          setCancelReason('');
                          // Recargar datos de premium
                          if (activeTab === 'account') {
                            const [st] = await Promise.all([
                              monetizationService.getSubscriptionStatus()
                            ]);
                            setPremiumStatus(st);
                          }
                        } catch (error) {
                          toast.error('Error al cancelar la suscripción');
                        }
                      }}
                      className="border-error-300 text-error-600 hover:bg-error-50 hover:border-error-400"
                    >
                      Confirmar Cancelación
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
