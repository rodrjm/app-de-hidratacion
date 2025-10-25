import React, { useEffect } from 'react';
import { Droplets, TrendingUp, Target, Clock } from 'lucide-react';
import { useConsumosStore } from '@/store/consumosStore';
import { useAuthStore } from '@/store/authStore';
import HydrationProgress from '@/components/hydration/HydrationProgress';
import QuickIntakeButtons from '@/components/hydration/QuickIntakeButtons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const {
    estadisticas,
    bebidas,
    recipientes,
    isLoading,
    error,
    fetchEstadisticas,
    fetchBebidas,
    fetchRecipientes,
    addConsumo
  } = useConsumosStore();

  useEffect(() => {
    // Cargar datos iniciales
    fetchEstadisticas();
    fetchBebidas();
    fetchRecipientes();
  }, [fetchEstadisticas, fetchBebidas, fetchRecipientes]);

  const handleQuickIntake = (amount: number, beverageId: number, containerId: number) => {
    console.log(`Quick intake: ${amount}ml`);
    // El componente QuickIntakeButtons ya maneja el addConsumo
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <Droplets className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar datos
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Hola, {user?.username}! 👋
              </h1>
              <p className="text-gray-600">
                Mantente hidratado y saludable
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                Historial
              </Button>
              <Button variant="primary" size="sm">
                <Target className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress */}
          <div className="lg:col-span-2">
            {estadisticas && (
              <HydrationProgress
                estadisticas={estadisticas}
                className="mb-8"
              />
            )}

            {/* Quick Actions */}
            <Card title="Acciones Rápidas" className="mb-8">
              <QuickIntakeButtons
                bebidas={bebidas}
                recipientes={recipientes}
                onIntake={handleQuickIntake}
              />
            </Card>

            {/* Recent Activity */}
            <Card title="Actividad Reciente" subtitle="Tus últimos consumos">
              <div className="space-y-4">
                {/* This would be populated with recent consumos */}
                <div className="text-center py-8 text-gray-500">
                  <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay actividad reciente</p>
                  <p className="text-sm">Registra tu primer consumo para comenzar</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Stats & Tips */}
          <div className="space-y-6">
            {/* Daily Stats */}
            <Card title="Estadísticas del Día">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Consumos</span>
                  <span className="font-semibold">
                    {estadisticas?.cantidad_consumos || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hidratación Efectiva</span>
                  <span className="font-semibold text-primary-600">
                    {estadisticas?.total_hidratacion_efectiva_ml || 0}ml
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Meta Diaria</span>
                  <span className="font-semibold">
                    {estadisticas?.meta_ml || 0}ml
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Progreso</span>
                  <span className="font-semibold text-primary-600">
                    {Math.round(estadisticas?.progreso_porcentaje || 0)}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card title="💡 Consejos de Hidratación">
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900 mb-1">
                    Bebe agua al despertar
                  </p>
                  <p className="text-blue-700">
                    Un vaso de agua en ayunas activa tu metabolismo
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900 mb-1">
                    Hidrátate antes de sentir sed
                  </p>
                  <p className="text-green-700">
                    La sed es una señal tardía de deshidratación
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-900 mb-1">
                    Frutas y verduras cuentan
                  </p>
                  <p className="text-yellow-700">
                    El 20% de tu hidratación viene de los alimentos
                  </p>
                </div>
              </div>
            </Card>

            {/* Premium Features */}
            {!user?.es_premium && (
              <Card title="🚀 Desbloquea Premium">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Funciones Avanzadas
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Estadísticas detalladas</li>
                    <li>• Recordatorios ilimitados</li>
                    <li>• Sin anuncios</li>
                    <li>• Bebidas premium</li>
                  </ul>
                  <Button variant="primary" size="sm" className="w-full">
                    Actualizar a Premium
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
