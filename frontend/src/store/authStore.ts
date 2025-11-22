import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import { User } from '@/types';
import { authService } from '@/services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: { email: string; first_name: string; last_name: string; password: string; confirmPassword: string; peso: number; peso_unidad: 'kg' | 'lb'; fecha_nacimiento: string; es_fragil_o_insuficiencia_cardiaca?: boolean; codigo_referido?: string }) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<{ is_new_user: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acciones
      login: async (email: string, password: string, rememberMe: boolean = false) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login({ email, password, rememberMe });
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
          });
          throw error;
        }
      },

      register: async (userData: { email: string; first_name: string; last_name: string; password: string; confirmPassword: string; peso: number; peso_unidad: 'kg' | 'lb'; fecha_nacimiento: string; es_fragil_o_insuficiencia_cardiaca?: boolean; codigo_referido?: string }) => {
        set({ isLoading: true, error: null });
        
        try {
          // Convertir peso a kg si está en lb
          let peso_kg = userData.peso;
          if (userData.peso_unidad === 'lb') {
            peso_kg = userData.peso * 0.453592; // Convertir libras a kilogramos
          }
          
          // Generar username único basado en email (antes del @)
          const usernameBase = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const timestamp = Date.now();
          const username = `${usernameBase}_${timestamp}`;
          
          // Mapear campos del frontend a los esperados por el backend
          const backendData = {
            username: username,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            password: userData.password,
            password_confirm: userData.confirmPassword,
            peso: peso_kg,
            fecha_nacimiento: userData.fecha_nacimiento,
            es_fragil_o_insuficiencia_cardiaca: userData.es_fragil_o_insuficiencia_cardiaca || false,
            codigo_referido: userData.codigo_referido || null
          };
          
          const response = await authService.register(backendData as unknown as never);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Error al registrarse'
          });
          throw error;
        }
      },

      loginWithGoogle: async (credential: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.loginWithGoogle(credential);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return { is_new_user: response.is_new_user };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al autenticar con Google';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
        } catch (error) {
          // Error al cerrar sesión, continuar con limpieza local
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      refreshUser: async () => {
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Error al obtener datos del usuario'
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Hook para verificar autenticación al cargar la app
export const useAuthInit = () => {
  const { refreshUser } = useAuthStore();
  
  useEffect(() => {
    // Verificar token primero antes de hacer cualquier cosa
    const hasToken = authService.isAuthenticated();
    
    // Si no hay token, limpiar estado de autenticación
    if (!hasToken) {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      return;
    }
    
    // Si hay token, siempre intentar refrescar el usuario
    // Esto asegura que el estado esté sincronizado después de un refresh
    refreshUser().catch((error) => {
      // Si falla, limpiar estado y loggear el error (pero no romper la app)
      console.error('Error al refrescar usuario:', error);
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar
};
