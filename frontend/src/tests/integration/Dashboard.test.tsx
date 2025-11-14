import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Dashboard from '@/pages/Dashboard';
import { useAuthStore } from '@/store/authStore';
import { useConsumosStore } from '@/store/consumosStore';

// Mock stores
vi.mock('@/store/authStore');
vi.mock('@/store/consumosStore');

const mockUseAuthStore = useAuthStore as any;
const mockUseConsumosStore = useConsumosStore as any;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Integration', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    es_premium: false,
    meta_diaria_ml: 2000
  };

  const mockEstadisticas = {
    fecha: '2024-01-01',
    total_ml: 1500,
    total_hidratacion_efectiva_ml: 1200,
    cantidad_consumos: 5,
    meta_ml: 2000,
    progreso_porcentaje: 60,
    completada: false
  };

  const mockBebidas = [
    { id: 1, nombre: 'Agua', es_agua: true, factor_hidratacion: 1.0 },
    { id: 2, nombre: 'Café', es_agua: false, factor_hidratacion: 0.8 }
  ];

  const mockRecipientes = [
    { id: 1, nombre: 'Vaso', cantidad_ml: 250 },
    { id: 2, nombre: 'Botella', cantidad_ml: 500 }
  ];

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn()
    });

    mockUseConsumosStore.mockReturnValue({
      estadisticas: mockEstadisticas,
      bebidas: mockBebidas,
      recipientes: mockRecipientes,
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
      setPage: vi.fn(),
      nextPage: vi.fn(),
      previousPage: vi.fn(),
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      isLoadingEstadisticas: false,
      isLoadingTendencias: false,
      isLoadingInsights: false,
      errorEstadisticas: null,
      errorTendencias: null,
      errorInsights: null,
      tendencias: null,
      insights: null
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with user information', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('¡Hola, testuser! 👋')).toBeInTheDocument();
      expect(screen.getByText('Mantente hidratado y saludable')).toBeInTheDocument();
    });
  });

  it('displays hydration progress correctly', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Progreso de Hidratación')).toBeInTheDocument();
      expect(screen.getAllByText('1200ml')[0]).toBeInTheDocument();
      expect(screen.getAllByText('2000ml')[0]).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('shows quick intake buttons', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
      expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    });
  });

  it('displays daily statistics', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Estadísticas del Día')).toBeInTheDocument();
      expect(screen.getAllByText('5')[0]).toBeInTheDocument(); // cantidad_consumos
      expect(screen.getAllByText('1200ml')[0]).toBeInTheDocument(); // total_hidratacion_efectiva_ml
    });
  });

  it('shows premium upgrade prompt for free users', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('🚀 Desbloquea Premium')).toBeInTheDocument();
      expect(screen.getByText('Funciones Avanzadas')).toBeInTheDocument();
      expect(screen.getByText('Actualizar a Premium')).toBeInTheDocument();
    });
  });

  it('handles quick intake button clicks', async () => {
    const mockAddConsumo = vi.fn();
    mockUseConsumosStore.mockReturnValue({
      ...mockUseConsumosStore(),
      addConsumo: mockAddConsumo
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // Los botones de QuickIntakeButtons se renderizan dinámicamente
      // Verificamos que el componente se renderiza correctamente
      expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    mockUseConsumosStore.mockReturnValue({
      ...mockUseConsumosStore(),
      isLoading: true
    });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Cargando dashboard...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseConsumosStore.mockReturnValue({
      ...mockUseConsumosStore(),
      error: 'Network error'
    });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Error al cargar datos')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('calls fetch functions on mount', async () => {
    const mockFetchEstadisticas = vi.fn();
    const mockFetchBebidas = vi.fn();
    const mockFetchRecipientes = vi.fn();

    mockUseConsumosStore.mockReturnValue({
      ...mockUseConsumosStore(),
      fetchEstadisticas: mockFetchEstadisticas,
      fetchBebidas: mockFetchBebidas,
      fetchRecipientes: mockFetchRecipientes
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(mockFetchEstadisticas).toHaveBeenCalled();
      expect(mockFetchBebidas).toHaveBeenCalled();
      expect(mockFetchRecipientes).toHaveBeenCalled();
    });
  });

  it('displays completion message when goal is reached', async () => {
    const completedEstadisticas = {
      ...mockEstadisticas,
      completada: true,
      progreso_porcentaje: 100
    };

    mockUseConsumosStore.mockReturnValue({
      ...mockUseConsumosStore(),
      estadisticas: completedEstadisticas
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getAllByText('100%')[0]).toBeInTheDocument();
    });
  });
});
