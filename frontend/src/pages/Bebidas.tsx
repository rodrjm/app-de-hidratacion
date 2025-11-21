import React, { useEffect, useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useConsumosStore } from '@/store/consumosStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';
import SugerirBebidaModal from '@/components/suggestions/SugerirBebidaModal';
import { bebidasService } from '@/services/consumos';
import { Bebida } from '@/types';
import { getClasificacionHidrica } from '@/utils/hydrationClassification';

const Bebidas: React.FC = () => {
  const { bebidas, fetchBebidas, fetchBebidasPremium } = useConsumosStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showSugerirModal, setShowSugerirModal] = useState(false);
  const [bebidasPremiumPreview, setBebidasPremiumPreview] = useState<Bebida[]>([]);
  const [isLoadingPremium, setIsLoadingPremium] = useState(false);

  useEffect(() => {
    if (user?.es_premium) {
      // Si es premium, solo cargar desde el endpoint premium que incluye todas las bebidas
      fetchBebidasPremium();
    } else {
      // Si no es premium, cargar bebidas gratuitas y algunas premium para preview
      fetchBebidas();
      // Cargar algunas bebidas premium para mostrar como preview
      setIsLoadingPremium(true);
      bebidasService.getBebidas({ es_premium: true, activa: true })
        .then(response => {
          // Tomar solo las primeras 3 bebidas premium
          const preview = response.results.slice(0, 3);
          setBebidasPremiumPreview(preview);
        })
        .catch(error => {
          console.error('Error al cargar bebidas premium preview:', error);
        })
        .finally(() => {
          setIsLoadingPremium(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.es_premium]);

  // Separar bebidas gratuitas y premium
  const { bebidasGratuitas, bebidasPremium } = useMemo(() => {
    if (user?.es_premium) {
      // Para premium, todas las bebidas se muestran normalmente
      return { bebidasGratuitas: bebidas.filter(b => !b.es_premium), bebidasPremium: bebidas.filter(b => b.es_premium) };
    } else {
      // Para gratuitos, separar gratuitas y mostrar preview de premium
      return { 
        bebidasGratuitas: bebidas.filter(b => !b.es_premium), 
        bebidasPremium: bebidasPremiumPreview 
      };
    }
  }, [bebidas, bebidasPremiumPreview, user?.es_premium]);

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-700">Catálogo de Bebidas</h1>
            <p className="text-sm text-neutral-600">Consulta todas las bebidas disponibles y distingue cuáles son premium.</p>
          </div>
        </div>
        <Card>
          <div>
            <div className="mb-2 text-xs text-neutral-500 font-display font-bold">
              <span>Bebida</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {/* Bebidas Gratuitas */}
              {bebidasGratuitas.length === 0 && bebidasPremium.length === 0 && (
                <div className="p-6 text-center text-neutral-400">No hay bebidas configuradas.</div>
              )}
              {bebidasGratuitas.map(b => {
                const clasificacion = getClasificacionHidrica(b.factor_hidratacion);
                return (
                  <div key={b.id} className="py-3 px-1 flex items-center">
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-3 flex-shrink-0" 
                      style={{ backgroundColor: clasificacion.color }}
                      title={`Clasificación: ${clasificacion.nombre} - ${clasificacion.mensaje}`}
                      aria-label={`Clasificación hídrica: ${clasificacion.nombre}`}
                    />
                    <span className="font-display font-medium text-neutral-700 flex items-center">
                      {b.nombre}
                    </span>
                  </div>
                );
              })}

              {/* Separador entre gratuitas y premium (solo para usuarios gratuitos) */}
              {!user?.es_premium && bebidasGratuitas.length > 0 && bebidasPremium.length > 0 && (
                <div className="py-2 border-t-2 border-neutral-200"></div>
              )}

              {/* Bebidas Premium */}
              {user?.es_premium ? (
                // Para usuarios premium: mostrar todas las premium normalmente
                bebidasPremium.map(b => {
                  const clasificacion = getClasificacionHidrica(b.factor_hidratacion);
                  return (
                    <div key={b.id} className="py-3 px-1 flex items-center">
                      <span 
                        className="inline-block w-3 h-3 rounded-full mr-3 flex-shrink-0" 
                        style={{ backgroundColor: clasificacion.color }}
                        title={`Clasificación: ${clasificacion.nombre} - ${clasificacion.mensaje}`}
                        aria-label={`Clasificación hídrica: ${clasificacion.nombre}`}
                      />
                      <span className="font-display font-medium text-neutral-700 flex items-center">
                        {b.nombre}
                        <span className="inline-flex items-center text-xs ml-2 px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full">
                          <Crown className="w-3 h-3 mr-1"/>Premium
                        </span>
                      </span>
                    </div>
                  );
                })
              ) : (
                // Para usuarios gratuitos: mostrar máximo 3 premium difuminadas
                bebidasPremium.slice(0, 3).map(b => {
                  const clasificacion = getClasificacionHidrica(b.factor_hidratacion);
                  return (
                    <div key={b.id} className="py-3 px-1 flex items-center relative opacity-50">
                      <div className="absolute inset-0 bg-white bg-opacity-60 rounded z-10"></div>
                      <span 
                        className="inline-block w-3 h-3 rounded-full mr-3 flex-shrink-0 relative z-0" 
                        style={{ backgroundColor: clasificacion.color }}
                        title={`Clasificación: ${clasificacion.nombre} - ${clasificacion.mensaje}`}
                        aria-label={`Clasificación hídrica: ${clasificacion.nombre}`}
                      />
                      <span className="font-display font-medium text-neutral-500 flex items-center relative z-0">
                        {b.nombre}
                        <span className="inline-flex items-center text-xs ml-2 px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full">
                          <Lock className="w-3 h-3 mr-1"/>Premium
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mensaje motivacional para usuarios gratuitos */}
            {!user?.es_premium && bebidasPremium.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="bg-accent-50 border border-accent-100 rounded-lg p-4 text-center">
                  <Crown className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
                  <h4 className="font-display font-bold text-neutral-700 mb-1">
                    Desbloquea más bebidas con Premium
                  </h4>
                  <p className="text-sm text-neutral-600 mb-3">
                    Accede a todas las bebidas premium y disfruta de funcionalidades exclusivas
                  </p>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => navigate('/premium')}
                  >
                    Ver Premium
                  </Button>
                </div>
              </div>
            )}
            
            {/* Sugerencia de Bebidas - Solo para usuarios premium */}
            {user?.es_premium && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="text-center py-3">
                  <p className="text-sm text-neutral-600 mb-2">¿Falta alguna bebida en nuestro catálogo?</p>
                  <button
                    onClick={() => setShowSugerirModal(true)}
                    className="text-accent-500 hover:text-accent-600 font-display font-bold text-sm transition-colors"
                  >
                    Sugiere una bebida aquí
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {showSugerirModal && (
        <SugerirBebidaModal
          onClose={() => setShowSugerirModal(false)}
        />
      )}
    </div>
  );
};

export default Bebidas;
