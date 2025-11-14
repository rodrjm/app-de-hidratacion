import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { monetizationService } from '@/services/monetization';
import { CheckCircle2, Crown, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Premium: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<{ is_premium: boolean; subscription_end_date?: string } | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [upgrade, setUpgrade] = useState<{ message: string; features: string[] } | null>(null);
  const [noAds, setNoAds] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [st, pf, up, na] = await Promise.all([
          monetizationService.getSubscriptionStatus(),
          monetizationService.getPremiumFeatures(),
          monetizationService.getUpgradePrompt(),
          monetizationService.getNoAdsStatus()
        ]);
        setStatus(st);
        setFeatures(pf.features || []);
        setUpgrade(up);
        setNoAds(!!na.is_premium);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al cargar información de Premium';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleUpgrade = (planType: 'monthly' | 'annual' | 'lifetime') => {
    toast.info(`Funcionalidad de upgrade pendiente de integrar con pasarela de pago. Plan seleccionado: ${planType}`, {
      duration: 4000
    });
  };

  // Si el usuario ya es premium, mostrar estado
  if (status?.is_premium) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card title="Estado de Suscripción">
            {isLoading ? (
              <div className="text-neutral-500">Cargando...</div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-700 font-display font-medium">
                    Usuario Premium activo
                  </p>
                  {status?.subscription_end_date && (
                    <p className="text-sm text-neutral-500">Vence: {new Date(status.subscription_end_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-secondary-500 mr-2" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-700">
              Tomá bien, che! Premium: Precisión y Salud Sin Límites
            </h1>
          </div>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Controlá tu hidratación de manera científica, maximizá tu rendimiento y evitá la deshidratación real.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-6">{error}</div>
        )}

        {/* Funcionalidades Premium */}
        <Card title="Funcionalidades Premium" className="mb-8">
          {isLoading ? (
            <div className="text-neutral-500">Cargando...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-medium text-neutral-700 mb-1">Cálculo Científico (Factor de Hidratación)</h4>
                  <p className="text-sm text-neutral-600">Registrá cervezas, cafés y otras bebidas con la seguridad de saber su impacto real.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-medium text-neutral-700 mb-1">Recordatorios Inteligentes</h4>
                  <p className="text-sm text-neutral-600">Recibí recordatorios basados en tu meta y progreso, con intervalos cortos (30, 45, 60 min).</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-medium text-neutral-700 mb-1">Estadísticas Avanzadas</h4>
                  <p className="text-sm text-neutral-600">Tendencias diarias, semanales y anuales.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-medium text-neutral-700 mb-1">Exportación de Datos</h4>
                  <p className="text-sm text-neutral-600">Descargá tu progreso en CSV para análisis externos.</p>
                </div>
              </div>
              <div className="flex items-start md:col-span-2">
                <CheckCircle2 className="w-5 h-5 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-medium text-neutral-700 mb-1">Experiencia Sin Anuncios</h4>
                  <p className="text-sm text-neutral-600">Disfrutá de una interfaz limpia y fluida.</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Planes de Suscripción */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-neutral-700 text-center mb-6">
            Elegí tu Plan
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plan Mensual */}
            <Card className="relative">
              <div className="text-center">
                <h3 className="text-xl font-display font-bold text-neutral-700 mb-4">Plan Mensual</h3>
                <div className="mb-2">
                  <span className="text-neutral-400 line-through text-lg">$2.000 ARS</span>
                  <div className="text-3xl font-display font-bold text-secondary-500 mt-1">
                    $1.000 ARS
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Solo el primer mes, luego $2.000 ARS</p>
                </div>
                <p className="text-sm text-neutral-600 mb-1">Precio base: $2.000 ARS/mes</p>
                <p className="text-sm text-neutral-500 mb-6">Ahorro / mes: -</p>
                <p className="text-xs text-neutral-500 mb-4">Opción de menor compromiso</p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleUpgrade('monthly')}
                >
                  Suscribirme Ahora
                </Button>
              </div>
            </Card>

            {/* Plan Anual - Más Popular */}
            <Card className="relative border-2 border-secondary-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-secondary-500 text-white px-3 py-1 rounded-full text-xs font-display font-medium flex items-center">
                  <Crown className="w-3 h-3 mr-1" />
                  Opción más popular
                </span>
              </div>
              <div className="text-center pt-4">
                <h3 className="text-xl font-display font-bold text-neutral-700 mb-4">Plan Anual</h3>
                <div className="mb-2">
                  <div className="text-3xl font-display font-bold text-secondary-500 mt-1">
                    $18.000 ARS
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">Precio base: $18.000 ARS/año</p>
                  <p className="text-sm font-display font-medium text-secondary-500 mb-1">Ahorro / mes: $500 ARS/mes</p>
                  <p className="text-xs text-secondary-600 font-medium mb-6">Ahorras 25%</p>
                </div>
                <p className="text-xs text-neutral-500 mb-4">Equivale a $1.500 ARS/mes</p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleUpgrade('annual')}
                >
                  Suscribirme Ahora
                </Button>
              </div>
            </Card>

            {/* Plan De por vida */}
            <Card className="relative">
              <div className="text-center">
                <h3 className="text-xl font-display font-bold text-neutral-700 mb-4">Plan De por vida</h3>
                <div className="mb-2">
                  <div className="text-3xl font-display font-bold text-secondary-500 mt-1">
                    $100.000 ARS
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">Precio base: $100.000 ARS (Pago único)</p>
                  <p className="text-sm font-display font-medium text-secondary-500 mb-1">Ahorro: $14.000 ARS</p>
                  <p className="text-xs text-secondary-600 font-medium mb-6">vs. 5 años</p>
                </div>
                <p className="text-xs text-neutral-500 mb-4">Plan de máximo ahorro</p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleUpgrade('lifetime')}
                >
                  Suscribirme Ahora
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Experiencia sin anuncios */}
        <Card title="Experiencia sin anuncios">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {noAds ? (
                <Ban className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <Ban className="w-5 h-5 text-gray-400 mr-2" />
              )}
              <span className="text-neutral-700">{noAds ? 'Anuncios deshabilitados' : 'Anuncios habilitados (usuario free)'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Premium;
