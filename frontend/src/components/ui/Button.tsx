import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

const base = 'inline-flex items-center justify-center font-display font-bold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-500 disabled:opacity-60 disabled:cursor-not-allowed';
const variants: Record<string, string> = {
  primary: 'bg-accent-500 hover:bg-accent-600 text-white',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
  outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
  danger: 'bg-error hover:bg-red-700 text-white',
};
const sizes: Record<string, string> = {
  sm: 'h-11 min-w-[44px] px-4 text-sm',
  md: 'h-12 min-w-[48px] px-5 text-base',
  lg: 'h-14 min-w-[52px] px-6 text-base',
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', loading, className = '', children, ...props }) => {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  );
};

export default Button;
export { Button };
