import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Activity, Edit, Trash2 } from 'lucide-react';
import { useConsumosStore } from '@/store/consumosStore';
import { useAuthStore } from '@/store/authStore';
import { useActividadesStore } from '@/store/actividadesStore';
import HydrationProgress from '@/components/hydration/HydrationProgress';
import AddConsumoModal from '@/components/hydration/AddConsumoModal';
import AddActividadModal from '@/components/activities/AddActividadModal';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Actividad, ActividadForm, Consumo } from '@/types';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
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
    
    // Verificar también que haya token en localStorage
    const token = localStorage.getItem('access_token');
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

  // Log data when it changes
  useEffect(() => {
    console.log('Dashboard: bebidas updated:', bebidas);
    console.log('Dashboard: recipientes updated:', recipientes);
    console.log('Dashboard: estadisticas updated:', estadisticas);
    
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
  }, [bebidas, recipientes, estadisticas]);

  const handleAddActividad = async (data: ActividadForm) => {
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
  };

  const handleEditActividad = (actividad: Actividad) => {
    setActividadEditar({
      id: actividad.id,
      data: {
        tipo_actividad: actividad.tipo_actividad,
        duracion_minutos: actividad.duracion_minutos,
        intensidad: actividad.intensidad
      }
    });
    setShowAddActividadModal(true);
  };

  const handleDeleteActividad = async (id: number) => {
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
  };

  const handleAddConsumo = async (data: { bebida: number; recipiente: number | null; cantidad_ml: number }) => {
    try {
      // Obtener la fecha/hora actual en la zona horaria local del usuario
      const ahora = new Date();
      // Crear una fecha que represente la hora local actual pero en formato ISO
      // El backend interpretará esto como UTC, así que necesitamos ajustar
      // Enviar la fecha/hora como si fuera local, pero el backend la guardará en UTC
      // La mejor solución es enviar la fecha/hora actual y dejar que el backend la interprete correctamente
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
  };

  const handleEditConsumo = (consumo: Consumo) => {
    const bebidaId = typeof consumo.bebida === 'object' ? consumo.bebida.id : consumo.bebida;
    const recipienteId = typeof consumo.recipiente === 'object' ? (consumo.recipiente?.id || null) : (consumo.recipiente || null);
    
    setConsumoEditar({
      id: consumo.id,
      bebida: bebidaId,
      recipiente: recipienteId,
      cantidad_ml: consumo.cantidad_ml
    });
    setShowAddConsumoModal(true);
  };

  const handleDeleteConsumo = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este consumo?')) {
      try {
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
  };
  
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
      <div className="bg-white shadow-card border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-700">
                ¡Hola, {user?.first_name || user?.username || 'Usuario'}! 👋
              </h1>
              <p className="text-neutral-600">
                Mantente hidratado y saludable
              </p>
            </div>
            <div className="flex items-center space-x-4" />
          </div>
        </div>
      </div>

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
              estadisticas={estadisticas || {
                fecha: new Date().toISOString().slice(0,10),
                total_ml: 0,
                total_hidratacion_efectiva_ml: 0,
                cantidad_consumos: 0,
                meta_ml: user?.meta_diaria_ml || 2000,
                progreso_porcentaje: 0,
                completada: false
              }}
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
                    {Math.max(0, (estadisticas?.meta_ml || 0) - (estadisticas?.total_hidratacion_efectiva_ml || 0))}ml
                  </div>
                  <div className="text-sm text-neutral-600">Restante</div>
                </div>
              </div>
            </Card>

            {/* Historial Reciente - Consumos y Actividades unificados */}
            <Card title="Historial Reciente" subtitle="Tu actividad del día">
              <div className="divide-y divide-neutral-100">
                {isLoading || isLoadingHoy ? (
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
                ) : (() => {
                  // Función para calcular PSE de una actividad
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

                  // Obtener fecha de hoy en formato YYYY-MM-DD (en zona horaria local)
                  const hoy = new Date();
                  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
                  
                  // Función helper para obtener la fecha local de una fecha ISO (sin conversión de zona horaria)
                  const obtenerFechaLocal = (fechaISO: string): string => {
                    const fecha = new Date(fechaISO);
                    // Usar los métodos locales para obtener año, mes y día
                    const año = fecha.getFullYear();
                    const mes = fecha.getMonth() + 1;
                    const dia = fecha.getDate();
                    return `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  };
                  
                  // Filtrar consumos y actividades del día actual (comparando fechas locales)
                  const consumosHoy = (consumos || []).filter(c => {
                    const fechaConsumo = obtenerFechaLocal(c.fecha_hora);
                    return fechaConsumo === hoyStr;
                  });

                  const actividadesHoyFiltradas = (actividadesHoy || []).filter(a => {
                    const fechaActividad = obtenerFechaLocal(a.fecha_hora);
                    return fechaActividad === hoyStr;
                  });

                  // Combinar consumos y actividades en un solo array
                  const historialReciente: Array<{
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
                  historialReciente.sort((a, b) => 
                    new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
                  );

                  // Mostrar solo las últimas 5 acciones
                  const historialMostrar = historialReciente.slice(0, 5);

                  if (historialMostrar.length === 0) {
                    return (
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
                            onClick={() => setShowAddConsumoModal(true)}
                            className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-display font-bold transition-colors"
                          >
                            Registrar Consumo
                          </button>
                          <button
                            onClick={() => {
                              setActividadEditar(undefined);
                              setShowAddActividadModal(true);
                            }}
                            className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-display font-bold transition-colors"
                          >
                            Registrar Actividad
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return historialMostrar.map((item) => {
                    const esConsumo = item.tipo === 'consumo';
                    const consumo = esConsumo ? (item.data as Consumo) : null;
                    const actividad = !esConsumo ? (item.data as Actividad) : null;

                    if (esConsumo && consumo) {
                      // Obtener nombre de la bebida: primero del serializer, luego del objeto bebida, luego buscar en la lista de bebidas
                      let bebidaNombre = consumo.bebida_nombre;
                      if (!bebidaNombre) {
                        if (typeof consumo.bebida === 'object' && consumo.bebida.nombre) {
                          bebidaNombre = consumo.bebida.nombre;
                        } else if (typeof consumo.bebida === 'number') {
                          // Buscar en la lista de bebidas del store
                          const bebidaEncontrada = bebidas.find(b => b.id === consumo.bebida);
                          bebidaNombre = bebidaEncontrada?.nombre || 'Bebida';
                        } else {
                          bebidaNombre = 'Bebida';
                        }
                      }
                      
                      const esAlcoholica = typeof consumo.bebida === 'object' ? consumo.bebida.es_alcoholica : (bebidas.find(b => b.id === (typeof consumo.bebida === 'number' ? consumo.bebida : consumo.bebida?.id))?.es_alcoholica || false);
                      const hidratacionEfectiva = consumo.hidratacion_efectiva_ml || consumo.cantidad_hidratacion_efectiva;
                      
                      // Usar hora_formateada del serializer si está disponible, sino formatear consistentemente
                      let hora: string;
                      if (consumo.hora_formateada) {
                        hora = consumo.hora_formateada;
                      } else {
                        const fechaHora = new Date(consumo.fecha_hora);
                        // Formatear en hora local del usuario
                        hora = fechaHora.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        });
                      }

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
                              {hidratacionEfectiva && hidratacionEfectiva !== consumo.cantidad_ml && (
                                <span className="text-neutral-600"> (Efectivo: {hidratacionEfectiva}ml)</span>
                              )}
                            </p>
                            <p className="text-sm text-neutral-500 mt-1">{hora}</p>
                            {esAlcoholica && consumo.agua_compensacion_recomendada_ml && consumo.agua_compensacion_recomendada_ml > 0 && (
                              <div className="mt-2 p-2 bg-error-50 border border-error-200 rounded-md">
                                <p className="text-xs font-display font-medium text-error-800">
                                  ⚠️ Bebida alcohólica
                                </p>
                                <p className="text-xs text-error-700 mt-1">
                                  Bebe {consumo.agua_compensacion_recomendada_ml} ml de agua adicional para compensar la deshidratación neta
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEditConsumo(consumo)}
                              className="p-2 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                              aria-label="Editar consumo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteConsumo(consumo.id)}
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
                      // Formatear hora consistentemente
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
                              onClick={() => handleEditActividad(actividad)}
                              className="p-2 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                              aria-label="Editar actividad"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteActividad(actividad.id)}
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
                  });
                })()}
              </div>
            </Card>
          </div>

          {/* Right Column - Tips & Premium */}
          <div className="space-y-6">

            {/* Tips - Diseño más sutil */}
            <Card title="💡 Consejos de Hidratación">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 py-2">
                  <Droplets className="w-5 h-5 text-accent-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-display font-medium text-neutral-700 mb-0.5">
                      Bebe agua al despertar
                    </p>
                    <p className="text-neutral-600 text-xs">
                      Un vaso de agua en ayunas activa tu metabolismo
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <Droplets className="w-5 h-5 text-secondary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-display font-medium text-neutral-700 mb-0.5">
                      Hidrátate antes de sentir sed
                    </p>
                    <p className="text-neutral-600 text-xs">
                      La sed es una señal tardía de deshidratación
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <Droplets className="w-5 h-5 text-chart-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-display font-medium text-neutral-700 mb-0.5">
                      Frutas y verduras cuentan
                    </p>
                    <p className="text-neutral-600 text-xs">
                      El 20% de tu hidratación viene de los alimentos
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Premium Features */}
            {!user?.es_premium && (
              <Card title="🚀 Desbloquea Premium">
                <div className="text-center">
                  <h3 className="text-lg font-display font-bold text-neutral-700 mb-2">
                    Funciones avanzadas
                  </h3>
                  <ul className="text-sm font-display font-medium text-neutral-600 space-y-1 mb-4">
                    <li>• Estadísticas detalladas</li>
                    <li>• Recordatorios ilimitados</li>
                    <li>• Sin anuncios</li>
                    <li>• Bebidas premium</li>
                  </ul>
                  <Button variant="primary" size="sm" className="w-full" onClick={() => navigate('/profile')}>
                    Actualizar a Premium
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Botones Flotantes de Acción */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-4">
        <button
          onClick={() => setShowAddConsumoModal(true)}
          className="w-16 h-16 rounded-full bg-secondary-500 hover:bg-secondary-600 text-white shadow-strong flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label="Registrar consumo"
        >
          <Droplets className="w-7 h-7" />
        </button>
        <button
          onClick={() => {
            setActividadEditar(undefined);
            setShowAddActividadModal(true);
          }}
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
          onClose={() => {
            setShowAddConsumoModal(false);
            setConsumoEditar(undefined);
          }}
          onSubmit={handleAddConsumo}
          consumoEditar={consumoEditar}
        />
      )}

      {showAddActividadModal && (
        <AddActividadModal
          onSubmit={handleAddActividad}
          onClose={() => {
            setShowAddActividadModal(false);
            setActividadEditar(undefined);
          }}
          actividadEditar={actividadEditar}
        />
      )}
    </div>
  );
};

export default Dashboard;
