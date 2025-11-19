import React, { memo } from 'react';
import { Droplets } from 'lucide-react';
import Card from '@/components/ui/Card';

const DashboardTips: React.FC = memo(() => {
  const tips = [
    {
      icon: Droplets,
      iconColor: 'text-accent-500',
      title: 'Bebe agua al despertar',
      description: 'Un vaso de agua en ayunas activa tu metabolismo',
    },
    {
      icon: Droplets,
      iconColor: 'text-secondary-500',
      title: 'Hidrátate antes de sentir sed',
      description: 'La sed es una señal tardía de deshidratación',
    },
    {
      icon: Droplets,
      iconColor: 'text-chart-500',
      title: 'Frutas y verduras cuentan',
      description: 'El 20% de tu hidratación viene de los alimentos',
    },
  ];

  return (
    <Card title="💡 Consejos de Hidratación">
      <div className="space-y-3 text-sm">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <div key={index} className="flex items-start gap-3 py-2">
              <Icon className={`w-5 h-5 ${tip.iconColor} mt-0.5 flex-shrink-0`} />
              <div>
                <p className="font-display font-medium text-neutral-700 mb-0.5">
                  {tip.title}
                </p>
                <p className="text-neutral-600 text-xs">
                  {tip.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
});

DashboardTips.displayName = 'DashboardTips';

export default DashboardTips;

