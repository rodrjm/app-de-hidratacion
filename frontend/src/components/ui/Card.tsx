import React from 'react';
import { clsx } from 'clsx';
import { CardProps } from '@/types';

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  padding = 'md',
  shadow = 'card',
  ...props
}) => {
  const baseClasses = 'bg-white rounded-xl border border-neutral-100';
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const shadowClasses = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
    card: 'shadow-card'
  };
  
  const classes = clsx(
    baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    className
  );
  
  return (
    <div className={classes} {...props}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-display font-bold text-neutral-700 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-neutral-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
export { Card };
