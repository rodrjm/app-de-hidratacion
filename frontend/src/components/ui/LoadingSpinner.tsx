import React from 'react';
import BrandLogo from '@/components/common/BrandLogo';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Cargando...',
  fullScreen = false
}) => {
  const logoSizeMap = {
    sm: 32,
    md: 64,
    lg: 96,
    xl: 128
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="relative animate-pulse">
          <BrandLogo size={logoSizeMap[size]} />
        </div>
        {message && (
          <p className="mt-4 text-gray-600 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
