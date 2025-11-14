import { apiService } from './api';
import { 
  EstadoSuscripcion, 
  FuncionalidadesPremium, 
  LimitesUso,
  MetaPersonalizada 
} from '@/types';

class MonetizationService {
  /**
   * Obtener estado de suscripción del usuario
   */
  async getSubscriptionStatus(): Promise<EstadoSuscripcion> {
    return await apiService.get<EstadoSuscripcion>('/monetization/status/');
  }

  /**
   * Obtener funcionalidades premium disponibles
   */
  async getPremiumFeatures(): Promise<FuncionalidadesPremium> {
    return await apiService.get<FuncionalidadesPremium>('/monetization/features/');
  }

  /**
   * Obtener límites de uso actuales
   */
  async getUsageLimits(): Promise<LimitesUso> {
    return await apiService.get<LimitesUso>('/monetization/limits/');
  }

  /**
   * Obtener estadísticas de monetización
   */
  async getMonetizationStats(): Promise<Record<string, unknown>> {
    return await apiService.get<Record<string, unknown>>('/monetization/stats/');
  }

  /**
   * Obtener prompt de actualización personalizado
   */
  async getUpgradePrompt(): Promise<{ message: string; features: string[] }> {
    return await apiService.get('/monetization/upgrade/');
  }

  /**
   * Verificar si el usuario tiene anuncios deshabilitados
   */
  async getNoAdsStatus(): Promise<{ is_premium: boolean }> {
    return await apiService.get('/monetization/no-ads/');
  }

  /**
   * Obtener meta personalizada (usuarios premium)
   */
  async getPersonalizedGoal(): Promise<MetaPersonalizada> {
    return await apiService.get('/premium/goal/');
  }

  /**
   * Obtener bebidas premium
   */
  async getPremiumBeverages(): Promise<Array<Record<string, unknown>>> {
    return await apiService.get<Array<Record<string, unknown>>>('/premium/beverages/');
  }

  /**
   * Obtener recordatorios ilimitados (usuarios premium)
   */
  async getUnlimitedReminders(): Promise<Array<Record<string, unknown>>> {
    return await apiService.get<Array<Record<string, unknown>>>('/premium/reminders/');
  }

  /**
   * Crear recordatorio premium
   */
  async createPremiumReminder(reminderData: Record<string, unknown>): Promise<Record<string, unknown>> {
    return await apiService.post<Record<string, unknown>>('/premium/reminders/', reminderData);
  }

  /**
   * Actualizar recordatorio premium
   */
  async updatePremiumReminder(id: number, reminderData: Record<string, unknown>): Promise<Record<string, unknown>> {
    return await apiService.put<Record<string, unknown>>(`/premium/reminders/${id}/`, reminderData);
  }

  /**
   * Eliminar recordatorio premium
   */
  async deletePremiumReminder(id: number): Promise<void> {
    return await apiService.delete(`/premium/reminders/${id}/`);
  }

  /**
   * Obtener historial detallado de consumos (premium)
   */
  async getConsumptionHistory(): Promise<Array<Record<string, unknown>>> {
    return await apiService.get<Array<Record<string, unknown>>>('/premium/stats/history/');
  }

  /**
   * Obtener resumen agregado de consumos (premium)
   */
  async getConsumptionSummary(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<Array<Record<string, unknown>>> {
    return await apiService.get<Array<Record<string, unknown>>>(`/premium/stats/summary/?period=${period}`);
  }

  /**
   * Obtener tendencias de consumo (premium)
   */
  async getConsumptionTrends(): Promise<Record<string, unknown>> {
    return await apiService.get<Record<string, unknown>>('/premium/stats/trends/');
  }

  /**
   * Obtener insights personalizados (premium)
   */
  async getConsumptionInsights(days: number = 30): Promise<Record<string, unknown>> {
    return await apiService.get<Record<string, unknown>>(`/premium/stats/insights/?days=${days}`);
  }
}

// Instancia singleton del servicio de monetización
export const monetizationService = new MonetizationService();
export default monetizationService;
