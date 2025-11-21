import { create } from 'zustand';
import { Consumo, Bebida, Recipiente, EstadisticasDiarias, Tendencias, Insights, ConsumoForm, FilterOptions } from '@/types';
import { consumosService, bebidasService, recipientesService, metasService } from '@/services/consumos';
import { useAuthStore } from '@/store/authStore';

interface ConsumosState {
  // Datos
  consumos: Consumo[];
  bebidas: Bebida[];
  recipientes: Recipiente[];
  estadisticas: EstadisticasDiarias | null;
  tendencias: Tendencias | null;
  insights: Insights | null;
  
  // Estado de carga
  isLoading: boolean;
  isLoadingEstadisticas: boolean;
  isLoadingTendencias: boolean;
  isLoadingInsights: boolean;
  
  // Errores
  error: string | null;
  errorEstadisticas: string | null;
  errorTendencias: string | null;
  errorInsights: string | null;
  
  // Paginación
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ConsumosActions {
  // Acciones de consumos
  fetchConsumos: (page?: number, filters?: FilterOptions) => Promise<void>;
  addConsumo: (consumo: ConsumoForm) => Promise<void>;
  updateConsumo: (id: number, consumo: Partial<ConsumoForm>) => Promise<void>;
  deleteConsumo: (id: number) => Promise<void>;
  refreshConsumos: () => Promise<void>;
  
  // Acciones de bebidas
  fetchBebidas: () => Promise<void>;
  fetchBebidasPremium: () => Promise<void>;
  
  // Acciones de recipientes
  fetchRecipientes: () => Promise<void>;
  addRecipiente: (recipiente: Partial<Recipiente>) => Promise<void>;
  updateRecipiente: (id: number, recipiente: Partial<Recipiente>) => Promise<void>;
  deleteRecipiente: (id: number) => Promise<void>;
  
  // Acciones de estadísticas
  fetchEstadisticas: (fecha?: string) => Promise<void>;
  fetchTendencias: (period?: 'daily' | 'weekly' | 'monthly' | 'annual') => Promise<void>;
  fetchInsights: (days?: number) => Promise<void>;
  
  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearErrors: () => void;
  
  // Acciones de paginación
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
}

type ConsumosStore = ConsumosState & ConsumosActions;

export const useConsumosStore = create<ConsumosStore>((set, get) => ({
  // Estado inicial
  consumos: [],
  bebidas: [],
  recipientes: [],
  estadisticas: null,
  tendencias: null,
  insights: null,
  
  isLoading: false,
  isLoadingEstadisticas: false,
  isLoadingTendencias: false,
  isLoadingInsights: false,
  
  error: null,
  errorEstadisticas: null,
  errorTendencias: null,
  errorInsights: null,
  
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,

  // Acciones de consumos
  fetchConsumos: async (page = 1, filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await consumosService.getConsumos(page, 20, filters);
      set({
        consumos: response.results,
        currentPage: page,
        totalPages: Math.ceil(response.count / 20),
        totalCount: response.count,
        hasNextPage: !!response.next,
        hasPreviousPage: !!response.previous,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar consumos',
        isLoading: false
      });
    }
  },

  addConsumo: async (consumo) => {
    console.log('ConsumosStore: addConsumo called with:', consumo);
    set({ isLoading: true, error: null });
    
    try {
      console.log('ConsumosStore: calling consumosService.createConsumo...');
      const newConsumo = await consumosService.createConsumo(consumo);
      console.log('ConsumosStore: consumo created successfully:', newConsumo);
      
      set(state => ({
        consumos: [newConsumo, ...state.consumos],
        isLoading: false
      }));
      
      // Refrescar estadísticas
      console.log('ConsumosStore: refreshing estadísticas...');
      get().fetchEstadisticas();
    } catch (error) {
      console.error('ConsumosStore: error adding consumo:', error);
      set({
        error: error instanceof Error ? error.message : 'Error al agregar consumo',
        isLoading: false
      });
      throw error;
    }
  },

  updateConsumo: async (id, consumo) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedConsumo = await consumosService.updateConsumo(id, consumo);
      set(state => ({
        consumos: state.consumos.map(c => c.id === id ? updatedConsumo : c),
        isLoading: false
      }));
      
      // Refrescar estadísticas
      get().fetchEstadisticas();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar consumo',
        isLoading: false
      });
      throw error;
    }
  },

  deleteConsumo: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await consumosService.deleteConsumo(id);
      set(state => ({
        consumos: state.consumos.filter(c => c.id !== id),
        isLoading: false
      }));
      
      // Refrescar estadísticas
      get().fetchEstadisticas();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al eliminar consumo',
        isLoading: false
      });
      throw error;
    }
  },

  refreshConsumos: async () => {
    const { currentPage } = get();
    await get().fetchConsumos(currentPage);
  },

  // Acciones de bebidas
  fetchBebidas: async () => {
    try {
      const response = await bebidasService.getBebidas();
      set({ bebidas: response.results });
    } catch (error) {
      console.error('Error al cargar bebidas:', error);
    }
  },

  fetchBebidasPremium: async () => {
    try {
      const bebidasPremium = await bebidasService.getBebidasPremium();
      set(state => {
        // Si ya hay bebidas en el estado, evitar duplicados por ID
        if (state.bebidas.length > 0) {
          const bebidasMap = new Map(state.bebidas.map(b => [b.id, b]));
          // Agregar las bebidas premium, sobrescribiendo si ya existen
          bebidasPremium.forEach(b => bebidasMap.set(b.id, b));
          return {
            bebidas: Array.from(bebidasMap.values())
          };
        } else {
          // Si no hay bebidas previas, usar directamente las premium
          return {
            bebidas: bebidasPremium
          };
        }
      });
    } catch (error) {
      console.error('Error al cargar bebidas premium:', error);
    }
  },

  // Acciones de recipientes
  fetchRecipientes: async () => {
    try {
      const response = await recipientesService.getRecipientes();
      set({ recipientes: response.results || [] });
    } catch (error) {
      console.error('Error al cargar recipientes:', error);
      // No lanzar error para evitar bucles, solo registrar
      set({ recipientes: [] });
    }
  },

  addRecipiente: async (recipiente) => {
    const recipienteData: Omit<Recipiente, 'id' | 'usuario' | 'fecha_creacion'> = {
      nombre: recipiente.nombre || '',
      cantidad_ml: recipiente.cantidad_ml || 250,
      color: recipiente.color,
      icono: recipiente.icono,
      es_favorito: recipiente.es_favorito || false
    };
    const newRecipiente = await recipientesService.createRecipiente(recipienteData);
    set(state => ({
      recipientes: [...state.recipientes, newRecipiente]
    }));
  },

  updateRecipiente: async (id, recipiente) => {
    const updatedRecipiente = await recipientesService.updateRecipiente(id, recipiente);
    set(state => ({
      recipientes: state.recipientes.map(r => r.id === id ? updatedRecipiente : r)
    }));
  },

  deleteRecipiente: async (id) => {
    await recipientesService.deleteRecipiente(id);
    set(state => ({
      recipientes: state.recipientes.filter(r => r.id !== id)
    }));
  },

  // Acciones de estadísticas
  fetchEstadisticas: async (fecha) => {
    console.log('ConsumosStore: fetchEstadisticas called with fecha:', fecha);
    set({ isLoadingEstadisticas: true, errorEstadisticas: null });
    
    try {
      console.log('ConsumosStore: calling consumosService.getEstadisticasDiarias...');
      let estadisticas = await consumosService.getEstadisticasDiarias(fecha);
      console.log('ConsumosStore: estadisticas received:', estadisticas);
      
      // Aplicar meta personalizada si el usuario es premium
      const user = useAuthStore.getState().user;
      if (user?.es_premium) {
        try {
          const personalizada = await metasService.getMetaPersonalizada();
          const meta_ml = personalizada.meta_ml;
          const total_hidratacion_efectiva_ml = estadisticas.total_hidratacion_efectiva_ml;
          const progreso_porcentaje = meta_ml > 0 ? Math.min((total_hidratacion_efectiva_ml / meta_ml) * 100, 100) : 0;
          const completada = total_hidratacion_efectiva_ml >= meta_ml;
          estadisticas = {
            ...estadisticas,
            meta_ml,
            progreso_porcentaje,
            completada
          } as EstadisticasDiarias;
          console.log('ConsumosStore: applied personalized goal to stats:', estadisticas);
        } catch (e) {
          console.warn('ConsumosStore: failed to load personalized goal, using default meta:', e);
        }
      }
      
      set({
        estadisticas,
        isLoadingEstadisticas: false
      });
      console.log('ConsumosStore: estadisticas updated in store');
    } catch (error) {
      console.error('ConsumosStore: error fetching estadisticas:', error);
      set({
        errorEstadisticas: error instanceof Error ? error.message : 'Error al cargar estadísticas',
        isLoadingEstadisticas: false
      });
    }
  },

  fetchTendencias: async (period = 'weekly') => {
    set({ isLoadingTendencias: true, errorTendencias: null });
    
    try {
      const tendencias = await consumosService.getTendencias(period);
      set({
        tendencias,
        isLoadingTendencias: false
      });
    } catch (error) {
      set({
        errorTendencias: error instanceof Error ? error.message : 'Error al cargar tendencias',
        isLoadingTendencias: false
      });
    }
  },

  fetchInsights: async (days = 30) => {
    set({ isLoadingInsights: true, errorInsights: null });
    
    try {
      const insights = await consumosService.getInsights(days);
      set({
        insights,
        isLoadingInsights: false
      });
    } catch (error) {
      set({
        errorInsights: error instanceof Error ? error.message : 'Error al cargar insights',
        isLoadingInsights: false
      });
    }
  },

  // Acciones de estado
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  clearErrors: () => {
    set({
      error: null,
      errorEstadisticas: null,
      errorTendencias: null,
      errorInsights: null
    });
  },

  // Acciones de paginación
  setPage: (page) => {
    set({ currentPage: page });
    get().fetchConsumos(page);
  },

  nextPage: () => {
    const { currentPage, hasNextPage } = get();
    if (hasNextPage) {
      get().setPage(currentPage + 1);
    }
  },

  previousPage: () => {
    const { currentPage, hasPreviousPage } = get();
    if (hasPreviousPage) {
      get().setPage(currentPage - 1);
    }
  }
}));
