import { create } from 'zustand';
import { Consumo, Bebida, Recipiente, EstadisticasDiarias, Tendencias, Insights } from '@/types';
import { consumosService, bebidasService, recipientesService } from '@/services/consumos';

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
  fetchConsumos: (page?: number, filters?: any) => Promise<void>;
  addConsumo: (consumo: any) => Promise<void>;
  updateConsumo: (id: number, consumo: any) => Promise<void>;
  deleteConsumo: (id: number) => Promise<void>;
  refreshConsumos: () => Promise<void>;
  
  // Acciones de bebidas
  fetchBebidas: () => Promise<void>;
  fetchBebidasPremium: () => Promise<void>;
  
  // Acciones de recipientes
  fetchRecipientes: () => Promise<void>;
  addRecipiente: (recipiente: any) => Promise<void>;
  updateRecipiente: (id: number, recipiente: any) => Promise<void>;
  deleteRecipiente: (id: number) => Promise<void>;
  
  // Acciones de estadísticas
  fetchEstadisticas: (fecha?: string) => Promise<void>;
  fetchTendencias: (period?: 'daily' | 'weekly' | 'monthly') => Promise<void>;
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
    set({ isLoading: true, error: null });
    
    try {
      const newConsumo = await consumosService.createConsumo(consumo);
      set(state => ({
        consumos: [newConsumo, ...state.consumos],
        isLoading: false
      }));
      
      // Refrescar estadísticas
      get().fetchEstadisticas();
    } catch (error) {
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
      const bebidas = await bebidasService.getBebidasPremium();
      set(state => ({
        bebidas: [...state.bebidas, ...bebidas]
      }));
    } catch (error) {
      console.error('Error al cargar bebidas premium:', error);
    }
  },

  // Acciones de recipientes
  fetchRecipientes: async () => {
    try {
      const response = await recipientesService.getRecipientes();
      set({ recipientes: response.results });
    } catch (error) {
      console.error('Error al cargar recipientes:', error);
    }
  },

  addRecipiente: async (recipiente) => {
    try {
      const newRecipiente = await recipientesService.createRecipiente(recipiente);
      set(state => ({
        recipientes: [...state.recipientes, newRecipiente]
      }));
    } catch (error) {
      throw error;
    }
  },

  updateRecipiente: async (id, recipiente) => {
    try {
      const updatedRecipiente = await recipientesService.updateRecipiente(id, recipiente);
      set(state => ({
        recipientes: state.recipientes.map(r => r.id === id ? updatedRecipiente : r)
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteRecipiente: async (id) => {
    try {
      await recipientesService.deleteRecipiente(id);
      set(state => ({
        recipientes: state.recipientes.filter(r => r.id !== id)
      }));
    } catch (error) {
      throw error;
    }
  },

  // Acciones de estadísticas
  fetchEstadisticas: async (fecha) => {
    set({ isLoadingEstadisticas: true, errorEstadisticas: null });
    
    try {
      const estadisticas = await consumosService.getEstadisticasDiarias(fecha);
      set({
        estadisticas,
        isLoadingEstadisticas: false
      });
    } catch (error) {
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
