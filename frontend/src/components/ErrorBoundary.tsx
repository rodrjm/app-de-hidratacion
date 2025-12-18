import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isModuleLoadError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isModuleLoadError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Detectar si es un error de carga de módulo dinámico
    const isModuleLoadError = 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('dynamically imported module') ||
      error.name === 'ChunkLoadError';
    
    return { 
      hasError: true, 
      error,
      isModuleLoadError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Si es un error de carga de módulo, intentar limpiar caché
    if (this.state.isModuleLoadError && 'caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(name => caches.delete(name)));
      }).then(() => {
        console.log('Cache cleared due to module load error');
      }).catch(err => {
        console.warn('Failed to clear cache:', err);
      });
    }
  }

  private handleReload = () => {
    // Limpiar caché antes de recargar si es un error de módulo
    if (this.state.isModuleLoadError && 'caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(name => caches.delete(name)));
      }).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Algo salió mal</h1>
            <p className="text-gray-600 mb-6">
              {this.state.isModuleLoadError 
                ? 'No se pudo cargar un módulo de la aplicación. Esto puede deberse a un problema de red o caché.'
                : 'Ocurrió un error inesperado. Por favor, recarga la página.'}
            </p>
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Detalles del error
                </summary>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Recargar página
            </button>
            {this.state.isModuleLoadError && (
              <p className="text-xs text-gray-500 mt-4">
                💡 Si el problema persiste, intenta limpiar la caché del navegador manualmente.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

