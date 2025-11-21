import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { toast } from 'react-hot-toast';
import WaterIntakeButton from '@/components/hydration/WaterIntakeButton';
import { useConsumosStore } from '@/store/consumosStore';

// Mock the store
vi.mock('@/store/consumosStore');
vi.mock('react-hot-toast');

const mockAddConsumo = vi.fn();
const mockUseConsumosStore = useConsumosStore as any;

describe('WaterIntakeButton Component', () => {
  beforeEach(() => {
    mockUseConsumosStore.mockReturnValue({
      addConsumo: mockAddConsumo,
    } as any);
    
    mockAddConsumo.mockResolvedValue(undefined);
    vi.mocked(toast.success).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct amount', () => {
    render(
      <WaterIntakeButton
        amount={250}
        beverageId={1}
        containerId={1}
      />
    );
    
    expect(screen.getByText('+250ml')).toBeInTheDocument();
  });

  it('shows loading state when clicked', async () => {
    mockAddConsumo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <WaterIntakeButton
        amount={250}
        beverageId={1}
        containerId={1}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Registrando...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('calls addConsumo with correct parameters', async () => {
    render(
      <WaterIntakeButton
        amount={500}
        beverageId={2}
        containerId={3}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockAddConsumo).toHaveBeenCalledWith({
        bebida: 2,
        recipiente: 3,
        cantidad_ml: 500,
        nivel_sed: 3,
        estado_animo: 4
      });
    });
  });

  it('shows success state after successful consumption', async () => {
    render(
      <WaterIntakeButton
        amount={250}
        beverageId={1}
        containerId={1}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('¡Registrado!')).toBeInTheDocument();
    });
  });

  it('shows error toast on failure', async () => {
    const error = new Error('Network error');
    mockAddConsumo.mockRejectedValue(error);
    vi.mocked(toast.error).mockImplementation(() => {});
    
    render(
      <WaterIntakeButton
        amount={250}
        beverageId={1}
        containerId={1}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al registrar el consumo');
    });
  });

  it('calls onSuccess callback when provided', async () => {
    const onSuccess = vi.fn();
    
    render(
      <WaterIntakeButton
        amount={250}
        beverageId={1}
        containerId={1}
        onSuccess={onSuccess}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('applies custom className', () => {
    render(
      <WaterIntakeButton
        amount={250}
        beverageId={1}
        containerId={1}
        className="custom-class"
      />
    );
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('prevents multiple clicks while loading', async () => {
    mockAddConsumo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <WaterIntakeButton
        amount={250}
        beverageId={1}
        containerId={1}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(mockAddConsumo).toHaveBeenCalledTimes(1);
  });
});
