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
  SortOptions
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
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
      ...filters
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
    return await apiService.post<Consumo>('/consumos/', consumo);
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
    const params = fecha ? { date: fecha } : {};
    return await apiService.get<EstadisticasDiarias>('/consumos/stats/', params);
  }

  /**
   * Obtener estadísticas semanales
   */
  async getEstadisticasSemanales(): Promise<EstadisticasSemanales> {
    return await apiService.get<EstadisticasSemanales>('/consumos/stats/?period=weekly');
  }

  /**
   * Obtener estadísticas mensuales
   */
  async getEstadisticasMensuales(): Promise<EstadisticasMensuales> {
    return await apiService.get<EstadisticasMensuales>('/consumos/stats/?period=monthly');
  }

  /**
   * Obtener tendencias de consumo
   */
  async getTendencias(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<Tendencias> {
    return await apiService.get<Tendencias>(`/consumos/trends/?period=${period}`);
  }

  /**
   * Obtener insights personalizados
   */
  async getInsights(days: number = 30): Promise<Insights> {
    return await apiService.get<Insights>(`/consumos/insights/?days=${days}`);
  }

  /**
   * Obtener estadísticas con caché
   */
  async getEstadisticasCacheadas(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any> {
    return await apiService.get(`/consumos/cached_stats/?period=${period}`);
  }

  /**
   * Test de performance
   */
  async getPerformanceTest(): Promise<any> {
    return await apiService.get('/consumos/performance_test/');
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

// Instancias singleton de los servicios
export const consumosService = new ConsumosService();
export const bebidasService = new BebidasService();
export const recipientesService = new RecipientesService();
export const metasService = new MetasService();

export default {
  consumos: consumosService,
  bebidas: bebidasService,
  recipientes: recipientesService,
  metas: metasService
};
