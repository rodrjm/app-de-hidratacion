import React, { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Bebida, Recipiente } from '@/types';
import { getClasificacionHidrica } from '@/utils/hydrationClassification';
import SugerirBebidaModal from '@/components/suggestions/SugerirBebidaModal';
import { useAuthStore } from '@/store/authStore';

interface AddConsumoModalProps {
  bebidas: Bebida[];
  recipientes: Recipiente[];
  isPremium: boolean;
  onSubmit: (data: { bebida: number; recipiente: number | null; cantidad_ml: number }) => Promise<void> | void;
  onClose: () => void;
  consumoEditar?: { id: number; bebida: number; recipiente: number | null; cantidad_ml: number };
}

type CantidadMode = 'recipiente' | 'personalizada';

const AddConsumoModal: React.FC<AddConsumoModalProps> = ({ bebidas, recipientes, isPremium, onSubmit, onClose, consumoEditar }) => {
  const { user } = useAuthStore();
  const [bebidaId, setBebidaId] = useState<number>(() => 
    consumoEditar?.bebida || bebidas.find(b => b.es_agua)?.id || bebidas[0]?.id
  );
  const [cantidadMode, setCantidadMode] = useState<CantidadMode>(() => 
    consumoEditar?.recipiente ? 'recipiente' : 'personalizada'
  );
  const [recipienteId, setRecipienteId] = useState<number | null>(() => 
    consumoEditar?.recipiente || recipientes[0]?.id || null
  );
  const [cantidadPersonalizada, setCantidadPersonalizada] = useState<number>(() => 
    consumoEditar?.cantidad_ml || 250
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSugerirModal, setShowSugerirModal] = useState(false);

  const bebidaOptions = useMemo(() => bebidas, [bebidas]);
  const recipienteOptions = useMemo(() => recipientes, [recipientes]);

  // Calcular cantidad según el modo seleccionado
  const cantidad = cantidadMode === 'recipiente' && recipienteId
    ? recipientes.find(r => r.id === recipienteId)?.cantidad_ml || 250
    : cantidadPersonalizada;

  // Calcular hidratación efectiva en tiempo real
  const bebidaSeleccionada = bebidas.find(b => b.id === bebidaId);
  const hidratacionEfectiva = bebidaSeleccionada 
    ? Math.round(cantidad * bebidaSeleccionada.factor_hidratacion)
    : cantidad;

  const validate = () => {
    if (!bebidaId) return 'Selecciona una bebida';
    if (cantidadMode === 'recipiente' && !recipienteId) return 'Selecciona un recipiente';
    if (cantidadMode === 'personalizada' && (!cantidadPersonalizada || cantidadPersonalizada <= 0)) {
      return 'La cantidad debe ser mayor a 0';
    }
    return null;
  };

  const handleConfirm = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ 
        bebida: bebidaId!, 
        recipiente: cantidadMode === 'recipiente' ? recipienteId : null, 
        cantidad_ml: cantidad 
      });
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al registrar consumo';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar cantidad cuando cambia el recipiente
  const handleRecipienteChange = (newRecipienteId: number | null) => {
    setRecipienteId(newRecipienteId);
    if (newRecipienteId && cantidadMode === 'recipiente') {
      const recipiente = recipientes.find(r => r.id === newRecipienteId);
      if (recipiente) {
        setCantidadPersonalizada(recipiente.cantidad_ml);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-consumo-title">
      <Card className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="add-consumo-title" className="text-lg font-display font-bold text-neutral-700">
            {consumoEditar ? 'Editar Consumo' : 'Registrar Consumo'}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 text-2xl leading-none" aria-label="Cerrar modal">×</button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-2 rounded-md mb-3 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {/* Selector de Bebida - Movido a la parte superior */}
          <div>
            <label className="block text-sm font-display font-medium text-neutral-700 mb-2" htmlFor="select-bebida">
              Bebida
              {!isPremium && bebidaOptions.some(b => b.es_premium) && (
                <span className="ml-2 text-xs text-neutral-500">(Algunas bebidas requieren Premium)</span>
              )}
            </label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 appearance-none bg-white"
                id="select-bebida"
                value={bebidaId}
                onChange={(e) => setBebidaId(Number(e.target.value))}
              >
                {bebidaOptions.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.es_premium && !isPremium}>
                    {b.nombre}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Sugerencia de Bebida - Solo para usuarios premium */}
            {user?.es_premium && (
              <div className="mt-2 text-right">
                <p className="text-xs text-neutral-500" style={{ margin: 0 }}>
                  ¿No encuentras tu bebida?{' '}
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

          {/* Selector de Cantidad */}
          <div>
            <p className="block text-sm font-display font-medium text-neutral-700 mb-2">Cantidad</p>
            
            {/* Radio buttons para elegir modo */}
            <div className="flex space-x-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cantidadMode"
                  value="recipiente"
                  checked={cantidadMode === 'recipiente'}
                  onChange={(e) => setCantidadMode(e.target.value as CantidadMode)}
                  className="mr-2"
                />
                <span className="text-sm text-neutral-700">Por recipiente</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cantidadMode"
                  value="personalizada"
                  checked={cantidadMode === 'personalizada'}
                  onChange={(e) => setCantidadMode(e.target.value as CantidadMode)}
                  className="mr-2"
                />
                <span className="text-sm text-neutral-700">Cantidad personalizada</span>
              </label>
            </div>

            {/* Selector de recipiente o input personalizado */}
            {cantidadMode === 'recipiente' ? (
              <div className="relative">
                <select
                  className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 appearance-none bg-white"
                  value={recipienteId ?? ''}
                  onChange={(e) => handleRecipienteChange(e.target.value ? Number(e.target.value) : null)}
                  aria-label="Seleccionar recipiente"
                >
                  <option value="">Selecciona un recipiente</option>
                  {recipienteOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.cantidad_ml} ml)
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-display font-medium text-neutral-700 mb-2" htmlFor="cantidad-input">
                  Cantidad (ml)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="cantidad-input"
                    min="1"
                    max="5000"
                    step="1"
                    value={cantidadPersonalizada}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (value >= 1 && value <= 5000) {
                        setCantidadPersonalizada(value);
                      }
                    }}
                    placeholder="250"
                    className="w-full px-3 py-2 pr-16 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                    <button
                      type="button"
                      onClick={() => setCantidadPersonalizada(Math.min(5000, cantidadPersonalizada + 1))}
                      className="w-6 h-4 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-t border border-neutral-300"
                      aria-label="Aumentar cantidad"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => setCantidadPersonalizada(Math.max(1, cantidadPersonalizada - 1))}
                      className="w-6 h-4 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-b border border-neutral-300 border-t-0"
                      aria-label="Disminuir cantidad"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Clasificación Hídrica Visual */}
            {bebidaSeleccionada && (
              <div className="mt-3">
                {(() => {
                  const clasificacion = getClasificacionHidrica(bebidaSeleccionada.factor_hidratacion);
                  // Convertir hex a rgba para el fondo y borde
                  const hexToRgba = (hex: string, alpha: number) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                  };
                  return (
                    <div 
                      className="flex items-center gap-2 p-3 rounded-lg" 
                      style={{ 
                        backgroundColor: hexToRgba(clasificacion.color, 0.1), 
                        border: `1px solid ${hexToRgba(clasificacion.color, 0.3)}` 
                      }}
                    >
                      <span className="text-lg">{clasificacion.simbolo}</span>
                      <div className="flex-1">
                        <p className="text-sm font-display font-bold" style={{ color: clasificacion.color, margin: 0 }}>
                          Clasificación: {clasificacion.nombre}
                        </p>
                        <p className="text-xs text-neutral-600 mt-0.5" style={{ margin: 0 }}>
                          {clasificacion.mensaje}
                          {clasificacion.nivel === 5 && ' Ten en cuenta la compensación extra.'}
                          {clasificacion.nivel === 1 && ' ¡Excelente! Alto impacto positivo.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Mostrar cantidad y hidratación efectiva */}
            <div className="mt-3 p-4 rounded-lg bg-secondary-50 border border-secondary-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-neutral-600">Total:</span>
                <span className="text-sm font-display font-bold text-neutral-700">{cantidad} ml</span>
              </div>
              <div className="text-center mt-3">
                <p className="text-sm font-display font-medium mb-2 text-secondary-700" style={{ margin: 0 }}>
                  Hidratación Efectiva:
                </p>
                <p 
                  className="font-display font-bold text-secondary-600"
                  style={{ 
                    fontSize: '1.2em', 
                    fontWeight: 'bold', 
                    margin: '5px 0',
                  }}
                >
                  {hidratacionEfectiva} ml
                </p>
              </div>
            </div>
          </div>
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
            variant="secondary"
            onClick={handleConfirm}
            className="flex-1"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {consumoEditar ? 'Guardar' : 'Registrar'}
          </Button>
        </div>
      </Card>
      
      {showSugerirModal && (
        <SugerirBebidaModal
          onClose={() => setShowSugerirModal(false)}
        />
      )}
    </div>
  );
};

export default AddConsumoModal;
