import type { AxiosError } from "axios";
import Toast from "react-native-toast-message";

/** Mensaje mostrado al guardar en cola offline (consumos / actividades). */
export const OFFLINE_QUEUED_USER_MESSAGE =
  "Guardado sin conexión. Se sincronizará automáticamente cuando recuperes el internet.";

let lastOfflineModeToastAt = 0;

/** Aviso breve al fallar lecturas por red; evita spam si hay varios reintentos seguidos. */
export function showOfflineModeToast(throttleMs = 14000): void {
  const now = Date.now();
  if (now - lastOfflineModeToastAt < throttleMs) return;
  lastOfflineModeToastAt = now;
  Toast.show({
    type: "info",
    text1: "Sin conexión",
    text2: "Estás en modo sin conexión",
    visibilityTime: 3500,
  });
}

/**
 * Errores típicos de Axios/React Native cuando no hay respuesta del servidor (sin red, timeout, etc.).
 */
export function isLikelyNetworkError(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const err = error as AxiosError & { message?: string };
  const code = err.code;
  if (code === "ERR_NETWORK" || code === "ECONNABORTED" || code === "ETIMEDOUT") return true;
  const msg = typeof err.message === "string" ? err.message : "";
  if (msg === "Network Error" || /network/i.test(msg)) return true;
  if (err.request && !err.response) return true;
  return false;
}
