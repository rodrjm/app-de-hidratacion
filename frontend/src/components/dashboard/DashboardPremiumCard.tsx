import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface DashboardPremiumCardProps {
  isPremium: boolean;
}

const DashboardPremiumCard: React.FC<DashboardPremiumCardProps> = memo(({ isPremium }) => {
  const navigate = useNavigate();

  if (isPremium) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/profile');
  };

  return (
    <Card title="🚀 Desbloquea Premium">
      <div className="text-center">
        <h3 className="text-lg font-display font-bold text-neutral-700 mb-2">
          Funciones avanzadas
        </h3>
        <ul className="text-sm font-display font-medium text-neutral-600 space-y-1 mb-4">
          <li>• Estadísticas detalladas</li>
          <li>• Recordatorios ilimitados</li>
          <li>• Sin anuncios</li>
          <li>• Bebidas premium</li>
        </ul>
        <Button variant="primary" size="sm" className="w-full" onClick={handleUpgrade}>
          Actualizar a Premium
        </Button>
      </div>
    </Card>
  );
});

DashboardPremiumCard.displayName = 'DashboardPremiumCard';

export default DashboardPremiumCard;

