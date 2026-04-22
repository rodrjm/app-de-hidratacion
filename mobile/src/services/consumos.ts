import api from "./api";
import type {
  Consumo,
  ConsumoForm,
  Bebida,
  Recipiente,
  EstadisticasDiarias,
  PaginatedResponse,
  Recordatorio,
  RecordatorioForm,
  Tendencias,
  Insights,
} from "../types";

// Servicio de consumos, bebidas y recipientes (adaptado desde el frontend web)

export const consumosService = {
  async getConsumos(
    page: number = 1,
    pageSize: number = 20,
    filters?: Record<string, string | number | boolean>,
  ): Promise<PaginatedResponse<Consumo>> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      page_size: pageSize,
      ...filters,
      tz,
      tz_offset_minutes,
    };
    const { data } = await api.get<PaginatedResponse<Consumo>>("/consumos/", { params });
    return data;
  },

  async createConsumo(consumo: ConsumoForm): Promise<Consumo> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    const { data } = await api.post<Consumo>("/consumos/", consumo, {
      params: { tz, tz_offset_minutes },
    });
    return data;
  },

  async syncOfflineConsumos(consumos: ConsumoForm[]): Promise<Consumo[]> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    const { data } = await api.post<Consumo[]>("/consumos/bulk/", consumos, {
      params: { tz, tz_offset_minutes },
    });
    return data;
  },

  async updateConsumo(id: number, consumo: Partial<ConsumoForm>): Promise<Consumo> {
    const { data } = await api.put<Consumo>(`/consumos/${id}/`, consumo);
    return data;
  },

  async deleteConsumo(id: number): Promise<void> {
    await api.delete(`/consumos/${id}/`);
  },

  async getEstadisticasDiarias(fecha?: string): Promise<EstadisticasDiarias> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    const params = fecha ? { fecha, tz, tz_offset_minutes } : { tz, tz_offset_minutes };
    const { data } = await api.get<EstadisticasDiarias>("/consumos/daily_summary/", { params });
    return data;
  },

  async getTendencias(
    period: "daily" | "weekly" | "monthly" = "weekly",
  ): Promise<Tendencias> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz_offset_minutes = new Date().getTimezoneOffset();
    const { data } = await api.get<Tendencias>(
      `/consumos/trends/?period=${period}&tz=${encodeURIComponent(tz)}&tz_offset_minutes=${tz_offset_minutes}`,
    );
    return data;
  },

  async getInsights(days: number = 30): Promise<Insights> {
    const { data } = await api.get<Insights>(`/premium/stats/insights/?days=${days}`);
    return data;
  },
};

export const bebidasService = {
  async getBebidas(filters?: {
    es_agua?: boolean;
    es_premium?: boolean;
    activa?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Bebida>> {
    const { data } = await api.get<PaginatedResponse<Bebida>>("/bebidas/", { params: filters });
    return data;
  },
};

export const recipientesService = {
  async getRecipientes(): Promise<PaginatedResponse<Recipiente>> {
    const { data } = await api.get<PaginatedResponse<Recipiente>>("/recipientes/");
    return data;
  },

  async createRecipiente(
    recipiente: Omit<Recipiente, "id" | "usuario" | "fecha_creacion">,
  ): Promise<Recipiente> {
    const { data } = await api.post<Recipiente>("/recipientes/", recipiente);
    return data;
  },

  async updateRecipiente(
    id: number,
    recipiente: Partial<Recipiente>,
  ): Promise<Recipiente> {
    const { data } = await api.put<Recipiente>(`/recipientes/${id}/`, recipiente);
    return data;
  },

  async deleteRecipiente(id: number): Promise<void> {
    await api.delete(`/recipientes/${id}/`);
  },
};

export const recordatoriosService = {
  async getRecordatorios(): Promise<PaginatedResponse<Recordatorio>> {
    const { data } = await api.get<PaginatedResponse<Recordatorio>>("/recordatorios/");
    return data;
  },

  async createRecordatorio(payload: RecordatorioForm): Promise<Recordatorio> {
    const { data } = await api.post<Recordatorio>("/recordatorios/", payload);
    return data;
  },

  async updateRecordatorio(
    id: number,
    payload: Partial<RecordatorioForm>,
  ): Promise<Recordatorio> {
    const { data } = await api.put<Recordatorio>(`/recordatorios/${id}/`, payload);
    return data;
  },

  async deleteRecordatorio(id: number): Promise<void> {
    await api.delete(`/recordatorios/${id}/`);
  },
};

