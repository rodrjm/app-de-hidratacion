import { render, screen, waitFor } from '@testing-library/react';
import { vi, beforeAll, afterEach, describe, it, expect } from 'vitest';
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

describe('Frontend Performance Tests', () => {
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

  beforeAll(() => {
    // Mock console.time and console.timeEnd for performance measurement
    vi.spyOn(console, 'time').mockImplementation(() => {});
    vi.spyOn(console, 'timeEnd').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Dashboard renders quickly', async () => {
    const startTime = performance.now();
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('¡Hola, testuser! 👋')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Dashboard render time: ${renderTime.toFixed(2)}ms`);
    // Set a threshold for render time (e.g., 500ms)
    expect(renderTime).toBeLessThan(1000); // Adjust threshold as needed
  });

  it('should handle large data sets efficiently', async () => {
    const largeBebidas = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      nombre: `Bebida ${i + 1}`,
      es_agua: i % 2 === 0,
      factor_hidratacion: 1.0
    }));

    mockUseConsumosStore.mockReturnValue({
      ...mockUseConsumosStore(),
      bebidas: largeBebidas
    });

    const startTime = performance.now();
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('¡Hola, testuser! 👋')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Dashboard render time with large data: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(2000); // Adjust threshold as needed
  });
});