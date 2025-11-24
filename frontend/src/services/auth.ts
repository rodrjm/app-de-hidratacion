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

/**
 * Servicio de autenticación.
 * 
 * Maneja todas las operaciones relacionadas con autenticación:
 * - Login con email/password
 * - Registro de nuevos usuarios
 * - Login con Google OAuth
 * - Logout y limpieza de tokens
 * - Renovación automática de tokens
 * 
 * Los tokens se almacenan en sessionStorage para mayor seguridad
 * (se limpian al cerrar la pestaña del navegador).
 * 
 * @module services/auth
 * @example
 * ```typescript
 * import authService from '@/services/auth';
 * 
 * await authService.login('user@example.com', 'password');
 * await authService.logout();
 * ```
 */
class AuthService {
  /**
   * Inicia sesión con email y contraseña.
   * 
   * @param credentials - Credenciales de login (email, password y rememberMe opcional)
   * @returns Promise con datos del usuario y tokens JWT
   * @throws Error si las credenciales son inválidas
   * 
   * @example
   * ```typescript
   * try {
   *   const response = await authService.login({
   *     email: 'user@example.com',
   *     password: 'password123',
   *     rememberMe: true
   *   });
   *   console.log('Usuario autenticado:', response.user);
   * } catch (error) {
   *   console.error('Error de autenticación:', error);
   * }
   * ```
   */
  async login(credentials: LoginForm): Promise<LoginResponse> {
    try {
      const { rememberMe, ...loginData } = credentials;
      type LoginBackendResponse = { user: User; access: string; refresh: string };
      const response = await apiService.post<LoginBackendResponse>('/login/', loginData);
      
      // El backend devuelve access y refresh directamente, no dentro de tokens
      const loginResponse: LoginResponse = {
        user: response.user,
        tokens: {
          access: response.access,
          refresh: response.refresh
        }
      };
      
      // Usar localStorage si rememberMe es true, sessionStorage si es false
      const storage = rememberMe ? localStorage : sessionStorage;
      apiService.setToken(loginResponse.tokens.access);
      storage.setItem('refresh_token', loginResponse.tokens.refresh);
      
      // Guardar preferencia de "Recordarme" para futuras sesiones
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      return loginResponse;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown } };
      
      // Manejar errores específicos del login
      if (err.response?.status === 400) {
        const errorData = err.response.data as Record<string, unknown> | undefined;
        
        // Si hay errores específicos de campos
        if (errorData && 'email' in errorData) {
          throw new Error('Correo electrónico no encontrado. Verifica tu email.');
        } else if (errorData && 'password' in errorData) {
          throw new Error('Contraseña incorrecta. Inténtalo de nuevo.');
        } else if (errorData && 'non_field_errors' in errorData) {
          // Error general de credenciales
          throw new Error('Credenciales inválidas. Verifica tu correo electrónico y contraseña.');
        } else if (errorData && 'detail' in errorData) {
          const detail = (errorData as { detail?: unknown }).detail;
          throw new Error(String(detail));
        }
      } else if (err.response?.status === 401) {
        throw new Error('Credenciales inválidas. Verifica tu correo electrónico y contraseña.');
      } else if (err.response?.status === 404) {
        throw new Error('Correo electrónico no encontrado. Verifica tu email.');
      }
      
      // Error genérico si no se puede determinar el tipo específico
      throw new Error('Error al iniciar sesión. Inténtalo más tarde.');
    }
  }

  /**
   * Registro de usuario
   */
  async register(userData: RegisterForm): Promise<RegisterResponse> {
    try {
      type RegisterBackendResponse = { user: User; tokens: { access: string; refresh: string } };
      const response = await apiService.post<RegisterBackendResponse>('/register/', userData);
      
      // El backend devuelve access y refresh dentro de tokens
      const registerResponse: RegisterResponse = {
        user: response.user,
        tokens: {
          access: response.tokens.access,
          refresh: response.tokens.refresh
        }
      };
      
      // Guardar tokens en sessionStorage (más seguro que localStorage)
      apiService.setToken(registerResponse.tokens.access);
      sessionStorage.setItem('refresh_token', registerResponse.tokens.refresh);
      
      return registerResponse;
    } catch (error) {
      // Propagar el detalle del backend si existe
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al crear la cuenta');
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      // Buscar refresh token en el storage apropiado
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      const storage = rememberMe ? localStorage : sessionStorage;
      const refreshToken = storage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        await apiService.post('/logout/', { refresh_token: refreshToken });
      }
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
      // Buscar refresh token en el storage apropiado
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      const storage = rememberMe ? localStorage : sessionStorage;
      const refreshToken = storage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
      
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

  /**
   * Autenticación con Google
   */
  async loginWithGoogle(credential: string): Promise<{ user: User; tokens: { access: string; refresh: string }; is_new_user: boolean }> {
    try {
      type GoogleAuthResponse = { 
        user: User; 
        access: string; 
        refresh: string;
        is_new_user: boolean;
      };
      const response = await apiService.post<GoogleAuthResponse>('/users/google-auth/', {
        credential
      });
      
      // Guardar tokens en sessionStorage (más seguro que localStorage)
      apiService.setToken(response.access);
      sessionStorage.setItem('refresh_token', response.refresh);
      
      return {
        user: response.user,
        tokens: {
          access: response.access,
          refresh: response.refresh
        },
        is_new_user: response.is_new_user || false
      };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown } };
      
      // Manejar errores específicos
      if (err.response?.status === 404) {
        throw new Error('Endpoint de autenticación con Google no encontrado. Por favor, contacta al administrador.');
      } else if (err.response?.status === 400) {
        const errorData = err.response.data as Record<string, unknown> | undefined;
        if (errorData && 'error' in errorData) {
          throw new Error(String(errorData.error));
        }
        throw new Error('Credencial de Google inválida');
      } else if (err.response?.status === 500) {
        throw new Error('Error del servidor al autenticar con Google');
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error al autenticar con Google';
      throw new Error(errorMessage);
    }
  }
}

// Instancia singleton del servicio de autenticación
export const authService = new AuthService();
export default authService;