import React from 'react';
import { Droplets, Coffee, Apple, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useConsumosStore } from '@/store/consumosStore';
import { Bebida, Recipiente } from '@/types';

interface QuickIntakeButtonsProps {
  bebidas: Bebida[];
  recipientes: Recipiente[];
  onIntake: (amount: number, beverageId: number, containerId: number) => void;
  className?: string;
}

const QuickIntakeButtons: React.FC<QuickIntakeButtonsProps> = ({
  bebidas,
  recipientes,
  onIntake,
  className = ''
}) => {
  const { addConsumo } = useConsumosStore();

  // Configuración de botones rápidos
  const quickButtons = [
    {
      id: 'water-250',
      label: '250ml',
      amount: 250,
      icon: Droplets,
      color: 'primary',
      beverage: bebidas.find(b => b.es_agua)?.id || bebidas[0]?.id,
      container: recipientes.find(r => r.cantidad_ml === 250)?.id || recipientes[0]?.id
    },
    {
      id: 'water-500',
      label: '500ml',
      amount: 500,
      icon: Droplets,
      color: 'primary',
      beverage: bebidas.find(b => b.es_agua)?.id || bebidas[0]?.id,
      container: recipientes.find(r => r.cantidad_ml === 500)?.id || recipientes[0]?.id
    },
    {
      id: 'coffee-200',
      label: 'Café',
      amount: 200,
      icon: Coffee,
      color: 'secondary',
      beverage: bebidas.find(b => b.nombre.toLowerCase().includes('café'))?.id || bebidas[0]?.id,
      container: recipientes.find(r => r.cantidad_ml === 200)?.id || recipientes[0]?.id
    },
    {
      id: 'juice-300',
      label: 'Jugo',
      amount: 300,
      icon: Apple,
      color: 'accent',
      beverage: bebidas.find(b => b.nombre.toLowerCase().includes('jugo'))?.id || bebidas[0]?.id,
      container: recipientes.find(r => r.cantidad_ml === 300)?.id || recipientes[0]?.id
    }
  ];

  const handleQuickIntake = async (button: typeof quickButtons[0]) => {
    if (!button.beverage || !button.container) {
      console.warn('No hay bebida o recipiente disponible');
      return;
    }

    try {
      await addConsumo({
        bebida: button.beverage,
        recipiente: button.container,
        cantidad_ml: button.amount,
        nivel_sed: 3,
        estado_animo: 4
      });

      onIntake(button.amount, button.beverage, button.container);
    } catch (error) {
      console.error('Error adding quick intake:', error);
    }
  };

  const getButtonVariant = (color: string) => {
    switch (color) {
      case 'primary': return 'primary';
      case 'secondary': return 'secondary';
      case 'accent': return 'outline';
      default: return 'primary';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 text-center">
        Registro Rápido
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {quickButtons.map((button) => {
          const IconComponent = button.icon;
          return (
            <Button
              key={button.id}
              variant={getButtonVariant(button.color)}
              size="lg"
              onClick={() => handleQuickIntake(button)}
              className="flex flex-col items-center justify-center space-y-2 h-20"
            >
              <IconComponent className="w-6 h-6" />
              <span className="text-sm font-medium">
                {button.label}
              </span>
              <span className="text-xs opacity-75">
                {button.amount}ml
              </span>
            </Button>
          );
        })}
      </div>

      {/* Custom Amount Button */}
      <Button
        variant="ghost"
        size="md"
        className="w-full border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50"
        onClick={() => {
          // This would open a modal for custom amount
          console.log('Open custom amount modal');
        }}
      >
        <Zap className="w-4 h-4 mr-2" />
        Cantidad Personalizada
      </Button>
    </div>
  );
};

export default QuickIntakeButtons;
