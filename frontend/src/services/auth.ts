import { apiService } from './api';
import { User, LoginForm, RegisterForm } from '@/types';

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface LoginResponse extends AuthResponse {}

export interface RegisterResponse extends AuthResponse {}

class AuthService {
  /**
   * Iniciar sesión
   */
  async login(credentials: LoginForm): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>('/login/', credentials);
      
      // Guardar tokens
      apiService.setToken(response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      return response;
    } catch (error) {
      throw new Error('Credenciales inválidas');
    }
  }

  /**
   * Registro de usuario
   */
  async register(userData: RegisterForm): Promise<RegisterResponse> {
    try {
      const response = await apiService.post<RegisterResponse>('/register/', userData);
      
      // Guardar tokens
      apiService.setToken(response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      return response;
    } catch (error) {
      throw new Error('Error al crear la cuenta');
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      await apiService.post('/logout/');
    } catch (error) {
      // Continuar con el logout aunque falle la petición
      console.warn('Error al cerrar sesión en el servidor:', error);
    } finally {
      // Limpiar tokens locales
      apiService.clearToken();
    }
  }

  /**
   * Renovar token de acceso
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No hay token de renovación');
      }

      const response = await apiService.post<{ access: string }>('/token/refresh/', {
        refresh: refreshToken
      });

      apiService.setToken(response.access);
      return response.access;
    } catch (error) {
      // Si falla la renovación, limpiar tokens
      apiService.clearToken();
      throw new Error('Sesión expirada. Inicia sesión nuevamente.');
    }
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<User>('/profile/');
      return response;
    } catch (error) {
      throw new Error('Error al obtener datos del usuario');
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiService.put<User>('/profile/', userData);
      return response;
    } catch (error) {
      throw new Error('Error al actualizar el perfil');
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiService.post('/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });
    } catch (error) {
      throw new Error('Error al cambiar la contraseña');
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!apiService.getToken();
  }

  /**
   * Obtener token de acceso actual
   */
  getAccessToken(): string | null {
    return apiService.getToken();
  }

  /**
   * Verificar si el token está próximo a expirar
   */
  isTokenExpiring(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      // Decodificar JWT (solo para verificar expiración)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      // Considerar que está próximo a expirar si quedan menos de 5 minutos
      return timeUntilExpiry < 300;
    } catch (error) {
      return true;
    }
  }

  /**
   * Auto-renovar token si es necesario
   */
  async ensureValidToken(): Promise<string | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    if (this.isTokenExpiring()) {
      try {
        return await this.refreshToken();
      } catch (error) {
        // Si falla la renovación, limpiar sesión
        apiService.clearToken();
        return null;
      }
    }

    return this.getAccessToken();
  }

  /**
   * Verificar disponibilidad de username
   */
  async checkUsername(username: string): Promise<{ available: boolean }> {
    try {
      const response = await apiService.get<{ available: boolean }>('/check-username/', {
        username
      });
      return response;
    } catch (error) {
      throw new Error('Error al verificar username');
    }
  }

  /**
   * Verificar disponibilidad de email
   */
  async checkEmail(email: string): Promise<{ available: boolean }> {
    try {
      const response = await apiService.get<{ available: boolean }>('/check-email/', {
        email
      });
      return response;
    } catch (error) {
      throw new Error('Error al verificar email');
    }
  }
}

// Instancia singleton del servicio de autenticación
export const authService = new AuthService();
export default authService;