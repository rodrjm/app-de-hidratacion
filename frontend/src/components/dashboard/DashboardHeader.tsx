import React, { memo } from 'react';
import { Droplets } from 'lucide-react';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

interface DashboardHeaderProps {
  isLoading: boolean;
  userName?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = memo(({ isLoading, userName }) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
          <Skeleton className="h-4 w-96 bg-white/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Droplets className="w-8 h-8" />
          <h1 className="text-3xl font-display font-bold">
            ¡Hola{userName ? `, ${userName}` : ''}! 👋
          </h1>
        </div>
        <p className="text-primary-100 text-lg">
          Mantente hidratado durante todo el día
        </p>
      </div>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;

