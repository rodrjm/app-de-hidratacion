import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { Droplets, Activity } from 'lucide-react';
import { useConsumosStore } from '@/store/consumosStore';
import { useAuthStore } from '@/store/authStore';
import { useActividadesStore } from '@/store/actividadesStore';
import HydrationProgress from '@/components/hydration/HydrationProgress';
import AddConsumoModal from '@/components/hydration/AddConsumoModal';
import AddActividadModal from '@/components/activities/AddActividadModal';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import { Actividad, ActividadForm, Consumo, EstadisticasDiarias } from '@/types';
import PageHeader from '@/components/layout/PageHeader';
import DashboardRecentHistory from '@/components/dashboard/DashboardRecentHistory';
import DashboardTips from '@/components/dashboard/DashboardTips';
import DashboardPremiumCard from '@/components/dashboard/DashboardPremiumCard';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [showAddConsumoModal, setShowAddConsumoModal] = useState(false);
  const [showAddActividadModal, setShowAddActividadModal] = useState(false);
  const [actividadEditar, setActividadEditar] = useState<{ id: number; data: ActividadForm } | undefined>(undefined);
  const [consumoEditar, setConsumoEditar] = useState<{ id: number; bebida: number; recipiente: number | null; cantidad_ml: number } | undefined>(undefined);
  const {
    estadisticas,
    bebidas,
    recipientes,
    consumos,
    isLoading,
    isLoadingEstadisticas,
    error,
    fetchEstadisticas,
    fetchBebidas,
    fetchRecipientes,
    fetchConsumos,
    addConsumo,
    updateConsumo,
    deleteConsumo
  } = useConsumosStore();
  const {
    actividadesHoy,
    isLoadingHoy,
    fetchActividadesHoy,
    addActividad,
    updateActividad,
    deleteActividad
  } = useActividadesStore();

  // Ref para rastrear si ya se cargaron los datos iniciales
  const hasLoadedInitialDataRef = useRef<boolean>(false);
  const lastUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Cargar datos iniciales solo una vez
    // Verificar que el usuario esté autenticado Y que haya token antes de hacer peticiones
    if (!user || !isAuthenticated) {
      hasLoadedInitialDataRef.current = false;
      lastUserIdRef.current = null;
      return;
    }
    
    // Verificar también que haya token en sessionStorage
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      hasLoadedInitialDataRef.current = false;
      lastUserIdRef.current = null;
      return;
    }
    
    // Si ya se cargaron los datos para este usuario, no volver a cargar
    if (hasLoadedInitialDataRef.current && lastUserIdRef.current === user.id) {
      return;
    }
    
    console.log('Dashboard: Loading initial data...');
    fetchEstadisticas(); // usa daily_summary
    fetchBebidas();
    fetchRecipientes();
    fetchConsumos(1, { fecha_inicio: new Date().toISOString().slice(0,10), fecha_fin: new Date().toISOString().slice(0,10) });
    fetchActividadesHoy();
    
    // Marcar como cargado
    hasLoadedInitialDataRef.current = true;
    lastUserIdRef.current = user.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated]); // Solo ejecutar cuando cambie el ID del usuario o estado de autenticación

  // Rastrear el último porcentaje y umbral mostrado para evitar toasts duplicados
  const lastShownPercentageRef = useRef<number>(-1);
  const lastShownThresholdRef = useRef<number | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  // Memoizar estadísticas por defecto para evitar recrearlas en cada render
  const estadisticasDefault: EstadisticasDiarias = useMemo(() => ({
    fecha: new Date().toISOString().split('T')[0],
    total_ml: 0,
    total_hidratacion_efectiva_ml: 0,
    meta_ml: 0,
    progreso_porcentaje: 0,
    completada: false,
    cantidad_consumos: 0
  }), []);

  // Log data when it changes - Memoizar para evitar ejecuciones innecesarias
  useEffect(() => {
    // Mostrar toast solo cuando el progreso AUMENTA y alcanza un nuevo umbral
    if (estadisticas && estadisticas.cantidad_consumos > 0) {
      const porcentaje = Math.round(estadisticas.progreso_porcentaje);
      const previousPercentage = lastShownPercentageRef.current;
      
      // En el primer montaje, inicializar con el porcentaje actual sin mostrar toast
      if (isInitialMountRef.current) {
        lastShownPercentageRef.current = porcentaje;
        // Determinar qué umbral ya se alcanzó para no mostrarlo de nuevo
        if (porcentaje >= 100) {
          lastShownThresholdRef.current = 100;
        } else if (porcentaje >= 80) {
          lastShownThresholdRef.current = 80;
        } else if (porcentaje >= 50) {
          lastShownThresholdRef.current = 50;
        }
        isInitialMountRef.current = false;
        return;
      }
      
      // Solo mostrar toast si el porcentaje aumentó (nuevo consumo)
      if (porcentaje > previousPercentage) {
        let threshold: number | null = null;
        let message: string | null = null;
        
        if (porcentaje >= 100 && lastShownThresholdRef.current !== 100) {
          threshold = 100;
          message = `¡Meta alcanzada! ${estadisticas.total_hidratacion_efectiva_ml}ml consumidos 🎉`;
        } else if (porcentaje >= 80 && lastShownThresholdRef.current !== 80 && lastShownThresholdRef.current !== 100) {
          threshold = 80;
          message = `¡Casi lo logras! ${porcentaje}% completado 💪`;
        } else if (porcentaje >= 50 && lastShownThresholdRef.current !== 50 && lastShownThresholdRef.current !== 80 && lastShownThresholdRef.current !== 100) {
          threshold = 50;
          message = `¡Bien hecho! ${porcentaje}% completado 🌟`;
        }
        
        if (message && threshold !== null) {
          toast.success(message);
          lastShownThresholdRef.current = threshold;
        }
        
        lastShownPercentageRef.current = porcentaje;
      }
    }
  }, [estadisticas]);

  // Memoizar handlers para evitar re-renders innecesarios
  const handleAddActividad = useCallback(async (data: ActividadForm) => {
    try {
      // Calcular PSE estimado para el toast
      const tsBaseMap: Record<string, number> = {
        'correr': 20.0, 'ciclismo': 18.3, 'natacion': 13.3, 'futbol_rugby': 23.3,
        'baloncesto_voley': 20.0, 'gimnasio': 13.3, 'crossfit_hiit': 25.0,
        'padel_tenis': 16.7, 'baile_aerobico': 15.0, 'caminata_rapida': 8.3,
        'pilates': 6.7, 'caminata': 4.2, 'yoga_hatha': 5.0, 'yoga_bikram': 25.0,
      };
      const factorIntensidadMap: Record<string, number> = {
        'baja': 0.8, 'media': 1.0, 'alta': 1.2,
      };
      const tsBase = tsBaseMap[data.tipo_actividad] || 13.3;
      const factorIntensidad = factorIntensidadMap[data.intensidad] || 1.0;
      const pseEstimado = Math.round(data.duracion_minutos * tsBase * factorIntensidad);

      if (actividadEditar) {
        await updateActividad(actividadEditar.id, data);
        toast.success('Actividad actualizada exitosamente');
        setActividadEditar(undefined);
      } else {
        await addActividad(data);
        toast.success(`¡Listo! Meta diaria ajustada en +${pseEstimado}ml.`, {
          duration: 4000,
          icon: '💪',
        });
      }
      // Refrescar actividades del día
      await fetchActividadesHoy();
      await fetchEstadisticas(); // Actualizar estadísticas para reflejar nueva meta
      setShowAddActividadModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar actividad';
      toast.error(errorMessage);
    }
  }, [actividadEditar, addActividad, updateActividad, fetchActividadesHoy, fetchEstadisticas]);

  const handleEditActividad = useCallback((actividad: Actividad) => {
    setActividadEditar({
      id: actividad.id,
      data: {
        tipo_actividad: actividad.tipo_actividad,
        duracion_minutos: actividad.duracion_minutos,
        intensidad: actividad.intensidad
      }
    });
    setShowAddActividadModal(true);
  }, []);

  const handleDeleteActividad = useCallback(async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
      try {
        await deleteActividad(id);
        toast.success('Actividad eliminada exitosamente');
        // Refrescar actividades del día
        await fetchActividadesHoy();
        await fetchEstadisticas(); // Actualizar estadísticas para reflejar nueva meta
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar actividad';
        toast.error(errorMessage);
      }
    }
  }, [deleteActividad, fetchActividadesHoy, fetchEstadisticas]);

  const handleAddConsumo = useCallback(async (data: { bebida: number; recipiente: number | null; cantidad_ml: number }) => {
    try {
      // Forzar recarga de datos después de agregar/actualizar consumo
      hasLoadedInitialDataRef.current = false;
      // Obtener la fecha/hora actual en la zona horaria local del usuario
      const ahora = new Date();
      const fechaHora = ahora.toISOString();
      
      if (consumoEditar) {
        await updateConsumo(consumoEditar.id, {
          ...data,
          recipiente: data.recipiente || undefined,
          nivel_sed: 3,
          estado_animo: 'bueno',
          fecha_hora: fechaHora
        });
        toast.success('¡Consumo actualizado exitosamente! 💧');
        setConsumoEditar(undefined);
      } else {
        await addConsumo({
          ...data,
          recipiente: data.recipiente || undefined,
          nivel_sed: 3,
          estado_animo: 'bueno',
          fecha_hora: fechaHora
        });
        toast.success('¡Consumo registrado exitosamente! 💧');
      }
      // Refrescar la lista de consumos del día para obtener los datos completos (bebida_nombre, hora_formateada)
      const hoy = new Date().toISOString().slice(0, 10);
      await fetchConsumos(1, { fecha_inicio: hoy, fecha_fin: hoy });
      await fetchEstadisticas(); // Actualizar estadísticas
      setShowAddConsumoModal(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al registrar el consumo';
      toast.error(msg);
    }
  }, [consumoEditar, addConsumo, updateConsumo, fetchConsumos, fetchEstadisticas]);

  const handleEditConsumo = useCallback((consumo: Consumo) => {
    const bebidaId = typeof consumo.bebida === 'object' ? consumo.bebida.id : consumo.bebida;
    const recipienteId = typeof consumo.recipiente === 'object' ? (consumo.recipiente?.id || null) : (consumo.recipiente || null);
    
    setConsumoEditar({
      id: consumo.id,
      bebida: bebidaId,
      recipiente: recipienteId,
      cantidad_ml: consumo.cantidad_ml
    });
    setShowAddConsumoModal(true);
  }, []);

  const handleDeleteConsumo = useCallback(async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este consumo?')) {
      try {
        // Forzar recarga de datos después de eliminar consumo
        hasLoadedInitialDataRef.current = false;
        await deleteConsumo(id);
        toast.success('Consumo eliminado exitosamente');
        // Refrescar la lista de consumos del día
        const hoy = new Date().toISOString().slice(0, 10);
        await fetchConsumos(1, { fecha_inicio: hoy, fecha_fin: hoy });
        await fetchEstadisticas(); // Actualizar estadísticas
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar consumo';
        toast.error(errorMessage);
      }
    }
  }, [deleteConsumo, fetchConsumos, fetchEstadisticas]);

  // Handlers para modales y botones
  const handleOpenConsumoModal = useCallback(() => {
    setShowAddConsumoModal(true);
  }, []);

  const handleOpenActividadModal = useCallback(() => {
    setActividadEditar(undefined);
    setShowAddActividadModal(true);
  }, []);

  const handleCloseConsumoModal = useCallback(() => {
    setShowAddConsumoModal(false);
    setConsumoEditar(undefined);
  }, []);

  const handleCloseActividadModal = useCallback(() => {
    setShowAddActividadModal(false);
    setActividadEditar(undefined);
  }, []);
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <Droplets className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-display font-bold text-neutral-700 mb-2">
            Error al cargar datos
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <PageHeader 
        isLoading={isLoading}
        title={`¡Hola${user?.first_name ? `, ${user.first_name}` : user?.username ? `, ${user.username}` : ''}! 👋`}
        subtitle="Mantente hidratado durante todo el día"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Barra de Progreso - Central y Visible */}
        <div className="mb-8">
          {isLoadingEstadisticas ? (
            <Card className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-11/12 mb-2" />
              <Skeleton className="h-3 w-10/12" />
            </Card>
          ) : (
            <HydrationProgress
              estadisticas={estadisticas || estadisticasDefault}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">

            {/* Metas/Datos Clave - Consolidados */}
            <Card className="mb-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-display font-bold text-secondary-600 mb-1">
                    {estadisticas?.total_hidratacion_efectiva_ml || 0}ml
                  </div>
                  <div className="text-sm text-neutral-600">Consumido</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-neutral-700 mb-1">
                    {estadisticas?.meta_ml || 0}ml
                  </div>
                  <div className="text-sm text-neutral-600">Meta Diaria</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-accent-600 mb-1">
                    {useMemo(() => 
                      Math.max(0, (estadisticas?.meta_ml || 0) - (estadisticas?.total_hidratacion_efectiva_ml || 0)),
                      [estadisticas?.meta_ml, estadisticas?.total_hidratacion_efectiva_ml]
                    )}ml
                  </div>
                  <div className="text-sm text-neutral-600">Restante</div>
                </div>
              </div>
            </Card>

            {/* Historial Reciente - Consumos y Actividades unificados */}
            {isLoading || isLoadingHoy ? (
            <Card title="Historial Reciente" subtitle="Tu actividad del día">
                  <div className="space-y-3 py-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="w-6/12">
                          <Skeleton className="h-4 w-9/12 mb-1" />
                          <Skeleton className="h-3 w-6/12" />
                        </div>
                        <div className="w-3/12 text-right">
                          <Skeleton className="h-4 w-16 ml-auto mb-1" />
                          <Skeleton className="h-3 w-20 ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
              </Card>
            ) : (
              <DashboardRecentHistory
                consumos={consumos}
                actividadesHoy={actividadesHoy}
                onEditConsumo={handleEditConsumo}
                onDeleteConsumo={handleDeleteConsumo}
                onEditActividad={handleEditActividad}
                onDeleteActividad={handleDeleteActividad}
                onAddConsumo={handleOpenConsumoModal}
                onAddActividad={handleOpenActividadModal}
              />
            )}
          </div>

          {/* Right Column - Tips & Premium */}
          <div className="space-y-6">
            <DashboardTips />
            <DashboardPremiumCard isPremium={!!user?.es_premium} />
          </div>
        </div>
      </div>

      {/* Botones Flotantes de Acción */}
      {/* Posicionados por encima del anuncio: navegación (64px) + anuncio (50px) + espacio (16px) = 130px */}
      <div className="fixed bottom-[130px] right-4 z-50 flex flex-col gap-4">
        <button
          onClick={handleOpenConsumoModal}
          className="w-16 h-16 rounded-full bg-secondary-500 hover:bg-secondary-600 text-white shadow-strong flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label="Registrar consumo"
        >
          <Droplets className="w-7 h-7" />
        </button>
        <button
          onClick={handleOpenActividadModal}
          className="w-16 h-16 rounded-full bg-accent-500 hover:bg-accent-600 text-white shadow-strong flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label="Registrar actividad física"
        >
          <Activity className="w-7 h-7" />
        </button>
      </div>

      {/* Modal para agregar/editar consumo */}
      {showAddConsumoModal && (
        <AddConsumoModal
          bebidas={bebidas}
          recipientes={recipientes}
          isPremium={!!user?.es_premium}
          onClose={handleCloseConsumoModal}
          onSubmit={handleAddConsumo}
          consumoEditar={consumoEditar}
        />
      )}

      {showAddActividadModal && (
        <AddActividadModal
          onSubmit={handleAddActividad}
          onClose={handleCloseActividadModal}
          actividadEditar={actividadEditar}
        />
      )}
    </div>
  );
};

export default memo(Dashboard);
