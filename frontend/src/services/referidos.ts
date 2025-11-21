import { apiService } from './api';

export interface ReferidosInfo {
  codigo_referido: string;
  referidos_verificados: number;
  referidos_pendientes: number;
  recompensas_reclamadas: number;
  tiene_recompensa_disponible: boolean;
  progreso: {
    actual: number;
    necesarios: number;
    porcentaje: number;
  };
}

export interface ReclamarRecompensaResponse {
  message: string;
  recompensas_reclamadas: number;
  es_premium: boolean;
  referidos_pendientes: number;
}

class ReferidosService {
  /**
   * Obtener información de referidos del usuario autenticado
   */
  async getReferidosInfo(): Promise<ReferidosInfo> {
    return await apiService.get<ReferidosInfo>('/referidos/info/');
  }

  /**
   * Reclamar recompensa de referidos (1 mes Premium gratis)
   */
  async reclamarRecompensa(): Promise<ReclamarRecompensaResponse> {
    return await apiService.post<ReclamarRecompensaResponse>('/referidos/reclamar/');
  }
}

// Instancia singleton del servicio de referidos
export const referidosService = new ReferidosService();

