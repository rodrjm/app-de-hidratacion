import { create } from 'zustand';
import { Actividad, ActividadForm } from '@/types';
import { actividadesService } from '@/services/actividades';
import { useAuthStore } from '@/store/authStore';

interface ActividadesState {
  actividades: Actividad[];
  actividadesHoy: Actividad[];
  isLoading: boolean;
  isLoadingHoy: boolean;
  error: string | null;
  pseTotalHoy: number;
}

interface ActividadesActions {
  fetchActividades: (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    tipo_actividad?: string;
  }) => Promise<void>;
  fetchActividadesHoy: () => Promise<void>;
  addActividad: (actividad: ActividadForm) => Promise<Actividad>;
  updateActividad: (id: number, actividad: Partial<ActividadForm>) => Promise<void>;
  deleteActividad: (id: number) => Promise<void>;
  clearError: () => void;
}

type ActividadesStore = ActividadesState & ActividadesActions;

export const useActividadesStore = create<ActividadesStore>((set, get) => ({
  // Estado inicial
  actividades: [],
  actividadesHoy: [],
  isLoading: false,
  isLoadingHoy: false,
  error: null,
  pseTotalHoy: 0,

  // Acciones
  fetchActividades: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const actividades = await actividadesService.getActividades(params);
      set({ actividades, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar actividades';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchActividadesHoy: async () => {
    set({ isLoadingHoy: true, error: null });
    try {
      const resumen = await actividadesService.getResumenDia();
      set({ 
        actividadesHoy: resumen.actividades,
        pseTotalHoy: resumen.pse_total,
        isLoadingHoy: false 
      });
      // No actualizar usuario aquí para evitar loops infinitos
      // El usuario se actualiza cuando se crea/edita/elimina una actividad
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar actividades del día';
      set({ error: errorMessage, isLoadingHoy: false });
      throw error;
    }
  },

  addActividad: async (actividad) => {
    set({ isLoading: true, error: null });
    try {
      const nuevaActividad = await actividadesService.createActividad(actividad);
      
      // Actualizar lista de hoy si la actividad es de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const actividadFecha = nuevaActividad.fecha_hora.split('T')[0];
      
      if (actividadFecha === hoy) {
        await get().fetchActividadesHoy();
      } else {
        set(state => ({
          actividades: [nuevaActividad, ...state.actividades],
          isLoading: false
        }));
      }
      
      // Actualizar usuario para reflejar nueva meta
      const { refreshUser } = useAuthStore.getState();
      await refreshUser();
      
      return nuevaActividad;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear actividad';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateActividad: async (id, actividad) => {
    set({ isLoading: true, error: null });
    try {
      await actividadesService.updateActividad(id, actividad);
      
      // Actualizar lista
      await get().fetchActividadesHoy();
      
      // Actualizar usuario para reflejar nueva meta
      const { refreshUser } = useAuthStore.getState();
      await refreshUser();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar actividad';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteActividad: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await actividadesService.deleteActividad(id);
      
      // Actualizar lista
      await get().fetchActividadesHoy();
      
      // Actualizar usuario para reflejar nueva meta
      const { refreshUser } = useAuthStore.getState();
      await refreshUser();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar actividad';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

