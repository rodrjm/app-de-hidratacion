import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/globals.css'

// Log para debugging
console.log('Main.tsx: Starting app initialization');

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Verificar que el elemento root existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

try {
  console.log('Main.tsx: Creating React root');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Main.tsx: Rendering app');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('Main.tsx: App rendered successfully');
} catch (error) {
  console.error('Main.tsx: Error rendering app:', error);
  // Fallback: mostrar un mensaje de error simple
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 20px; text-align: center;">
      <div>
        <h1 style="color: #333; margin-bottom: 16px;">Error al cargar la aplicación</h1>
        <p style="color: #666; margin-bottom: 24px;">Ocurrió un error al inicializar la aplicación.</p>
        <button onclick="window.location.reload()" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
          Recargar página
        </button>
        <details style="margin-top: 24px; text-align: left;">
          <summary style="cursor: pointer; color: #666;">Detalles del error</summary>
          <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow: auto; margin-top: 8px; font-size: 12px;">${error instanceof Error ? error.stack : String(error)}</pre>
        </details>
      </div>
    </div>
  `;
}
