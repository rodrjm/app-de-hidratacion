import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from '@/store/authStore';
import { useConsumosStore } from '@/store/consumosStore';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import DashboardPage from '@/pages/Dashboard';

// Mock stores and services
vi.mock('@/store/authStore');
vi.mock('@/store/consumosStore');
vi.mock('@/services/auth');
vi.mock('@/services/api');

const mockUseAuthStore = useAuthStore as any;
const mockUseConsumosStore = useConsumosStore as any;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithRouterAndProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('End-to-End User Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mocks for authenticated state
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn(),
    });

    mockUseConsumosStore.mockReturnValue({
      estadisticas: null,
      bebidas: [],
      recipientes: [],
      consumos: [],
      isLoading: false,
      error: null,
      fetchEstadisticas: vi.fn(),
      fetchBebidas: vi.fn(),
      fetchRecipientes: vi.fn(),
      addConsumo: vi.fn(),
      updateConsumo: vi.fn(),
      deleteConsumo: vi.fn(),
      refreshConsumos: vi.fn(),
      fetchTendencias: vi.fn(),
      fetchInsights: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      clearErrors: vi.fn(),
    });
  });

  it('should allow a user to register and login', async () => {
    // Mock successful registration
    mockUseAuthStore.mockReturnValueOnce({
      ...mockUseAuthStore(),
      register: vi.fn().mockResolvedValue({
        user: { id: 1, username: 'newuser', email: 'new@example.com', es_premium: false, meta_diaria_ml: 2000 },
        tokens: { access: 'access-token', refresh: 'refresh-token' }
      }),
    });

    renderWithRouterAndProviders(<RegisterPage />);

    // Fill registration form and submit
    fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(mockUseAuthStore().register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    });
  });

  it('should allow a user to login and view dashboard', async () => {
    // Mock authenticated state after login
    mockUseAuthStore.mockReturnValue({
      user: { id: 1, username: 'testuser', email: 'test@example.com', es_premium: false, meta_diaria_ml: 2000 },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn().mockResolvedValue(undefined),
      refreshUser: vi.fn(),
    });

    // Mock dashboard data
    mockUseConsumosStore.mockReturnValue({
      estadisticas: {
        fecha: '2024-01-01',
        total_ml: 1500,
        total_hidratacion_efectiva_ml: 1200,
        cantidad_consumos: 5,
        meta_ml: 2000,
        progreso_porcentaje: 60,
        completada: false
      },
      bebidas: [{ id: 1, nombre: 'Agua', es_agua: true, factor_hidratacion: 1.0 }],
      recipientes: [{ id: 1, nombre: 'Vaso', cantidad_ml: 250 }],
      fetchEstadisticas: vi.fn().mockResolvedValue(undefined),
      fetchBebidas: vi.fn().mockResolvedValue(undefined),
      fetchRecipientes: vi.fn().mockResolvedValue(undefined),
    });

    renderWithRouterAndProviders(<DashboardPage />);

    // View Dashboard content
    expect(screen.getByText('Progreso de Hidratación')).toBeInTheDocument();
    expect(screen.getAllByText('1200ml')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2000ml')[0]).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('should handle login flow', async () => {
    // Mock successful login
    mockUseAuthStore.mockReturnValueOnce({
      ...mockUseAuthStore(),
      login: vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', es_premium: false, meta_diaria_ml: 2000 },
        tokens: { access: 'access-token', refresh: 'refresh-token' }
      }),
    });

    renderWithRouterAndProviders(<LoginPage />);

    // Fill login form and submit
    fireEvent.change(screen.getByLabelText(/Nombre de usuario o Correo/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(mockUseAuthStore().login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });
  });
});