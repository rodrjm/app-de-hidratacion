/**
 * Servicio de actividades para la app móvil.
 * Listar, crear, estimar (PSE) con clima.
 */
import api from "./api";
import type {
  ActividadForm,
  EstimateResponse,
  CreatedActivity,
  Actividad,
  EstadisticasDiarias,
} from "../types";

export interface ResumenDia {
  fecha: string;
  cantidad_actividades: number;
  pse_total: number;
  actividades: Actividad[];
}

export const activitiesService = {
  async list(params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    tipo_actividad?: string;
    page?: number;
    page_size?: number;
  }): Promise<Actividad[]> {
    const search = new URLSearchParams();
    if (params?.fecha_inicio) search.set("fecha_inicio", params.fecha_inicio);
    if (params?.fecha_fin) search.set("fecha_fin", params.fecha_fin);
    if (params?.tipo_actividad) search.set("tipo_actividad", params.tipo_actividad);
    if (params?.page) search.set("page", String(params.page));
    if (params?.page_size) search.set("page_size", String(params.page_size));
    const q = search.toString();
    const url = q ? `/actividades/?${q}` : "/actividades/";
    const { data } = await api.get<{ results?: Actividad[] } | Actividad[]>(url);
    if (data && typeof data === "object" && Array.isArray((data as { results?: Actividad[] }).results)) {
      return (data as { results: Actividad[] }).results;
    }
    return Array.isArray(data) ? data : [];
  },

  async hoy(): Promise<Actividad[]> {
    const { data } = await api.get<Actividad[]>("/actividades/hoy/");
    return Array.isArray(data) ? data : [];
  },

  async resumenDia(fecha?: string): Promise<ResumenDia> {
    const url = fecha ? `/actividades/resumen_dia/?fecha=${fecha}` : "/actividades/resumen_dia/";
    const { data } = await api.get<ResumenDia>(url);
    return data;
  },

  async estimate(params: {
    tipo_actividad: string;
    duracion_minutos: number;
    intensidad: string;
    fecha_hora: string;
    latitude: number;
    longitude: number;
    tz?: string;
  }): Promise<EstimateResponse> {
    const tz = params.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const body = {
      tipo_actividad: params.tipo_actividad,
      duracion_minutos: params.duracion_minutos,
      intensidad: params.intensidad,
      fecha_hora: params.fecha_hora,
      latitude: params.latitude,
      longitude: params.longitude,
      tz,
    };
    // Enviar tz también por query para asegurar que el backend lo reciba (hora correcta en mensaje de clima)
    const { data } = await api.post<EstimateResponse>("/actividades/estimate/", body, {
      params: { tz },
    });
    return data;
  },

  async create(payload: ActividadForm & { latitude?: number; longitude?: number; tz?: string }): Promise<CreatedActivity> {
    const body = {
      ...payload,
      tz: payload.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const { data } = await api.post<CreatedActivity>("/actividades/", body);
    return data;
  },

  async update(id: number, payload: Partial<ActividadForm> & { latitude?: number; longitude?: number; tz?: string }): Promise<Actividad> {
    const body = {
      ...payload,
      tz: payload.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const { data } = await api.put<Actividad>(`/actividades/${id}/`, body);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/actividades/${id}/`);
  },
};

export async function getEstadisticasDiarias(fecha?: string): Promise<EstadisticasDiarias> {
  const url = fecha ? `/consumos/daily_summary/?fecha=${fecha}` : "/consumos/daily_summary/";
  const { data } = await api.get<EstadisticasDiarias>(url);
  return data;
}
