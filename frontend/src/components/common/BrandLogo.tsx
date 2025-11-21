import React from 'react';
import LogoOnly from '@/assets/logo.svg';
import LogoWithText from '@/assets/logo_and_text.svg';

interface BrandLogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 56,
  className = '',
  withText = false
}) => {
  // Usar logo con texto o solo logo según la prop
  const logoSrc = withText ? LogoWithText : LogoOnly;
  
  // Ajustar el tamaño según si incluye texto o no
  const logoSize = withText ? size : size;

  const logoImage = (
    <img
      src={logoSrc}
      alt="Dosis vital: Tu aplicación de hidratación personal"
      style={{ width: logoSize, height: 'auto' }}
      className="drop-shadow-lg select-none"
      draggable={false}
    />
  );

  return (
    <div className={className}>
      {logoImage}
    </div>
  );
};

export default BrandLogo;

