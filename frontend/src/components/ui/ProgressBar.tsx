import React from 'react';
import { clsx } from 'clsx';
import { ProgressBarProps } from '@/types';

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  animated = false,
  ...props
}) => {
  console.log('ProgressBar: Received props:', { value, max, label, color });
  
  const safeMax = typeof max === 'number' && max > 0 ? max : 1;
  const safeValue = typeof value === 'number' && value >= 0 ? value : 0;
  const percentage = Math.min((safeValue / safeMax) * 100, 100);
  
  console.log('ProgressBar: Calculated values:', { safeMax, safeValue, percentage });
  
  const baseClasses = 'w-full bg-neutral-200 rounded-full overflow-hidden transition-all duration-500 ease-in-out';
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const colorClasses = {
    primary: 'bg-accent-500',
    secondary: 'bg-secondary-500',
    accent: 'bg-accent-500',
    chart: 'bg-chart-500',
    success: 'bg-secondary-500',
    warning: 'bg-warning',
    error: 'bg-error'
  };
  
  const progressClasses = clsx(
    'h-full transition-all duration-700 ease-out transform',
    colorClasses[color],
    animated && 'animate-pulse'
  );
  
  const containerClasses = clsx(
    baseClasses,
    sizeClasses[size]
  );
  
  return (
    <div className="w-full" {...props}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-display font-medium text-neutral-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-display font-medium text-neutral-500">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={containerClasses}>
        <div
          className={progressClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={safeValue}
          aria-valuemin={0}
          aria-valuemax={safeMax}
        />
      </div>
      
      {!label && showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-neutral-500">
            {safeValue} / {safeMax} ml
          </span>
          <span className="text-xs font-display font-medium text-neutral-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
