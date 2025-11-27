import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
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

  // Verificar si el usuario tiene valores temporales (peso=70.0 indica usuario de Google sin onboarding)
  // y redirigir a onboarding si no está ya en esa ruta
  if (user && user.peso === 70.0 && location.pathname !== '/onboarding') {
    // Calcular edad aproximada desde fecha_nacimiento para verificar si es temporal
    if (user.fecha_nacimiento) {
      const fechaNac = new Date(user.fecha_nacimiento);
      const hoy = new Date();
      const edadAprox = hoy.getFullYear() - fechaNac.getFullYear();
      // Si la edad es aproximadamente 25 años (valor temporal usado en GoogleAuthView), redirigir
      if (Math.abs(edadAprox - 25) < 2) {
        return <Navigate to="/onboarding" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
