import api from "./api";

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

export const referidosService = {
  async getReferidosInfo(): Promise<ReferidosInfo> {
    const { data } = await api.get<ReferidosInfo>("/users/referidos/info/");
    return data;
  },

  async reclamarRecompensa(): Promise<ReclamarRecompensaResponse> {
    const { data } = await api.post<ReclamarRecompensaResponse>("/users/referidos/reclamar/");
    return data;
  },
};

