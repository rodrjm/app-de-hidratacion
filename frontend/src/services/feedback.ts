import { apiService } from './api';

export interface FeedbackForm {
  tipo: 'idea_sugerencia' | 'reporte_error' | 'pregunta_general';
  mensaje: string;
}

export interface Feedback {
  id: number;
  tipo: 'idea_sugerencia' | 'reporte_error' | 'pregunta_general';
  mensaje: string;
  fecha_creacion: string;
}

class FeedbackService {
  /**
   * Crear un feedback general (disponible para todos los usuarios autenticados)
   */
  async createFeedback(feedback: FeedbackForm): Promise<Feedback> {
    return await apiService.post<Feedback>('/users/feedback/', feedback);
  }
}

export const feedbackService = new FeedbackService();

