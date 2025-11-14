import React from 'react';
import { Actividad } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Edit, Trash2, Activity } from 'lucide-react';

interface ActividadesListProps {
  actividades: Actividad[];
  onEdit: (actividad: Actividad) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

const TIPO_ACTIVIDAD_LABELS: Record<string, string> = {
  correr: 'Correr',
  ciclismo: 'Ciclismo',
  natacion: 'Natación',
  futbol_rugby: 'Fútbol / Rugby',
  baloncesto_voley: 'Baloncesto / Vóley',
  gimnasio: 'Gimnasio',
  crossfit_hiit: 'CrossFit / Entrenamiento HIIT',
  padel_tenis: 'Pádel / Tenis',
  baile_aerobico: 'Baile aeróbico',
  caminata_rapida: 'Caminata rápida',
  pilates: 'Pilates',
  caminata: 'Caminata',
  yoga_hatha: 'Yoga (Hatha/Suave)',
  yoga_bikram: 'Yoga (Bikram/Caliente)',
};

const INTENSIDAD_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

const INTENSIDAD_COLORS: Record<string, string> = {
  baja: 'bg-secondary-100 text-secondary-800',
  media: 'bg-accent-100 text-accent-800',
  alta: 'bg-error-100 text-error-800',
};

const ActividadesList: React.FC<ActividadesListProps> = ({ actividades, onEdit, onDelete, isLoading }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <Card title="Actividades Recientes" subtitle="Tus últimas actividades">
        <div className="text-center py-8 text-neutral-500">Cargando actividades...</div>
      </Card>
    );
  }

  if (actividades.length === 0) {
    return (
      <Card title="Actividades Recientes" subtitle="Tus últimas actividades">
        <div className="text-center py-8 text-neutral-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay actividades registradas hoy</p>
          <p className="text-sm">Registra tu primera actividad para comenzar</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Actividades Recientes" subtitle="Tus últimas actividades">
      <div className="space-y-3">
        {actividades.slice(0, 3).map((actividad) => (
          <div
            key={actividad.id}
            className="flex items-center justify-between p-3 border-b border-neutral-100 last:border-0"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-medium text-neutral-600">
                  {TIPO_ACTIVIDAD_LABELS[actividad.tipo_actividad] || actividad.tipo_actividad}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-display font-medium ${INTENSIDAD_COLORS[actividad.intensidad] || 'bg-neutral-100 text-neutral-800'}`}>
                  {INTENSIDAD_LABELS[actividad.intensidad] || actividad.intensidad}
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                <span>{actividad.duracion_minutos} min</span>
                <span className="mx-2">•</span>
                <span>{formatTime(actividad.fecha_hora)}</span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(actividad)}
                className="p-2 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                aria-label="Editar actividad"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(actividad.id)}
                className="p-2 text-neutral-500 hover:text-error hover:bg-error-50 rounded-lg transition-colors"
                aria-label="Eliminar actividad"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ActividadesList;

