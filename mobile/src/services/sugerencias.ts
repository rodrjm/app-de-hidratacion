import api from "./api";

export interface SugerenciaForm {
  tipo: "bebida" | "actividad";
  nombre: string;
  comentarios?: string;
  intensidad_estimada?: "baja" | "media" | "alta";
}

export interface Sugerencia {
  id: number;
  tipo: "bebida" | "actividad";
  nombre: string;
  comentarios?: string;
  intensidad_estimada?: "baja" | "media" | "alta";
  fecha_creacion: string;
}

class SugerenciasService {
  /**
   * Crear una sugerencia de bebida o actividad (solo para usuarios premium)
   */
  async createSugerencia(sugerencia: SugerenciaForm): Promise<Sugerencia> {
    const { data } = await api.post<Sugerencia>("/users/sugerencias/", sugerencia);
    return data;
  }
}

export const sugerenciasService = new SugerenciasService();
