export type TipoActividad =
  | "correr"
  | "ciclismo"
  | "natacion"
  | "futbol_rugby"
  | "baloncesto_voley"
  | "gimnasio"
  | "crossfit_hiit"
  | "padel_tenis"
  | "baile_aerobico"
  | "caminata_rapida"
  | "pilates"
  | "caminata"
  | "yoga_hatha"
  | "yoga_bikram";

export type Intensidad = "baja" | "media" | "alta";

export interface ActividadForm {
  tipo_actividad: TipoActividad;
  duracion_minutos: number;
  intensidad: Intensidad;
  fecha_hora: string; // ISO
}

export interface EstimateResponse {
  estimated_pse_ml: number;
  weather_message?: string | null;
  climate_adjustment?: string | null;
}

export interface CreatedActivity {
  id: number;
  tipo_actividad: string;
  duracion_minutos: number;
  intensidad: string;
  fecha_hora: string;
  pse_calculado: number;
  weather_message?: string | null;
  climate_adjustment?: string | null;
}

// Actividad from API list/detail
export interface Actividad {
  id: number;
  usuario: number;
  tipo_actividad: string;
  tipo_actividad_display?: string;
  duracion_minutos: number;
  intensidad: string;
  intensidad_display?: string;
  fecha_hora: string;
  pse_calculado: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface EstadisticasDiarias {
  fecha: string;
  total_ml: number;
  total_hidratacion_efectiva_ml: number;
  cantidad_consumos: number;
  meta_ml: number;
  progreso_porcentaje: number;
  completada: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  peso: number;
  edad?: number;
  fecha_nacimiento: string;
  es_fragil_o_insuficiencia_cardiaca?: boolean;
  es_premium: boolean;
  meta_diaria_ml?: number;
  nivel_actividad?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  /** Recordatorios de hidratación (perfil usuario) */
  recordar_notificaciones?: boolean;
  hora_inicio?: string; // "08:00"
  hora_fin?: string; // "22:00"
  intervalo_notificaciones?: number; // minutos (15–480)
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirmPassword?: string;
  peso: number;
  peso_unidad?: "kg" | "lb";
  fecha_nacimiento: string;
  es_fragil_o_insuficiencia_cardiaca?: boolean;
  codigo_referido?: string;
  acceptTerms?: boolean;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface RegisterBackendResponse {
  user: User;
  tokens: { access: string; refresh: string };
}

// Consumos / Hidratación
export interface Bebida {
  id: number;
  nombre: string;
  factor_hidratacion: number;
  descripcion?: string;
  es_agua: boolean;
  es_premium: boolean;
  es_alcoholica?: boolean;
  calorias_por_ml: number;
  activa: boolean;
  fecha_creacion: string;
}

export interface Recipiente {
  id: number;
  nombre: string;
  cantidad_ml: number;
  color?: string;
  icono?: string;
  es_favorito: boolean;
  usuario: number;
  fecha_creacion: string;
}

export interface Consumo {
  id: number;
  cantidad_ml: number;
  /** Hidratación efectiva (API devuelve hidratacion_efectiva_ml) */
  cantidad_hidratacion_efectiva?: number;
  hidratacion_efectiva_ml?: number;
  fecha_hora: string;
  bebida: Bebida | number;
  recipiente: Recipiente | number | null;
  usuario: number;
  notas?: string;
  bebida_nombre?: string;
  recipiente_nombre?: string;
  fecha_formateada?: string;
  hora_formateada?: string;
}

export interface ConsumoForm {
  bebida: number;
  recipiente?: number | null;
  cantidad_ml: number;
  nivel_sed?: number;
  estado_animo?: string;
  notas?: string;
  ubicacion?: string;
  fecha_hora?: string;
}

export interface Recordatorio {
  id: number;
  hora: string;
  mensaje?: string;
  activo: boolean;
  dias_semana: number[];
  tipo_recordatorio: "agua" | "meta" | "personalizado";
  frecuencia: "diario" | "dias_laborales" | "fines_semana" | "personalizado";
  sonido: string;
  vibracion: boolean;
  usuario: number;
  fecha_creacion?: string;
}

export interface RecordatorioForm {
  hora: string;
  mensaje?: string;
  dias_semana: number[];
  tipo_recordatorio: string;
  frecuencia: string;
  sonido: string;
  vibracion: boolean;
}

export interface EstadoSuscripcion {
  is_premium: boolean;
  subscription_end_date?: string;
  plan_type?: "monthly" | "annual" | "lifetime" | null;
  /** false = usuario ya solicitó cancelación; mantiene acceso hasta subscription_end_date */
  auto_renewal?: boolean | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface Tendencias {
  periodo: "daily" | "weekly" | "monthly";
  tendencia: "mejorando" | "estable" | "empeorando";
  cambio_porcentaje: number;
  mensaje: string;
  datos: Array<{
    fecha: string;
    valor: number;
  }>;
  total_anterior?: number;
  total_actual?: number;
}

export interface Insights {
  bebida_mas_consumida: string;
  hora_pico_hidratacion: string;
  recomendacion: string;
  patrones: string[];
  sugerencias: string[];
}
