import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, BarChart3, PieChart, Download } from 'lucide-react';
import { useConsumosStore } from '@/store/consumosStore';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const Statistics: React.FC = () => {
  const { user } = useAuthStore();
  const {
    estadisticas,
    tendencias,
    insights,
    isLoading,
    error,
    fetchEstadisticas,
    fetchTendencias,
    fetchInsights
  } = useConsumosStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchEstadisticas();
    fetchTendencias('weekly');
    fetchInsights(30);
  }, [fetchEstadisticas, fetchTendencias, fetchInsights]);

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
    fetchTendencias(period);
  };

  const handleExportData = () => {
    // Implementar exportación de datos
    console.log('Exporting data...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar estadísticas
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
                Estadísticas Detalladas
              </h1>
              <p className="text-gray-600">
                Analiza tus patrones de hidratación
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="primary" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Personalizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'daily', label: 'Diario', icon: Calendar },
              { key: 'weekly', label: 'Semanal', icon: TrendingUp },
              { key: 'monthly', label: 'Mensual', icon: BarChart3 }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handlePeriodChange(key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  selectedPeriod === key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Consumido */}
          <Card className="text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {estadisticas?.total_hidratacion_efectiva_ml || 0}ml
              </h3>
              <p className="text-gray-600">Total Consumido</p>
            </div>
          </Card>

          {/* Meta Diaria */}
          <Card className="text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {estadisticas?.meta_ml || 0}ml
              </h3>
              <p className="text-gray-600">Meta Diaria</p>
            </div>
          </Card>

          {/* Progreso */}
          <Card className="text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {Math.round(estadisticas?.progreso_porcentaje || 0)}%
              </h3>
              <p className="text-gray-600">Progreso</p>
            </div>
          </Card>

          {/* Consumos */}
          <Card className="text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {estadisticas?.cantidad_consumos || 0}
              </h3>
              <p className="text-gray-600">Consumos Hoy</p>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Progress Chart */}
          <Card title="Progreso Diario" subtitle="Tu hidratación a lo largo del día">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Gráfico de progreso diario</p>
                <p className="text-sm text-gray-400">
                  {user?.es_premium ? 'Funcionalidad premium' : 'Actualiza a Premium para ver gráficos detallados'}
                </p>
              </div>
            </div>
          </Card>

          {/* Weekly Trends */}
          <Card title="Tendencias Semanales" subtitle="Comparación con semanas anteriores">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Gráfico de tendencias</p>
                <p className="text-sm text-gray-400">
                  {user?.es_premium ? 'Funcionalidad premium' : 'Actualiza a Premium para ver tendencias'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Insights Section */}
        {user?.es_premium && insights && (
          <Card title="💡 Insights Personalizados" subtitle="Análisis inteligente de tus patrones">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Bebida Favorita</h4>
                  <p className="text-blue-700">{insights.most_consumed_beverage || 'Agua'}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Hora Pico</h4>
                  <p className="text-green-700">{insights.peak_hydration_hour || '10:00-11:00'}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Recomendación</h4>
                  <p className="text-yellow-700 text-sm">{insights.recommendation || 'Continúa con tus buenos hábitos'}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Premium Upgrade Prompt */}
        {!user?.es_premium && (
          <Card title="🚀 Desbloquea Estadísticas Avanzadas" className="mt-8">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Estadísticas Premium
              </h3>
              <p className="text-gray-600 mb-6">
                Accede a gráficos detallados, tendencias avanzadas e insights personalizados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-600">Gráficos detallados</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <PieChart className="w-4 h-4 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-600">Análisis de patrones</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-4 h-4 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-600">Historial completo</p>
                </div>
              </div>
              <Button variant="primary" size="lg">
                Actualizar a Premium
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Statistics;
