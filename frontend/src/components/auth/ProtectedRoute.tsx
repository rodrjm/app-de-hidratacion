import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Verificar que el token realmente exista
    const hasToken = authService.isAuthenticated();
    
    // Si no hay token pero el store dice que está autenticado, limpiar estado
    if (!hasToken && isAuthenticated) {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Verificar tanto el estado como el token real
  const hasToken = authService.isAuthenticated();
  if (!isAuthenticated || !hasToken) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
