/**
 * Servicio centralizado para realizar peticiones HTTP a la API.
 * 
 * Este servicio maneja:
 * - Autenticación JWT automática
 * - Renovación de tokens
 * - Manejo centralizado de errores
 * - Interceptores de request/response
 * 
 * @module services/api
 * @example
 * ```typescript
 * import apiService from '@/services/api';
 * 
 * const data = await apiService.get('/api/consumos/');
 * await apiService.post('/api/consumos/', { cantidad_ml: 250 });
 * ```
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Configuración base de la API
// En producción, usar la URL del backend desplegado
// En desarrollo, usar localhost
const getApiBaseUrl = () => {
  // En tiempo de ejecución, verificar si hay una variable global (inyectada por Nginx)
  if (typeof window !== 'undefined' && (window as any).__API_URL__) {
    return (window as any).__API_URL__;
  }
  // Usar la variable de entorno de Vite (reemplazada en build time)
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  // Fallback: usar la URL de producción por defecto
  // Esto evita que la app intente conectarse a localhost en producción
  return 'https://dosis-vital.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log para debugging (siempre en producción para diagnosticar)
console.log('API Service: Base URL configured as:', API_BASE_URL);

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  private setupInterceptors() {
    // Interceptor de request
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor de response
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Manejar errores 401 (No autenticado)
        if (error.response?.status === 401) {
          const currentPath = window.location.pathname;
          
          // Solo redirigir si no estamos en login/register y hay token
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            // Verificar en ambos storages
            const rememberMe = localStorage.getItem('rememberMe') === 'true';
            const storage = rememberMe ? localStorage : sessionStorage;
            const hasToken = storage.getItem('access_token') || sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
            
            // Si hay token pero falla, probablemente expiró - limpiar y redirigir
            if (hasToken) {
              this.clearToken();
              
              // Evitar múltiples redirecciones con un flag
              const w = window as unknown as { __redirectingToLogin?: boolean };
              if (!w.__redirectingToLogin) {
                w.__redirectingToLogin = true;
                setTimeout(() => {
                  w.__redirectingToLogin = false;
                }, 1000);
                
                window.location.href = '/login';
                return Promise.reject(error);
              }
            }
          }
        }
        
        if (error.response?.status >= 500) {
          toast.error('Error del servidor. Inténtalo más tarde.');
        }
        
        return Promise.reject(error);
      }
    );
  }

  private loadTokenFromStorage() {
    // Buscar token en ambos storages para asegurar que se encuentre
    // Primero verificar localStorage (para usuarios con "Recordarme")
    let token = localStorage.getItem('access_token');
    
    // Si no hay token en localStorage, buscar en sessionStorage
    if (!token) {
      token = sessionStorage.getItem('access_token');
    }
    
    // Si encontramos un token en localStorage pero no hay preferencia de rememberMe,
    // establecerla automáticamente
    if (token && localStorage.getItem('access_token') && !localStorage.getItem('rememberMe')) {
      localStorage.setItem('rememberMe', 'true');
    }
    
    if (token) {
      this.token = token;
    }
  }

  private getStorage(): Storage {
    // Determinar qué storage usar basado en la preferencia de "Recordarme"
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    return rememberMe ? localStorage : sessionStorage;
  }

  public setToken(token: string) {
    this.token = token;
    const storage = this.getStorage();
    storage.setItem('access_token', token);
  }

  public clearToken() {
    this.token = null;
    // Limpiar de ambos storages para asegurar limpieza completa
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('rememberMe');
  }

  public getToken(): string | null {
    // Si ya hay token en memoria, retornarlo
    if (this.token) {
      return this.token;
    }
    
    // Si no hay token en memoria, buscar en ambos storages
    // Primero verificar localStorage (para usuarios con "Recordarme")
    let token = localStorage.getItem('access_token');
    
    // Si no hay token en localStorage, buscar en sessionStorage
    if (!token) {
      token = sessionStorage.getItem('access_token');
    }
    
    // Si encontramos un token, guardarlo en memoria
    if (token) {
      this.token = token;
    }
    
    return token;
  }

  public async get<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.get(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async post<T>(url: string, data?: unknown, config?: { params?: Record<string, string | number | boolean | undefined> }): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async patch<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.patch(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    type ResponseLike = { data?: unknown; status?: number };
    const err = error as { response?: ResponseLike; request?: unknown };
    if (err.response) {
      // Error de respuesta del servidor
      const data = err.response.data as Record<string, unknown> | undefined;
      // Intentar extraer mensajes de validación de DRF (dict de campos)
      if (err.response.status === 400 && data && typeof data === 'object' && !Array.isArray(data)) {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          return new Error(String(firstVal[0]));
        }
        if (typeof firstVal === 'string') {
          return new Error(firstVal);
        }
      }
      const message = (data && typeof data === 'object' && ('detail' in data ? String(data.detail) : 'message' in data ? String(data.message) : 'Error del servidor')) || 'Error del servidor';
      return new Error(message);
    } else if (err.request) {
      // Error de red
      return new Error('Error de conexión. Verifica tu internet.');
    } else {
      // Error de configuración
      return new Error('Error inesperado');
    }
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService();
export default apiService;
