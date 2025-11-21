import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { sugerenciasService, SugerenciaForm } from '@/services/sugerencias';
import { toast } from 'react-hot-toast';

interface SugerirActividadModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const SugerirActividadModal: React.FC<SugerirActividadModalProps> = ({ onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre de la actividad es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      const sugerencia: SugerenciaForm = {
        tipo: 'actividad',
        nombre: nombre.trim(),
        intensidad_estimada: 'media', // Valor por defecto
      };

      await sugerenciasService.createSugerencia(sugerencia);
      toast.success('¡Sugerencia enviada exitosamente! Gracias por tu aporte.');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar la sugerencia';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="sugerir-actividad-title">
      <Card className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="sugerir-actividad-title" className="text-lg font-display font-bold text-neutral-700">
            Sugerir Nueva Actividad
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 text-2xl leading-none" aria-label="Cerrar modal">×</button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-2 rounded-md mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Nombre de la actividad"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Escalada"
              required
              disabled={isSubmitting}
            />
          </div>

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
              type="submit"
              variant="primary"
              className="flex-1"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Enviar Sugerencia
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SugerirActividadModal;

