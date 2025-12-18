import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAuthInit } from '@/store/authStore';

// Layout
import Layout from '@/components/layout/Layout';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Utils
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { wakeUpServer } from '@/utils/wakeUpServer';

// Lazy load pages for code splitting with retry logic
const Login = lazyWithRetry(() => import('@/pages/Login'));
const Register = lazyWithRetry(() => import('@/pages/Register'));
const Onboarding = lazyWithRetry(() => import('@/pages/Onboarding'));
const Dashboard = lazyWithRetry(() => import('@/pages/Dashboard'));
const Profile = lazyWithRetry(() => import('@/pages/Profile'));
const Statistics = lazyWithRetry(() => import('@/pages/Statistics'));
const Recipientes = lazyWithRetry(() => import('@/pages/Recipientes'));
const Recordatorios = lazyWithRetry(() => import('@/pages/Recordatorios'));
const Premium = lazyWithRetry(() => import('@/pages/Premium'));
const Bebidas = lazyWithRetry(() => import('@/pages/Bebidas'));

const App: React.FC = () => {
  console.log('App.tsx: Component rendering');
  
  const [serverWakingUp, setServerWakingUp] = useState(false);
  const [wakeUpProgress, setWakeUpProgress] = useState({ attempt: 0, retries: 5 });
  
  // Escuchar eventos de servidor despertando
  useEffect(() => {
    const handleServerWakeUp = (event: CustomEvent) => {
      setServerWakingUp(true);
      setWakeUpProgress({
        attempt: event.detail.attempt,
        retries: event.detail.retries
      });
    };
    
    const handleModuleLoaded = () => {
      setServerWakingUp(false);
    };
    
    window.addEventListener('server-waking-up', handleServerWakeUp as EventListener);
    window.addEventListener('module-loaded', handleModuleLoaded);
    
    return () => {
      window.removeEventListener('server-waking-up', handleServerWakeUp as EventListener);
      window.removeEventListener('module-loaded', handleModuleLoaded);
    };
  }, []);
  
  try {
    const { isAuthenticated, isLoading } = useAuthStore();
    
    console.log('App.tsx: Auth state:', { isAuthenticated, isLoading });
    
    // Initialize auth state
    useAuthInit();
    
    // Despertar el servidor al cargar la app (solo en producción)
    useEffect(() => {
      if (import.meta.env.PROD) {
        wakeUpServer();
      }
    }, []);

    if (isLoading) {
      console.log('App.tsx: Showing loading spinner');
      return <LoadingSpinner />;
    }

  return (
    <Router>
      <div className="App">
        {/* Banner de servidor despertando */}
        {serverWakingUp && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center z-50 shadow-lg">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm font-medium">
                El servidor está despertando... Por favor espera ({wakeUpProgress.attempt}/{wakeUpProgress.retries})
              </span>
            </div>
          </div>
        )}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
              } 
            />
            <Route 
              path="/onboarding" 
              element={
                isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />
              } 
            />
            
            {/* Protected Routes with Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="recipientes" element={<Recipientes />} />
              <Route path="recordatorios" element={<Recordatorios />} />
              <Route path="premium" element={<Premium />} />
              <Route path="bebidas" element={<Bebidas />} />
            </Route>
            
            {/* 404 Route */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Página no encontrada</p>
                    <a
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Volver al Dashboard
                    </a>
                  </div>
                </div>
              } 
            />
          </Routes>
        </Suspense>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4CAF50',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#f44336',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
    );
  } catch (error) {
    console.error('App.tsx: Error in component:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error en la aplicación</h1>
          <p className="text-gray-600 mb-6">
            Ocurrió un error al cargar la aplicación. Por favor, recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }
};

export default App;
