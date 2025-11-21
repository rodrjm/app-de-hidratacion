import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import BrandLogo from '@/components/common/BrandLogo';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  isLoading?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  isLoading = false
}) => {
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
    <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 text-white shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            {icon && (
              <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/20">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-display font-bold leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-primary-50 text-base mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {actions && actions}
            <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-lg backdrop-blur-sm">
              <BrandLogo size={38} />
            </div>
          </div>
        </div>
        {children && (
          <div className="mt-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

