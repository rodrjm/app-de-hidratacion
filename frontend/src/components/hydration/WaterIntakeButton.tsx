import React, { useState } from 'react';
import { Droplets, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useConsumosStore } from '@/store/consumosStore';
import { toast } from 'react-hot-toast';

interface WaterIntakeButtonProps {
  amount: number;
  beverageId: number;
  containerId: number;
  onSuccess?: () => void;
  className?: string;
}

const WaterIntakeButton: React.FC<WaterIntakeButtonProps> = ({
  amount,
  beverageId,
  containerId,
  onSuccess,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addConsumo } = useConsumosStore();

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setIsSuccess(false);

    try {
      await addConsumo({
        bebida: beverageId,
        recipiente: containerId,
        cantidad_ml: amount,
        nivel_sed: 3,
        estado_animo: '4'
      });

      setIsSuccess(true);
      toast.success(`¡${amount}ml registrados! 💧`);
      
      if (onSuccess) {
        onSuccess();
      }

      // Reset success state after animation
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      toast.error('Error al registrar el consumo');
      console.error('Error adding consumption:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isSuccess) {
      return (
        <>
          <Check className="w-5 h-5" />
          ¡Registrado!
        </>
      );
    }

    if (isLoading) {
      return (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          Registrando...
        </>
      );
    }

    return (
      <>
        <Droplets className="w-5 h-5" />
        +{amount}ml
      </>
    );
  };

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={handleClick}
      disabled={isLoading}
      loading={isLoading}
      className={`
        relative overflow-hidden
        ${isSuccess ? 'bg-green-500 hover:bg-green-600' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-center space-x-2">
        {getButtonContent()}
      </div>
      
      {/* Ripple effect */}
      {isSuccess && (
        <div className="absolute inset-0 bg-green-400 opacity-30 animate-ping" />
      )}
    </Button>
  );
};

export default WaterIntakeButton;
