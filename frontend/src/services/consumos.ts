import { apiService } from './api';
import { 
  Consumo, 
  ConsumoForm, 
  Bebida, 
  Recipiente, 
  MetaDiaria, 
  EstadisticasDiarias,
  EstadisticasSemanales,
  EstadisticasMensuales,
  Tendencias,
  Insights,
  PaginatedResponse,
  FilterOptions,
  SortOptions,
  Recordatorio,
  RecordatorioForm
} from '@/types';

class ConsumosService {
  /**
   * Obtener lista de consumos con paginación y filtros
   */
  async getConsumos(
    page: number = 1,
    pageSize: number = 20,
    filters?: FilterOptions,
    sort?: SortOptions
  ): Promise<PaginatedResponse<Consumo>> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      page_size: pageSize,
      ...filters,
      tz,
      tz_offset_minutes
    };

    if (sort) {
      params.ordering = sort.direction === 'desc' ? `-${sort.field}` : sort.field;
    }

    return await apiService.get<PaginatedResponse<Consumo>>('/consumos/', params);
  }

  /**
   * Obtener un consumo específico
   */
  async getConsumo(id: number): Promise<Consumo> {
    return await apiService.get<Consumo>(`/consumos/${id}/`);
  }

  /**
   * Crear nuevo consumo
   */
  async createConsumo(consumo: ConsumoForm): Promise<Consumo> {
    console.log('ConsumosService: createConsumo called with:', consumo);
    try {
      // Enviar zona horaria en el header para que el backend la use
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tz_offset_minutes = new Date().getTimezoneOffset();
      const result = await apiService.post<Consumo>('/consumos/', consumo, {
        params: { tz, tz_offset_minutes }
      });
      console.log('ConsumosService: createConsumo successful, result:', result);
      return result;
    } catch (error) {
      console.error('ConsumosService: createConsumo error:', error);
      throw error;
    }
  }

  /**
   * Actualizar consumo existente
   */
  async updateConsumo(id: number, consumo: Partial<ConsumoForm>): Promise<Consumo> {
    return await apiService.put<Consumo>(`/consumos/${id}/`, consumo);
  }

  /**
   * Eliminar consumo
   */
  async deleteConsumo(id: number): Promise<void> {
    return await apiService.delete<void>(`/consumos/${id}/`);
  }

  /**
   * Obtener estadísticas diarias
   */
  async getEstadisticasDiarias(fecha?: string): Promise<EstadisticasDiarias> {
    console.log('ConsumosService: getEstadisticasDiarias called with fecha:', fecha);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    const params = fecha ? { fecha, tz, tz_offset_minutes } : { tz, tz_offset_minutes };
    console.log('ConsumosService: params:', params);
    
    try {
      const result = await apiService.get<EstadisticasDiarias>('/consumos/daily_summary/', params);
      console.log('ConsumosService: getEstadisticasDiarias successful, result:', result);
      return result;
    } catch (error) {
      console.error('ConsumosService: getEstadisticasDiarias error:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas semanales
   */
  async getEstadisticasSemanales(): Promise<EstadisticasSemanales> {
    return await apiService.get<EstadisticasSemanales>('/premium/stats/summary/?period=weekly');
  }

  /**
   * Obtener estadísticas mensuales
   */
  async getEstadisticasMensuales(): Promise<EstadisticasMensuales> {
    return await apiService.get<EstadisticasMensuales>('/premium/stats/summary/?period=monthly');
  }

  /**
   * Obtener tendencias de consumo
   */
  async getTendencias(period: 'daily' | 'weekly' | 'monthly' | 'annual' = 'weekly'): Promise<Tendencias> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    return await apiService.get<Tendencias>(`/consumos/trends/?period=${period}&tz=${encodeURIComponent(tz)}&tz_offset_minutes=${tz_offset_minutes}`);
  }

  /**
   * Obtener insights personalizados
   */
  async getInsights(days: number = 30): Promise<Insights> {
    // Verificar si el usuario es premium antes de hacer la petición
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      throw new Error('No hay token de acceso');
    }

    try {
      // Decodificar el token para verificar si es premium
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isPremium = payload.es_premium;
      
      if (!isPremium) {
        // Usuario no premium, devolver insights básicos sin hacer petición HTTP
        console.warn('Usuario no premium, devolviendo insights básicos');
        return {
          bebida_mas_consumida: 'Agua',
          hora_pico_hidratacion: '14:00',
          recomendacion: 'Mantén una hidratación constante durante el día',
          patrones: ['Consumo regular de agua'],
          sugerencias: ['Actualiza a Premium para insights avanzados']
        };
      }

      // Usuario premium, hacer petición HTTP
      return await apiService.get<Insights>(`/premium/stats/insights/?days=${days}`);
    } catch (error) {
      // Si hay error decodificando el token o en la petición, devolver insights básicos
      console.warn('Error obteniendo insights premium, usando datos básicos:', error);
      return {
        bebida_mas_consumida: 'Agua',
        hora_pico_hidratacion: '14:00',
        recomendacion: 'Mantén una hidratación constante durante el día',
        patrones: ['Consumo regular de agua'],
        sugerencias: ['Actualiza a Premium para insights avanzados']
      };
    }
  }

  /**
   * Obtener estadísticas con caché
   */
  async getEstadisticasCacheadas(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<Record<string, unknown>> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    return await apiService.get<Record<string, unknown>>(`/consumos/cached_stats/?period=${period}&tz=${encodeURIComponent(tz)}&tz_offset_minutes=${tz_offset_minutes}`);
  }

  /**
   * Test de performance
   */
  async getPerformanceTest(): Promise<Record<string, unknown>> {
    return await apiService.get<Record<string, unknown>>('/consumos/performance_test/');
  }
}

