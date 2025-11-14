import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { sugerenciasService, SugerenciaForm } from '@/services/sugerencias';
import { toast } from 'react-hot-toast';

interface SugerirBebidaModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const SugerirBebidaModal: React.FC<SugerirBebidaModalProps> = ({ onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre de la bebida es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      const sugerencia: SugerenciaForm = {
        tipo: 'bebida',
        nombre: nombre.trim(),
        comentarios: comentarios.trim() || undefined,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="sugerir-bebida-title">
      <Card className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="sugerir-bebida-title" className="text-lg font-display font-bold text-neutral-700">
            Sugerir Nueva Bebida
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 text-2xl leading-none" aria-label="Cerrar modal">×</button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-2 rounded-md mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Nombre de la bebida"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Agua de coco"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-display font-medium text-neutral-700 mb-2">
              Comentarios/Ingredientes (Opcional)
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Ingredientes o información adicional sobre la bebida..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
              rows={4}
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
              variant="secondary"
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

export default SugerirBebidaModal;

