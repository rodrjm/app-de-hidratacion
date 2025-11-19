import React, { memo, useMemo } from 'react';
import { Droplets, Activity, Edit, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import { Actividad, Consumo } from '@/types';

interface DashboardRecentHistoryProps {
  consumos: Consumo[];
  actividadesHoy: Actividad[];
  onEditConsumo: (consumo: Consumo) => void;
  onDeleteConsumo: (id: number) => void;
  onEditActividad: (actividad: Actividad) => void;
  onDeleteActividad: (id: number) => void;
  onAddConsumo: () => void;
  onAddActividad: () => void;
}

// Labels para actividades
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

// Función helper para calcular PSE
const calcularPSE = (actividad: Actividad): number => {
  const tsBaseMap: Record<string, number> = {
    'correr': 20.0, 'ciclismo': 18.3, 'natacion': 13.3, 'futbol_rugby': 23.3,
    'baloncesto_voley': 20.0, 'gimnasio': 13.3, 'crossfit_hiit': 25.0,
    'padel_tenis': 16.7, 'baile_aerobico': 15.0, 'caminata_rapida': 8.3,
    'pilates': 6.7, 'caminata': 4.2, 'yoga_hatha': 5.0, 'yoga_bikram': 25.0,
  };
  const factorIntensidadMap: Record<string, number> = {
    'baja': 0.8, 'media': 1.0, 'alta': 1.2,
  };
  const tsBase = tsBaseMap[actividad.tipo_actividad] || 13.3;
  const factorIntensidad = factorIntensidadMap[actividad.intensidad] || 1.0;
  return Math.round(actividad.duracion_minutos * tsBase * factorIntensidad);
};

// Función helper para obtener la fecha local de una fecha ISO
const obtenerFechaLocal = (fechaISO: string): string => {
  const fecha = new Date(fechaISO);
  const año = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
};

const DashboardRecentHistory: React.FC<DashboardRecentHistoryProps> = memo(({
  consumos,
  actividadesHoy,
  onEditConsumo,
  onDeleteConsumo,
  onEditActividad,
  onDeleteActividad,
  onAddConsumo,
  onAddActividad,
}) => {
  // Obtener fecha de hoy en formato YYYY-MM-DD (en zona horaria local)
  const hoyStr = useMemo(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtrar consumos y actividades del día actual
  const consumosHoy = useMemo(() => {
    return (consumos || []).filter(c => {
      const fechaConsumo = obtenerFechaLocal(c.fecha_hora);
      return fechaConsumo === hoyStr;
    });
  }, [consumos, hoyStr]);

  const actividadesHoyFiltradas = useMemo(() => {
    return (actividadesHoy || []).filter(a => {
      const fechaActividad = obtenerFechaLocal(a.fecha_hora);
      return fechaActividad === hoyStr;
    });
  }, [actividadesHoy, hoyStr]);

  // Combinar consumos y actividades en un solo array
  const historialReciente = useMemo(() => {
    const items: Array<{
      id: string;
      tipo: 'consumo' | 'actividad';
      fecha_hora: string;
      data: Consumo | Actividad;
    }> = [
      ...consumosHoy.map(c => ({
        id: `consumo-${c.id}`,
        tipo: 'consumo' as const,
        fecha_hora: c.fecha_hora,
        data: c,
      })),
      ...actividadesHoyFiltradas.map(a => ({
        id: `actividad-${a.id}`,
        tipo: 'actividad' as const,
        fecha_hora: a.fecha_hora,
        data: a,
      })),
    ];

    // Ordenar por fecha/hora (más reciente primero)
    items.sort((a, b) => 
      new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
    );

    return items.slice(0, 5);
  }, [consumosHoy, actividadesHoyFiltradas]);

  if (historialReciente.length === 0) {
    return (
      <Card title="📋 Historial Reciente">
        <div className="text-center py-8">
          <div className="mb-4">
            <Droplets className="w-16 h-16 mx-auto text-neutral-300 mb-3" />
            <Activity className="w-16 h-16 mx-auto text-neutral-300" />
          </div>
          <h3 className="font-display font-bold text-neutral-700 mb-2">
            ¡Comienza tu día hidratado! 💧
          </h3>
          <p className="text-neutral-600 mb-4">
            Aún no has registrado consumos o actividades hoy
          </p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <button
              onClick={onAddConsumo}
              className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-display font-bold transition-colors"
            >
              Registrar Consumo
            </button>
            <button
              onClick={onAddActividad}
              className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-display font-bold transition-colors"
            >
              Registrar Actividad
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="📋 Historial Reciente">
      <div className="space-y-0">
        {historialReciente.map((item) => {
          const esConsumo = item.tipo === 'consumo';
          const consumo = esConsumo ? (item.data as Consumo) : null;
          const actividad = !esConsumo ? (item.data as Actividad) : null;

          if (esConsumo && consumo) {
            const bebidaNombre = typeof consumo.bebida === 'object' 
              ? consumo.bebida.nombre 
              : 'Bebida';
            const fechaHora = new Date(consumo.fecha_hora);
            const hora = fechaHora.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });

            return (
              <div
                key={item.id}
                className="py-3 pl-3 border-l-4 border-secondary-500 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-display font-medium text-neutral-700">
                    <span className="font-display font-bold text-secondary-600">{bebidaNombre}</span>
                    {': '}
                    {consumo.cantidad_ml}ml
                    {consumo.cantidad_hidratacion_efectiva_ml && consumo.cantidad_hidratacion_efectiva_ml !== consumo.cantidad_ml && (
                      <span className="font-display font-bold text-primary-600">
                        {' '}({consumo.cantidad_hidratacion_efectiva_ml}ml efectivos)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">{hora}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEditConsumo(consumo)}
                    className="p-2 text-neutral-500 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                    aria-label="Editar consumo"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteConsumo(consumo.id)}
                    className="p-2 text-neutral-500 hover:text-error hover:bg-error-50 rounded-lg transition-colors"
                    aria-label="Eliminar consumo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }

          if (!esConsumo && actividad) {
            const pse = actividad.pse_calculado || calcularPSE(actividad);
            const nombreActividad = TIPO_ACTIVIDAD_LABELS[actividad.tipo_actividad] || actividad.tipo_actividad;
            const intensidadLabel = INTENSIDAD_LABELS[actividad.intensidad] || actividad.intensidad;
            const fechaHora = new Date(actividad.fecha_hora);
            const hora = fechaHora.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });

            return (
              <div
                key={item.id}
                className="py-3 pl-3 border-l-4 border-accent-500 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-display font-medium text-neutral-700">
                    <span className="font-display font-bold text-accent-600">{nombreActividad} ({intensidadLabel})</span>
                    {': '}
                    {actividad.duracion_minutos} min
                    {' '}
                    <span className="font-display font-bold text-secondary-600">[+{pse}ml]</span>
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">{hora}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEditActividad(actividad)}
                    className="p-2 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                    aria-label="Editar actividad"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteActividad(actividad.id)}
                    className="p-2 text-neutral-500 hover:text-error hover:bg-error-50 rounded-lg transition-colors"
                    aria-label="Eliminar actividad"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </Card>
  );
});

DashboardRecentHistory.displayName = 'DashboardRecentHistory';

export default DashboardRecentHistory;

