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
  async getMonetizationStats(): Promise<any> {
    return await apiService.get('/monetization/stats/');
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
  async getPremiumBeverages(): Promise<any[]> {
    return await apiService.get('/premium/beverages/');
  }

  /**
   * Obtener recordatorios ilimitados (usuarios premium)
   */
  async getUnlimitedReminders(): Promise<any[]> {
    return await apiService.get('/premium/reminders/');
  }

  /**
   * Crear recordatorio premium
   */
  async createPremiumReminder(reminderData: any): Promise<any> {
    return await apiService.post('/premium/reminders/', reminderData);
  }

  /**
   * Actualizar recordatorio premium
   */
  async updatePremiumReminder(id: number, reminderData: any): Promise<any> {
    return await apiService.put(`/premium/reminders/${id}/`, reminderData);
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
  async getConsumptionHistory(): Promise<any[]> {
    return await apiService.get('/premium/stats/history/');
  }

  /**
   * Obtener resumen agregado de consumos (premium)
   */
  async getConsumptionSummary(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any[]> {
    return await apiService.get(`/premium/stats/summary/?period=${period}`);
  }

  /**
   * Obtener tendencias de consumo (premium)
   */
  async getConsumptionTrends(): Promise<any> {
    return await apiService.get('/premium/stats/trends/');
  }

  /**
   * Obtener insights personalizados (premium)
   */
  async getConsumptionInsights(days: number = 30): Promise<any> {
    return await apiService.get(`/premium/stats/insights/?days=${days}`);
  }
}

// Instancia singleton del servicio de monetización
export const monetizationService = new MonetizationService();
export default monetizationService;