class BebidasService {
  /**
   * Obtener lista de bebidas
   */
  async getBebidas(filters?: {
    es_agua?: boolean;
    es_premium?: boolean;
    activa?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Bebida>> {
    return await apiService.get<PaginatedResponse<Bebida>>('/bebidas/', filters);
  }

  /**
   * Obtener bebida específica
   */
  async getBebida(id: number): Promise<Bebida> {
    return await apiService.get<Bebida>(`/bebidas/${id}/`);
  }

  /**
   * Obtener bebidas premium (solo para usuarios premium)
   */
  async getBebidasPremium(): Promise<Bebida[]> {
    return await apiService.get<Bebida[]>('/premium/beverages/');
  }
}

class RecipientesService {
  /**
   * Obtener lista de recipientes del usuario
   */
  async getRecipientes(): Promise<PaginatedResponse<Recipiente>> {
    return await apiService.get<PaginatedResponse<Recipiente>>('/recipientes/');
  }

  /**
   * Obtener recipiente específico
   */
  async getRecipiente(id: number): Promise<Recipiente> {
    return await apiService.get<Recipiente>(`/recipientes/${id}/`);
  }

  /**
   * Crear nuevo recipiente
   */
  async createRecipiente(recipiente: Omit<Recipiente, 'id' | 'usuario' | 'fecha_creacion'>): Promise<Recipiente> {
    return await apiService.post<Recipiente>('/recipientes/', recipiente);
  }

  /**
   * Actualizar recipiente
   */
  async updateRecipiente(id: number, recipiente: Partial<Recipiente>): Promise<Recipiente> {
    return await apiService.put<Recipiente>(`/recipientes/${id}/`, recipiente);
  }

  /**
   * Eliminar recipiente
   */
  async deleteRecipiente(id: number): Promise<void> {
    return await apiService.delete<void>(`/recipientes/${id}/`);
  }
}

class MetasService {
  /**
   * Obtener meta diaria actual
   */
  async getMetaDiaria(fecha?: string): Promise<MetaDiaria> {
    const params = fecha ? { fecha } : {};
    return await apiService.get<MetaDiaria>('/metas-diarias/', params);
  }

  /**
   * Crear o actualizar meta diaria
   */
  async setMetaDiaria(meta: { fecha: string; meta_ml: number }): Promise<MetaDiaria> {
    return await apiService.post<MetaDiaria>('/metas-diarias/', meta);
  }

  /**
   * Obtener meta fija (usuarios gratuitos)
   */
  async getMetaFija(): Promise<{ meta_ml: number; descripcion: string }> {
    return await apiService.get<{ meta_ml: number; descripcion: string }>('/goals/');
  }

  /**
   * Obtener meta personalizada (usuarios premium)
   */
  async getMetaPersonalizada(): Promise<{ meta_ml: number; peso_kg: number; nivel_actividad: string; factor_actividad: number; formula_usada: string }> {
    return await apiService.get('/premium/goal/');
  }
}

class RecordatoriosService {
  async getRecordatorios(): Promise<PaginatedResponse<Recordatorio>> {
    return await apiService.get<PaginatedResponse<Recordatorio>>('/recordatorios/');
  }

  async getRecordatorio(id: number): Promise<Recordatorio> {
    return await apiService.get<Recordatorio>(`/recordatorios/${id}/`);
  }

  async createRecordatorio(data: RecordatorioForm): Promise<Recordatorio> {
    return await apiService.post<Recordatorio>('/recordatorios/', data);
  }

  async updateRecordatorio(id: number, data: Partial<RecordatorioForm>): Promise<Recordatorio> {
    return await apiService.put<Recordatorio>(`/recordatorios/${id}/`, data);
  }

  async deleteRecordatorio(id: number): Promise<void> {
    return await apiService.delete<void>(`/recordatorios/${id}/`);
  }
}

// Instancias singleton de los servicios
export const consumosService = new ConsumosService();
export const bebidasService = new BebidasService();
export const recipientesService = new RecipientesService();
export const metasService = new MetasService();
export const recordatoriosService = new RecordatoriosService();

export default {
  consumos: consumosService,
  bebidas: bebidasService,
  recipientes: recipientesService,
  metas: metasService,
  recordatorios: recordatoriosService
};
