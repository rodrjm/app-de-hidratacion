import api from "./api";

export type FeedbackTipo = "idea_sugerencia" | "reporte_error" | "pregunta_general";

export interface FeedbackForm {
  tipo: FeedbackTipo;
  mensaje: string;
}

export interface Feedback {
  id: number;
  tipo: FeedbackTipo;
  mensaje: string;
  fecha_creacion: string;
}

export const feedbackService = {
  async createFeedback(payload: FeedbackForm): Promise<Feedback> {
    const { data } = await api.post<Feedback>("/users/feedback/", payload);
    return data;
  },
};

