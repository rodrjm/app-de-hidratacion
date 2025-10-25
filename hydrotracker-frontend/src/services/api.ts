import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        
        if (error.response?.status >= 500) {
          toast.error('Error del servidor. Inténtalo más tarde.');
        }
        
        return Promise.reject(error);
      }
    );
  }

  private loadTokenFromStorage() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.setToken(token);
    }
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  public getToken(): string | null {
    return this.token;
  }

  public async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.get(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async patch<T>(url: string, data?: any): Promise<T> {
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

  private handleError(error: any): Error {
    if (error.response) {
      // Error de respuesta del servidor
      const message = error.response.data?.detail || error.response.data?.message || 'Error del servidor';
      return new Error(message);
    } else if (error.request) {
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
