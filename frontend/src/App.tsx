import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAuthInit } from '@/store/authStore';

// Layout
import Layout from '@/components/layout/Layout';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy load pages for code splitting
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Statistics = lazy(() => import('@/pages/Statistics'));
const Recipientes = lazy(() => import('@/pages/Recipientes'));
const Recordatorios = lazy(() => import('@/pages/Recordatorios'));
const Premium = lazy(() => import('@/pages/Premium'));
const Bebidas = lazy(() => import('@/pages/Bebidas'));

const App: React.FC = () => {
  console.log('App.tsx: Component rendering');
  
  try {
    const { isAuthenticated, isLoading } = useAuthStore();
    
    console.log('App.tsx: Auth state:', { isAuthenticated, isLoading });
    
    // Initialize auth state
    useAuthInit();

    if (isLoading) {
      console.log('App.tsx: Showing loading spinner');
      return <LoadingSpinner />;
    }

  return (
    <Router>
      <div className="App">
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
