import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
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
  console.log('HydrationProgress: Received estadisticas:', estadisticas);
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Manejar datos vacíos o undefined
  const {
    total_hidratacion_efectiva_ml = 0,
    meta_ml = 0,
    progreso_porcentaje = 0,
    completada = false,
    cantidad_consumos = 0
  } = estadisticas || {};

  console.log('HydrationProgress: Processed values:', {
    total_hidratacion_efectiva_ml,
    meta_ml,
    progreso_porcentaje,
    completada,
    cantidad_consumos
  });

  // Efecto para mostrar animación cuando se actualiza
  useEffect(() => {
    if (estadisticas) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [estadisticas]);

  const getProgressColor = () => {
    if (completada) return 'chart'; // Verde Menta cuando se completa (Meta Cumplida)
    if (progreso_porcentaje >= 80) return 'secondary'; // Verde Esmeralda cuando está cerca de completar
    if (progreso_porcentaje >= 50) return 'accent'; // Azul Ciel en progreso medio (transición)
    return 'accent'; // Azul Ciel al inicio
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


  return (
    <Card className={`${className} ${isUpdating ? 'ring-2 ring-blue-400 ring-opacity-50' : ''} transition-all duration-500`} padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-neutral-700 mb-2">
            Progreso de hidratación
          </h2>
          <p className="text-neutral-600">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Main Progress - Más visible y central */}
        <div className="space-y-6">
          <ProgressBar
            value={total_hidratacion_efectiva_ml}
            max={meta_ml}
            label="Hidratación efectiva"
            showPercentage={true}
            color={getProgressColor()}
            size="lg"
            animated={isUpdating || !completada}
          />
        </div>

        {/* Completion Badge */}
        {completada && (
          <div className="text-center p-4 bg-chart-100 border border-chart-200 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-chart-600" />
            </div>
          <div className="text-lg font-display font-bold text-chart-800">
              ¡Meta completada!
            </div>
            <div className="text-sm text-chart-600">
              Has alcanzado tu objetivo de hidratación para hoy
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HydrationProgress;
