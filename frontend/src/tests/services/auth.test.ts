import { vi } from 'vitest';
import { authService } from '@/services/auth';
import { apiService } from '@/services/api';

// Mock the API service
vi.mock('@/services/api');
const mockApiService = apiService as any;

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        user: { id: 1, username: 'test', email: 'test@example.com' },
        tokens: { access: 'access-token', refresh: 'refresh-token' }
      };

      mockApiService.post.mockResolvedValue(mockResponse);
      mockApiService.setToken.mockImplementation(() => {});

      const result = await authService.login({
        username: 'test',
        password: 'password'
      });

      expect(mockApiService.post).toHaveBeenCalledWith('/login/', {
        username: 'test',
        password: 'password'
      });
      expect(mockApiService.setToken).toHaveBeenCalledWith('access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on login failure', async () => {
      mockApiService.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login({
        username: 'test',
        password: 'wrong'
      })).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('register', () => {
    it('should register successfully and store tokens', async () => {
      const mockResponse = {
        user: { id: 1, username: 'newuser', email: 'new@example.com' },
        tokens: { access: 'access-token', refresh: 'refresh-token' }
      };

      mockApiService.post.mockResolvedValue(mockResponse);
      mockApiService.setToken.mockImplementation(() => {});

      const result = await authService.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password',
        confirmPassword: 'password'
      });

      expect(mockApiService.post).toHaveBeenCalledWith('/register/', {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password',
        confirmPassword: 'password'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on registration failure', async () => {
      mockApiService.post.mockRejectedValue(new Error('Registration failed'));

      await expect(authService.register({
        username: 'test',
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password'
      })).rejects.toThrow('Error al crear la cuenta');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockApiService.post.mockResolvedValue(undefined);
      mockApiService.clearToken.mockImplementation(() => {});

      await authService.logout();

      expect(mockApiService.post).toHaveBeenCalledWith('/logout/');
      expect(mockApiService.clearToken).toHaveBeenCalled();
    });

    it('should clear tokens even if logout request fails', async () => {
      mockApiService.post.mockRejectedValue(new Error('Network error'));
      mockApiService.clearToken.mockImplementation(() => {});

      await authService.logout();

      expect(mockApiService.clearToken).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      localStorage.setItem('refresh_token', 'refresh-token');
      const mockResponse = { access: 'new-access-token' };

      // Configure mocks for this specific test without clearing
      mockApiService.post.mockResolvedValue(mockResponse);
      mockApiService.setToken.mockImplementation(() => {});

      const result = await authService.refreshToken();

      expect(mockApiService.post).toHaveBeenCalledWith('/token/refresh/', {
        refresh: 'refresh-token'
      });
      expect(mockApiService.setToken).toHaveBeenCalledWith('new-access-token');
      expect(result).toBe('new-access-token');
    });

    it('should throw error when no refresh token', async () => {
      await expect(authService.refreshToken()).rejects.toThrow('Sesión expirada. Inicia sesión nuevamente.');
    });

    it('should clear tokens on refresh failure', async () => {
      localStorage.setItem('refresh_token', 'invalid-token');
      mockApiService.post.mockRejectedValue(new Error('Invalid token'));
      mockApiService.clearToken.mockImplementation(() => {});

      await expect(authService.refreshToken()).rejects.toThrow('Sesión expirada. Inicia sesión nuevamente.');
      expect(mockApiService.clearToken).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = { id: 1, username: 'test', email: 'test@example.com' };
      mockApiService.get.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser();

      expect(mockApiService.get).toHaveBeenCalledWith('/profile/');
      expect(result).toEqual(mockUser);
    });

    it('should throw error on failure', async () => {
      mockApiService.get.mockRejectedValue(new Error('Network error'));

      await expect(authService.getCurrentUser()).rejects.toThrow('Error al obtener datos del usuario');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      mockApiService.getToken.mockReturnValue('valid-token');

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      mockApiService.getToken.mockReturnValue(null);

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('isTokenExpiring', () => {
    it('should return true for expired token', () => {
      const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDAwMDAwMDB9.expired';
      mockApiService.getToken.mockReturnValue(expiredToken);

      expect(authService.isTokenExpiring()).toBe(true);
    });

    it('should return false for valid token', () => {
      const validToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjQwMDAwMDAwMDB9.valid';
      mockApiService.getToken.mockReturnValue(validToken);

      expect(authService.isTokenExpiring()).toBe(false);
    });

    it('should return true for invalid token', () => {
      mockApiService.getToken.mockReturnValue('invalid-token');

      expect(authService.isTokenExpiring()).toBe(true);
    });
  });
});
