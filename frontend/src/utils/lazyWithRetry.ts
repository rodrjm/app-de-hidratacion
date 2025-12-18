import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Función helper para lazy loading con retry automático.
 * Optimizado para manejar el "cold start" de Render (~30 segundos).
 * Intenta cargar el módulo con backoff exponencial y tiempos de espera más largos.
 * 
 * @param importFn Función de importación del módulo
 * @param retries Número de intentos (default: 5 para dar tiempo al servidor de Render)
 * @param initialDelay Delay inicial en ms (default: 2000)
 * @returns Componente lazy con retry logic optimizado para Render
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 5,
  initialDelay = 2000
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;
    let isServerWakingUp = false;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const module = await importFn();
        
        // Si el servidor estaba despertando, loguear el éxito y emitir evento
        if (isServerWakingUp) {
          console.log('✅ Server woke up successfully, module loaded');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('module-loaded'));
          }
        }
        
        return module;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Detectar si es un error de servidor dormido (Render cold start)
        const isNetworkError = 
          lastError.message.includes('Failed to fetch') ||
          lastError.message.includes('dynamically imported module') ||
          lastError.message.includes('NetworkError') ||
          lastError.message.includes('Load failed');
        
        if (isNetworkError && attempt === 1) {
          isServerWakingUp = true;
          console.warn('⚠️ Server appears to be waking up (Render cold start detected)');
        }
        
        // Si es el último intento, lanzar el error
        if (attempt === retries) {
          console.error(`❌ Failed to load module after ${retries} attempts:`, lastError);
          throw lastError;
        }
        
        // Backoff exponencial con tiempos más largos para Render
        // Intentos: 2s, 5s, 10s, 15s, 20s (total ~52s, suficiente para Render)
        const delay = attempt === 1 
          ? initialDelay 
          : Math.min(initialDelay * Math.pow(2, attempt - 1) + (attempt - 1) * 1000, 20000);
        
        const message = isServerWakingUp
          ? `Servidor despertando... (intento ${attempt}/${retries}, esperando ${Math.round(delay/1000)}s)`
          : `Error al cargar módulo (intento ${attempt}/${retries}), reintentando en ${Math.round(delay/1000)}s...`;
        
        console.warn(message);
        
        // Mostrar mensaje al usuario solo después del segundo intento
        if (attempt >= 2 && isServerWakingUp && typeof window !== 'undefined') {
          // Emitir evento personalizado para que el ErrorBoundary o App lo capture
          window.dispatchEvent(new CustomEvent('server-waking-up', {
            detail: { attempt, retries, delay }
          }));
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Esto no debería ejecutarse nunca, pero TypeScript lo requiere
    throw lastError || new Error('Failed to load module');
  });
}

/**
 * Función helper para lazy loading con retry y limpieza de caché.
 * Útil cuando hay problemas de caché del navegador.
 * 
 * @param importFn Función de importación del módulo
 * @param retries Número de intentos (default: 3)
 * @returns Componente lazy con retry y cache busting
 */
export function lazyWithRetryAndCacheBust<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const module = await importFn();
        return module;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Si es el último intento, intentar limpiar caché y recargar
        if (attempt === retries) {
          console.error(`Failed to load module after ${retries} attempts:`, lastError);
          
          // Si el error es relacionado con fetch, intentar limpiar caché
          if (lastError.message.includes('Failed to fetch') || 
              lastError.message.includes('dynamically imported module')) {
            console.warn('Module load error detected, attempting cache clear and reload...');
            
            // Limpiar caché del navegador si es posible
            if ('caches' in window) {
              try {
                const cacheNames = await caches.keys();
                await Promise.all(
                  cacheNames.map(name => caches.delete(name))
                );
                console.log('Cache cleared, reloading page...');
                
                // Recargar la página después de limpiar caché
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              } catch (cacheError) {
                console.warn('Failed to clear cache:', cacheError);
              }
            }
          }
          
          throw lastError;
        }
        
        // Esperar antes del siguiente intento (con backoff exponencial)
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.warn(`Failed to load module (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Failed to load module');
  });
}

