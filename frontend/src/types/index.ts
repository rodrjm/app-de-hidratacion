// Tipos principales de la aplicación HydroTracker

export interface User {
  id: number;
  username: string;
  email: string;
  peso?: number;
  edad?: number;
  es_premium: boolean;
  meta_diaria_ml: number;
  nivel_actividad: 'sedentario' | 'ligero' | 'moderado' | 'intenso' | 'muy_intenso';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Bebida {
  id: number;
  nombre: string;
  factor_hidratacion: number;
  descripcion?: string;
  es_agua: boolean;
  es_premium: boolean;
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
  cantidad_hidratacion_efectiva: number;
  fecha_hora: string;
  bebida: Bebida;
  recipiente: Recipiente;
  usuario: number;
  nivel_sed?: number;
  estado_animo?: number;
  notas?: string;
  ubicacion?: string;
}

export interface MetaDiaria {
  id: number;
  fecha: string;
  meta_ml: number;
  consumido_ml: number;
  hidratacion_efectiva_ml: number;
  completada: boolean;
  progreso_porcentaje: number;
  usuario: number;
}

export interface Recordatorio {
  id: number;
  hora: string;
  mensaje?: string;
  activo: boolean;
  dias_semana: number[];
  tipo_recordatorio: 'agua' | 'meta' | 'personalizado';
  frecuencia: 'diario' | 'dias_laborales' | 'fines_semana' | 'personalizado';
  sonido: string;
  vibracion: boolean;
  usuario: number;
  fecha_creacion: string;
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

export interface EstadisticasSemanales {
  semana_inicio: string;
  semana_fin: string;
  total_ml: number;
  promedio_diario_ml: number;
  dias_completados: number;
  dias_activos: number;
  meta_semanal_ml: number;
  progreso_porcentaje: number;
}

export interface EstadisticasMensuales {
  mes: string;
  total_ml: number;
  promedio_diario_ml: number;
  dias_completados: number;
  dias_activos: number;
  meta_mensual_ml: number;
  progreso_porcentaje: number;
}

export interface Tendencias {
  periodo: 'daily' | 'weekly' | 'monthly';
  tendencia: 'mejorando' | 'estable' | 'empeorando';
  cambio_porcentaje: number;
  mensaje: string;
  datos: Array<{
    fecha: string;
    valor: number;
  }>;
}

export interface Insights {
  bebida_mas_consumida: string;
  hora_pico_hidratacion: string;
  recomendacion: string;
  patrones: string[];
  sugerencias: string[];
}

export interface EstadoSuscripcion {
  is_premium: boolean;
  subscription_end_date?: string;
}

export interface FuncionalidadesPremium {
  features: string[];
}

export interface LimitesUso {
  is_premium: boolean;
  recordatorios: {
    limite: number | string;
    actual: number;
    restante: number;
  };
  consumos_diarios: {
    limite: number | string;
    actual: number;
    restante: number;
  };
}

export interface MetaPersonalizada {
  meta_ml: number;
  peso_kg?: number;
  nivel_actividad: string;
  factor_actividad: number;
  formula_usada: string;
}

// Tipos para formularios
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  peso?: number;
  edad?: number;
  nivel_actividad: string;
}

export interface ConsumoForm {
  bebida: number;
  recipiente: number;
  cantidad_ml: number;
  nivel_sed?: number;
  estado_animo?: number;
  notas?: string;
  ubicacion?: string;
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

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Tipos para estado de la aplicación
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ConsumoState {
  consumos: Consumo[];
  bebidas: Bebida[];
  recipientes: Recipiente[];
  metaDiaria: MetaDiaria | null;
  estadisticas: EstadisticasDiarias | null;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: {
    addConsumo: boolean;
    addRecipiente: boolean;
    settings: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

// Tipos para componentes
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'strong';
}

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export interface ChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  type: 'line' | 'bar' | 'pie' | 'area';
  width?: number;
  height?: number;
  responsive?: boolean;
}

// Tipos para hooks
export interface UseConsumoReturn {
  consumos: Consumo[];
  isLoading: boolean;
  error: string | null;
  addConsumo: (consumo: ConsumoForm) => Promise<void>;
  updateConsumo: (id: number, consumo: Partial<ConsumoForm>) => Promise<void>;
  deleteConsumo: (id: number) => Promise<void>;
  refreshConsumos: () => Promise<void>;
}

export interface UseEstadisticasReturn {
  estadisticas: EstadisticasDiarias | null;
  tendencias: Tendencias | null;
  insights: Insights | null;
  isLoading: boolean;
  error: string | null;
  refreshEstadisticas: () => Promise<void>;
}

// Tipos para servicios
export interface ApiService {
  get: <T>(url: string, params?: Record<string, any>) => Promise<T>;
  post: <T>(url: string, data?: any) => Promise<T>;
  put: <T>(url: string, data?: any) => Promise<T>;
  delete: <T>(url: string) => Promise<T>;
  patch: <T>(url: string, data?: any) => Promise<T>;
}

export interface AuthService {
  login: (credentials: LoginForm) => Promise<{ user: User; tokens: { access: string; refresh: string } }>;
  register: (userData: RegisterForm) => Promise<{ user: User; tokens: { access: string; refresh: string } }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  getCurrentUser: () => Promise<User>;
}

// Tipos para utilidades
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface FilterOptions {
  fecha_inicio?: string;
  fecha_fin?: string;
  bebida?: number;
  recipiente?: number;
  search?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Tipos para PWA
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ServiceWorkerMessage {
  type: 'CACHE_UPDATED' | 'NOTIFICATION_CLICKED' | 'BACKGROUND_SYNC';
  payload?: any;
}
