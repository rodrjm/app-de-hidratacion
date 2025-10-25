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
  const percentage = Math.min((value / max) * 100, 100);
  
  const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden';
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };
  
  const progressClasses = clsx(
    'h-full transition-all duration-300 ease-out',
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
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-500">
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
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      
      {!label && showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {value} / {max} ml
          </span>
          <span className="text-xs font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
