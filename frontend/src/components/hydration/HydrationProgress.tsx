import React from 'react';
import { Droplets, Target, TrendingUp } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';
import { EstadisticasDiarias } from '@/types';

interface HydrationProgressProps {
  estadisticas: EstadisticasDiarias;
  className?: string;
}

const HydrationProgress: React.FC<HydrationProgressProps> = ({
  estadisticas,
  className = ''
}) => {
  const {
    total_hidratacion_efectiva_ml,
    meta_ml,
    progreso_porcentaje,
    completada,
    cantidad_consumos
  } = estadisticas;

  const getProgressColor = () => {
    if (completada) return 'success';
    if (progreso_porcentaje >= 80) return 'primary';
    if (progreso_porcentaje >= 50) return 'warning';
    return 'error';
  };

  const getMotivationalMessage = () => {
    if (completada) {
      return "¡Excelente! Has alcanzado tu meta de hidratación 🎉";
    }
    if (progreso_porcentaje >= 80) {
      return "¡Casi lo logras! Solo un poco más 💪";
    }
    if (progreso_porcentaje >= 50) {
      return "Vas por buen camino, sigue así! 🌟";
    }
    return "¡Vamos! Tu cuerpo necesita hidratación 💧";
  };

  const getRemainingAmount = () => {
    const remaining = meta_ml - total_hidratacion_efectiva_ml;
    return Math.max(0, remaining);
  };

  return (
    <Card className={`${className}`} padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Progreso de Hidratación
          </h2>
          <p className="text-gray-600">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Main Progress */}
        <div className="space-y-4">
          <ProgressBar
            value={total_hidratacion_efectiva_ml}
            max={meta_ml}
            label="Hidratación Efectiva"
            showPercentage={true}
            color={getProgressColor()}
            size="lg"
            animated={!completada}
          />
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Droplets className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {total_hidratacion_efectiva_ml}ml
              </div>
              <div className="text-sm text-blue-500">
                Consumido
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {meta_ml}ml
              </div>
              <div className="text-sm text-green-500">
                Meta Diaria
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {cantidad_consumos}
            </div>
            <div className="text-sm text-gray-500">
              Consumos Hoy
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {getRemainingAmount()}ml
            </div>
            <div className="text-sm text-gray-500">
              Restante
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {Math.round(progreso_porcentaje)}%
            </div>
            <div className="text-sm text-gray-500">
              Progreso
            </div>
          </div>
        </div>

        {/* Completion Badge */}
        {completada && (
          <div className="text-center p-4 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-lg font-semibold text-green-800">
              ¡Meta Completada!
            </div>
            <div className="text-sm text-green-600">
              Has alcanzado tu objetivo de hidratación para hoy
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HydrationProgress;
