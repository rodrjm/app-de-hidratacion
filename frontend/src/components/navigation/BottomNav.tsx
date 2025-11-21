import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'statistics',
      label: 'Estadísticas',
      icon: BarChart3,
      path: '/statistics'
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      path: '/profile'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-card px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                active
                  ? 'text-accent-500 bg-accent-50'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <IconComponent 
                className={`w-5 h-5 mb-1 ${
                  active ? 'text-accent-500' : 'text-neutral-500'
                }`} 
              />
              <span className={`text-xs font-display font-medium ${
                active ? 'text-accent-500' : 'text-neutral-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

