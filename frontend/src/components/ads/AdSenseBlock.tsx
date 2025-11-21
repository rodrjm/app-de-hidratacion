import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Componente reutilizable de banner publicitario usando Google AdSense
 * Solo se muestra para usuarios NO premium
 * 
 * @param adSlotId - ID único del bloque de anuncios (ej: '6350456392')
 * @param className - Clases CSS adicionales para el contenedor
 * @param style - Estilos inline adicionales
 * @param format - Formato del anuncio ('auto', 'fluid', 'rectangle', etc.)
 */
interface AdSenseBlockProps {
  adSlotId: string;
  className?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
}

const AD_CLIENT_ID = 'ca-pub-5935801678432621';

const AdSenseBlock: React.FC<AdSenseBlockProps> = ({ 
  adSlotId, 
  className = '', 
  style = {},
  format = 'auto'
}) => {
  const { user } = useAuthStore();
  const adRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttempted = useRef(false);

  // Si el usuario es premium, no mostrar anuncios
  if (user?.es_premium) {
    return null;
  }

  // Si no hay adSlotId configurado, no renderizar nada
  if (!adSlotId || adSlotId.includes('your-')) {
    return null;
  }

  // Resetear flags cuando el usuario cambia (ej: al iniciar sesión)
  useEffect(() => {
    initializationAttempted.current = false;
    setIsInitialized(false);
  }, [user?.id, user?.es_premium]);

  useEffect(() => {
    // Si el usuario es premium o no hay usuario, no inicializar
    if (user?.es_premium || !user) {
      return;
    }

    // Evitar múltiples intentos de inicialización
    if (initializationAttempted.current || isInitialized || !adRef.current) {
      return;
    }

    // Función para inicializar AdSense
    const initializeAdSense = () => {
      // Verificar que el script de AdSense esté cargado
      if (!window.adsbygoogle) {
        // Si el script no está cargado, esperar un poco y reintentar (máximo 10 intentos)
        const retryCount = (initializeAdSense as any).retryCount || 0;
        if (retryCount < 10) {
          (initializeAdSense as any).retryCount = retryCount + 1;
          setTimeout(initializeAdSense, 100);
        }
        return;
      }

      // Buscar el elemento ins dentro del contenedor
      const insElement = adRef.current?.querySelector('.adsbygoogle') as HTMLElement;
      if (!insElement || !document.body.contains(insElement)) {
        return;
      }

      // Verificar que el contenedor tenga dimensiones válidas
      const containerRect = adRef.current.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) {
        // Esperar un poco más si el contenedor aún no tiene dimensiones
        setTimeout(initializeAdSense, 50);
        return;
      }

      try {
        // Marcar como intentado antes de inicializar para evitar duplicados
        initializationAttempted.current = true;
        
        // Inicializar el anuncio
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsInitialized(true);
      } catch (error) {
        // Error silencioso en desarrollo
        if (import.meta.env.DEV) {
          console.warn('AdSense initialization error:', error);
        }
        // Resetear el flag para permitir reintentos
        initializationAttempted.current = false;
      }
    };

    // Esperar a que el DOM esté completamente listo
    // Usar requestAnimationFrame para asegurar que el layout esté calculado
    requestAnimationFrame(() => {
      // Pequeño delay adicional para asegurar que el contenedor tenga sus dimensiones
      // Aumentar el delay cuando el usuario acaba de iniciar sesión
      const delay = user ? 150 : 100;
      setTimeout(initializeAdSense, delay);
    });
  }, [adSlotId, isInitialized, user?.id, user?.es_premium]);

  // Efecto para forzar dimensiones fijas después de la inicialización
  useEffect(() => {
    if (!isInitialized || !adRef.current) {
      return;
    }

    const enforceDimensions = () => {
      const insElement = adRef.current?.querySelector('.adsbygoogle') as HTMLElement;
      if (!insElement) {
        return;
      }

      // Si hay dimensiones fijas en style, forzarlas
      if (style.width && style.height) {
        insElement.style.width = typeof style.width === 'string' ? style.width : `${style.width}px`;
        insElement.style.height = typeof style.height === 'string' ? style.height : `${style.height}px`;
        insElement.style.maxWidth = style.maxWidth ? (typeof style.maxWidth === 'string' ? style.maxWidth : `${style.maxWidth}px`) : insElement.style.width;
        insElement.style.maxHeight = style.maxHeight ? (typeof style.maxHeight === 'string' ? style.maxHeight : `${style.maxHeight}px`) : insElement.style.height;
        insElement.style.minWidth = style.minWidth ? (typeof style.minWidth === 'string' ? style.minWidth : `${style.minWidth}px`) : insElement.style.width;
        insElement.style.minHeight = style.minHeight ? (typeof style.minHeight === 'string' ? style.minHeight : `${style.minHeight}px`) : insElement.style.height;
        insElement.style.overflow = 'hidden';
      }
    };

    // Forzar dimensiones inmediatamente y después de un pequeño delay
    enforceDimensions();
    const timeoutId = setTimeout(enforceDimensions, 200);
    const timeoutId2 = setTimeout(enforceDimensions, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [isInitialized, style.width, style.height, style.maxWidth, style.maxHeight, style.minWidth, style.minHeight]);

  // Estilos por defecto que se pueden sobrescribir
  const defaultStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    overflow: 'hidden', // Prevenir que el anuncio se salga del contenedor
    ...style
  };

  // Estilos para el elemento ins - usar dimensiones específicas
  // Si se proporcionan dimensiones específicas en style, usarlas; si no, usar 100%
  const insStyle: React.CSSProperties = {
    display: 'block',
    width: style.width || style.maxWidth || '100%',
    height: style.height || style.minHeight || 'auto',
    minHeight: style.minHeight || style.height || 'auto',
    maxWidth: style.maxWidth || style.width || '100%',
    maxHeight: style.maxHeight || style.height || 'none',
    margin: '0 auto', // Centrar el anuncio
    overflow: 'hidden' // Prevenir overflow
  };

  // Determinar si usar full-width-responsive basado en si hay dimensiones fijas
  const hasFixedDimensions = style.width && style.height && 
                             (style.width !== '100%' || style.height !== 'auto');
  const useFullWidthResponsive = !hasFixedDimensions;

  return (
    <div 
      ref={adRef}
      className={className}
      style={defaultStyle}
    >
      <ins
        className="adsbygoogle"
        style={insStyle}
        data-ad-client={AD_CLIENT_ID}
        data-ad-slot={adSlotId}
        data-ad-format={format}
        data-full-width-responsive={useFullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
};

export default AdSenseBlock;

