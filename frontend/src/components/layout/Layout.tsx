import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/navigation/BottomNav';
import AdSenseBlock from '@/components/ads/AdSenseBlock';

// ID del bloque de anuncios para el Dashboard (Footer fijo)
const AD_DASHBOARD_ID = '6350456392';

import { useAuthStore } from '@/store/authStore';

const Layout: React.FC = () => {
  const { user } = useAuthStore();
  const isPremium = user?.es_premium || false;
  
  // Calcular padding-bottom: navegación (64px) + anuncio (50px) + espacio extra (16px) = 130px
  // Si es premium, solo necesita espacio para la navegación (80px)
  const paddingBottom = isPremium ? 'pb-20' : 'pb-[130px]';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className={paddingBottom}>
        <Outlet />
      </main>
      
      {/* Anuncio Fijo en el Footer (solo para usuarios no premium) */}
      {/* Posicionado justo encima de la navegación (64px desde abajo) */}
      {/* Tamaño fijo: 320x50px según configuración de AdSense */}
      {!isPremium && (
        <div 
          className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-xl flex justify-center items-center" 
          style={{ 
            height: '50px',
            width: '100%',
            minHeight: '50px',
            maxHeight: '50px'
          }}
        >
          <div 
            className="w-full max-w-[320px] h-[50px] flex items-center justify-center overflow-hidden"
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '50px',
              minHeight: '50px',
              maxHeight: '50px',
              overflow: 'hidden'
            }}
          >
            <AdSenseBlock 
              adSlotId={AD_DASHBOARD_ID} 
              className="w-full h-full overflow-hidden"
              style={{ 
                width: '320px',
                height: '50px',
                minWidth: '320px',
                maxWidth: '320px',
                minHeight: '50px',
                maxHeight: '50px'
              }}
              format="auto" 
            />
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default Layout;
