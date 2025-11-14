import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/navigation/BottomNav';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-20">
        <Outlet />
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Layout;
