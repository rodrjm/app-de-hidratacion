import React, { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ActividadForm } from '@/types';
import SugerirActividadModal from '@/components/suggestions/SugerirActividadModal';
import { useAuthStore } from '@/store/authStore';

interface AddActividadModalProps {
  onSubmit: (data: ActividadForm) => Promise<void> | void;
  onClose: () => void;
  actividadEditar?: { id: number; data: ActividadForm };
}

// Opciones de actividades ordenadas alfabéticamente por nombre
const TIPO_ACTIVIDAD_OPTIONS = [
  { value: 'baile_aerobico', label: 'Baile aeróbico' },
  { value: 'baloncesto_voley', label: 'Baloncesto / Vóley' },
  { value: 'caminata', label: 'Caminata' },
  { value: 'caminata_rapida', label: 'Caminata rápida' },
  { value: 'ciclismo', label: 'Ciclismo' },
  { value: 'correr', label: 'Correr' },
  { value: 'crossfit_hiit', label: 'CrossFit / Entrenamiento HIIT' },
  { value: 'futbol_rugby', label: 'Fútbol / Rugby' },
  { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'natacion', label: 'Natación' },
  { value: 'padel_tenis', label: 'Pádel / Tenis' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'yoga_bikram', label: 'Yoga (Bikram/Caliente)' },
  { value: 'yoga_hatha', label: 'Yoga (Hatha/Suave)' },
] as const;

const INTENSIDAD_OPTIONS = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
] as const;

const AddActividadModal: React.FC<AddActividadModalProps> = ({ onSubmit, onClose, actividadEditar }) => {
  const { user } = useAuthStore();
  // Estados separados para tipo de actividad e intensidad
  const [tipoActividad, setTipoActividad] = useState<string>(
    actividadEditar?.data.tipo_actividad || 'caminata'  // Por defecto: "Caminata"
  );
  const [intensidad, setIntensidad] = useState<string>(
    actividadEditar?.data.intensidad || 'media'
  );
  const [duracionMinutos, setDuracionMinutos] = useState<number>(
    actividadEditar?.data.duracion_minutos || 30
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSugerirModal, setShowSugerirModal] = useState(false);

  // Calcular PSE estimado en tiempo real
  const pseEstimado = useMemo(() => {
    const tsBaseMap: Record<string, number> = {
      'correr': 20.0,
      'ciclismo': 18.3,
      'natacion': 13.3,
      'futbol_rugby': 23.3,
      'baloncesto_voley': 20.0,
      'gimnasio': 13.3,
      'crossfit_hiit': 25.0,
      'padel_tenis': 16.7,
      'baile_aerobico': 15.0,
      'caminata_rapida': 8.3,
      'pilates': 6.7,
      'caminata': 4.2,
      'yoga_hatha': 5.0,
      'yoga_bikram': 25.0,
    };
    const factorIntensidadMap: Record<string, number> = {
      'baja': 0.8,
      'media': 1.0,
      'alta': 1.2,
    };
    const tsBase = tsBaseMap[tipoActividad] || 13.3;
    const factorIntensidad = factorIntensidadMap[intensidad] || 1.0;
    return Math.round(duracionMinutos * tsBase * factorIntensidad);
  }, [tipoActividad, intensidad, duracionMinutos]);

  const validate = () => {
    if (!tipoActividad) return 'Selecciona un tipo de actividad';
    if (!duracionMinutos || duracionMinutos < 1) return 'La duración debe ser al menos 1 minuto';
    if (duracionMinutos > 1440) return 'La duración no puede ser mayor a 1440 minutos (24 horas)';
    if (!intensidad) return 'Selecciona una intensidad';
    return null;
  };

  const handleConfirm = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ 
        tipo_actividad: tipoActividad as ActividadForm['tipo_actividad'],
        duracion_minutos: duracionMinutos,
        intensidad: intensidad as ActividadForm['intensidad']
      });
      // El toast se mostrará desde el componente padre (Dashboard)
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al registrar actividad';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-actividad-title">
      <Card className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="add-actividad-title" className="text-lg font-display font-bold text-neutral-700">
            {actividadEditar ? 'Editar Actividad' : 'Registrar Actividad Física'}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 text-2xl leading-none" aria-label="Cerrar modal">×</button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-2 rounded-md mb-3 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {/* Tipo de Actividad */}
          <div>
            <label className="block text-sm font-display font-medium text-neutral-700 mb-2" htmlFor="tipo-actividad">
              Tipo de actividad
            </label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 appearance-none bg-white"
                id="tipo-actividad"
                value={tipoActividad}
                onChange={(e) => setTipoActividad(e.target.value)}
              >
                {TIPO_ACTIVIDAD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Sugerencia de Actividad - Solo para usuarios premium */}
            {user?.es_premium && (
              <div className="mt-2 text-right">
                <p className="text-xs text-neutral-500" style={{ margin: 0 }}>
                  ¿No encuentras tu actividad?{' '}
                  <button
                    type="button"
                    onClick={() => setShowSugerirModal(true)}
                    className="text-accent-500 hover:text-accent-600 font-display font-medium text-xs transition-colors"
                  >
                    Sugerir
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Intensidad */}
          <div>
            <label className="block text-sm font-display font-medium text-neutral-700 mb-2" htmlFor="intensidad">
              Intensidad
            </label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 appearance-none bg-white"
                id="intensidad"
                value={intensidad}
                onChange={(e) => setIntensidad(e.target.value)}
              >
                {INTENSIDAD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Duración con Input Numérico y Spinner */}
          <div>
            <label className="block text-sm font-display font-medium text-neutral-700 mb-2" htmlFor="duracion-input">
              Duración (minutos)
            </label>
            <div className="relative">
              <input
                type="number"
                id="duracion-input"
                min="1"
                max="1440"
                step="1"
                value={duracionMinutos}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (value >= 1 && value <= 1440) {
                    setDuracionMinutos(value);
                  }
                }}
                className="w-full px-3 py-2 pr-16 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                <button
                  type="button"
                  onClick={() => setDuracionMinutos(Math.min(1440, duracionMinutos + 1))}
                  className="w-6 h-4 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-t border border-neutral-300"
                  aria-label="Aumentar duración"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => setDuracionMinutos(Math.max(1, duracionMinutos - 1))}
                  className="w-6 h-4 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-b border border-neutral-300 border-t-0"
                  aria-label="Disminuir duración"
                >
                  ↓
                </button>
              </div>
            </div>
            {duracionMinutos < 1 || duracionMinutos > 1440 ? (
              <p className="text-xs text-error-600 mt-1">La duración debe estar entre 1 y 1440 minutos</p>
            ) : null}
          </div>

          {/* Mostrar Ajuste Estimado de Meta - Visible y Claro */}
          {tipoActividad && duracionMinutos && intensidad && (
            <div 
              className="p-4 rounded-lg text-center bg-accent-50 border border-accent-100"
            >
              <p className="text-sm font-display font-medium mb-2 text-accent-700" style={{ margin: 0 }}>
                Ajuste estimado de meta:
              </p>
              <p 
                className="font-display font-bold text-accent-600"
                style={{ 
                  fontSize: '1.2em', 
                  fontWeight: 'bold', 
                  margin: '5px 0',
                }}
              >
                +{pseEstimado} ml
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="flex-1"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {actividadEditar ? 'Guardar' : 'Registrar'}
            </Button>
          </div>
        </div>
      </Card>
      
      {showSugerirModal && (
        <SugerirActividadModal
          onClose={() => setShowSugerirModal(false)}
        />
      )}
    </div>
  );
};

export default AddActividadModal;

