import { apiService } from './api';
import { Actividad, ActividadForm } from '@/types';

export const actividadesService = {
  /**
   * Obtiene todas las actividades del usuario
   */
  async getActividades(params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    tipo_actividad?: string;
  }): Promise<Actividad[]> {
    const queryParams = new URLSearchParams();
    if (params?.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params?.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    if (params?.tipo_actividad) queryParams.append('tipo_actividad', params.tipo_actividad);
    
    const url = `/actividades/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiService.get<Actividad[]>(url);
    return response;
  },

  /**
   * Obtiene las actividades del día actual
   */
  async getActividadesHoy(): Promise<Actividad[]> {
    const response = await apiService.get<Actividad[]>('/actividades/hoy/');
    return response;
  },

  /**
   * Obtiene un resumen de actividades del día
   */
  async getResumenDia(fecha?: string): Promise<{
    fecha: string;
    cantidad_actividades: number;
    pse_total: number;
    actividades: Actividad[];
  }> {
    const url = fecha 
      ? `/actividades/resumen_dia/?fecha=${fecha}`
      : '/actividades/resumen_dia/';
    const response = await apiService.get(url);
    return response;
  },

  /**
   * Crea una nueva actividad
   */
  async createActividad(data: ActividadForm): Promise<Actividad> {
    const response = await apiService.post<Actividad>('/actividades/', data);
    return response;
  },

  /**
   * Actualiza una actividad existente
   */
  async updateActividad(id: number, data: Partial<ActividadCreate>): Promise<Actividad> {
    const response = await apiService.put<Actividad>(`/actividades/${id}/`, data);
    return response;
  },

  /**
   * Elimina una actividad
   */
  async deleteActividad(id: number): Promise<void> {
    await apiService.delete(`/actividades/${id}/`);
  },

  /**
   * Obtiene una actividad por ID
   */
  async getActividad(id: number): Promise<Actividad> {
    const response = await apiService.get<Actividad>(`/actividades/${id}/`);
    return response;
  },
};

