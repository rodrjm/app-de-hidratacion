/**
 * Utilidad para "despertar" el servidor de Render antes de que el usuario necesite usarlo.
 * En plan gratuito, Render puede tardar hasta ~50 segundos en cold start.
 */

/**
 * Hace un ping al servidor para despertarlo.
 * No espera la respuesta, solo inicia el proceso de wake-up.
 */
export function wakeUpServer(): void {
  const apiUrl = import.meta.env?.VITE_API_URL || 'https://dosis-vital.onrender.com/api';
  
  // Hacer un ping al endpoint de health check
  fetch(`${apiUrl}/health/`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
  }).catch(() => {
    // Ignorar errores, solo queremos "despertar" el servidor
    // El error es esperado si el servidor está dormido
  });
  
  console.log('🔔 Server wake-up ping sent');
}

/**
 * Inicia un proceso de wake-up periódico para mantener el servidor despierto.
 * Útil para aplicaciones con usuarios activos.
 * 
 * @param interval Intervalo en minutos (default: 10 minutos)
 */
export function startWakeUpInterval(intervalMinutes = 10): () => void {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Hacer un ping inmediato
  wakeUpServer();
  
  // Configurar intervalo
  const intervalId = setInterval(() => {
    wakeUpServer();
  }, intervalMs);
  
  console.log(`🔄 Wake-up interval started (every ${intervalMinutes} minutes)`);
  
  // Retornar función para detener el intervalo
  return () => {
    clearInterval(intervalId);
    console.log('🛑 Wake-up interval stopped');
  };
}

