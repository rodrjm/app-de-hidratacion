import { create } from 'zustand';
import { Recordatorio, RecordatorioForm, PaginatedResponse } from '@/types';
import { recordatoriosService } from '@/services/consumos';

interface RecordatoriosState {
  recordatorios: Recordatorio[];
  isLoading: boolean;
  error: string | null;
}

interface RecordatoriosActions {
  fetchRecordatorios: () => Promise<void>;
  addRecordatorio: (data: RecordatorioForm) => Promise<void>;
  updateRecordatorio: (id: number, data: Partial<RecordatorioForm>) => Promise<void>;
  deleteRecordatorio: (id: number) => Promise<void>;
}

export const useRecordatoriosStore = create<RecordatoriosState & RecordatoriosActions>((set, _get) => ({
  recordatorios: [],
  isLoading: false,
  error: null,

  fetchRecordatorios: async () => {
    set({ isLoading: true, error: null });
    try {
      const response: PaginatedResponse<Recordatorio> = await recordatoriosService.getRecordatorios();
      set({ recordatorios: response.results, isLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar recordatorios';
      set({ error: msg, isLoading: false });
    }
  },

  addRecordatorio: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const nuevo = await recordatoriosService.createRecordatorio(data);
      set(state => ({ recordatorios: [nuevo, ...state.recordatorios], isLoading: false }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al crear recordatorio';
      set({ error: msg, isLoading: false });
      throw e as Error;
    }
  },

  updateRecordatorio: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const actualizado = await recordatoriosService.updateRecordatorio(id, data);
      set(state => ({
        recordatorios: state.recordatorios.map(r => r.id === id ? actualizado : r),
        isLoading: false
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar recordatorio';
      set({ error: msg, isLoading: false });
      throw e as Error;
    }
  },

  deleteRecordatorio: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await recordatoriosService.deleteRecordatorio(id);
      set(state => ({ recordatorios: state.recordatorios.filter(r => r.id !== id), isLoading: false }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar recordatorio';
      set({ error: msg, isLoading: false });
      throw e as Error;
    }
  }
}));
