import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { feedbackService, FeedbackForm } from '@/services/feedback';
import { toast } from 'react-hot-toast';

interface FeedbackModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const TIPO_FEEDBACK_OPTIONS = [
  { value: 'idea_sugerencia', label: 'Idea/Sugerencia' },
  { value: 'reporte_error', label: 'Reporte de Error' },
  { value: 'pregunta_general', label: 'Pregunta General' },
] as const;

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSuccess }) => {
  const [tipo, setTipo] = useState<'idea_sugerencia' | 'reporte_error' | 'pregunta_general'>('idea_sugerencia');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mensaje.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    if (mensaje.trim().length < 10) {
      setError('El mensaje debe tener al menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedback: FeedbackForm = {
        tipo,
        mensaje: mensaje.trim(),
      };

      await feedbackService.createFeedback(feedback);
      toast.success('¡Feedback enviado exitosamente! Gracias por tu aporte.');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar el feedback';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <Card className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="feedback-title" className="text-lg font-display font-bold text-neutral-700">
            Envíanos tu Feedback
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 text-2xl leading-none" aria-label="Cerrar modal">×</button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-2 rounded-md mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-display font-medium text-neutral-700 mb-2" htmlFor="tipo-feedback">
              Tipo de Feedback
            </label>
            <div className="relative">
              <select
                id="tipo-feedback"
                className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 appearance-none bg-white disabled:bg-neutral-50 disabled:cursor-not-allowed"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as FeedbackForm['tipo'])}
                disabled={isSubmitting}
                required
              >
                {TIPO_FEEDBACK_OPTIONS.map((option) => (
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

          <div>
            <label className="block text-sm font-display font-medium text-neutral-700 mb-2">
              Tu Mensaje
            </label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu feedback aquí..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
              rows={6}
              required
              disabled={isSubmitting}
              minLength={10}
            />
            <p className="text-xs text-neutral-500 mt-1">Mínimo 10 caracteres</p>
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
              Enviar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FeedbackModal;

