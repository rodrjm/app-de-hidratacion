/**
 * Cliente HTTP para la API (React Native / Expo).
 * Usa expo-secure-store para el token JWT.
 * Base URL con IP de la máquina para que el emulador/dispositivo pueda conectarse.
 */
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

const getApiBaseUrl = (): string => {
  // En Expo se usa EXPO_PUBLIC_ para variables accesibles en el cliente
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  // Fallback: IP local (cambia 192.168.1.X por la IP de tu máquina en la red)
  return "http://192.168.0.26:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

const publicEndpoints = [
  "/users/login/",
  "/users/register/",
  "/users/google-auth/",
  "/users/token/refresh/",
];

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  return publicEndpoints.some((endpoint) => url.includes(endpoint));
}

async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredTokens(access: string, refresh?: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function clearStoredTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {}
}

// Timeout ~55s: backend en Render (plan gratuito) puede tardar hasta ~50s en despertar
const API_TIMEOUT_MS = 55000;

// Tokens en memoria para sesiones sin "Recordarme"
// Estos tokens se usan cuando el usuario hace login sin marcar "Recordarme",
// para que las peticiones puedan autenticarse durante la sesión actual
// y el refresh token también esté disponible para renovar el access token.
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export function setInMemoryTokens(access: string | null, refresh?: string | null): void {
  inMemoryAccessToken = access;
  if (refresh !== undefined) {
    inMemoryRefreshToken = refresh;
  }
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getInMemoryRefreshToken(): string | null {
  return inMemoryRefreshToken;
}

export function clearInMemoryTokens(): void {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
}

// Variables para manejar concurrencia en el refresh de tokens
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = (config.method || "GET").toUpperCase();
    const url = `${config.baseURL || ""}${config.url || ""}`;
    console.log("[API] Request →", method, url);
    if (!isPublicEndpoint(config.url)) {
      // Primero intentar obtener el token de SecureStore (sesión persistida)
      // Si no hay, usar el token en memoria (sesión temporal sin "Recordarme")
      let token = await getStoredToken();
      if (!token) {
        token = getInMemoryAccessToken();
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.log("[API] Request error →", error?.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Logueo simplificado para evitar imprimir objetos grandes en React Native
    console.log(`[API] Response ← ${response.status} ${response.config?.url}`);

    // Mantenemos el mismo contrato que antes: devolvemos el objeto Axios completo
    // Si vieras que el crash persiste y tus llamadas siempre usan directamente response.data,
    // podríamos considerar cambiar a "return response.data;" aquí.
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    console.log("[API] Response error ←", {
      message: error?.message,
      code: error?.code,
      status,
      url,
    });

    // Ante 401 en una ruta protegida: intentar renovar el access con el refresh token.
    if (status === 401 && !isPublicEndpoint(url) && !originalRequest._retried) {
      if (isRefreshing) {
        // Si ya hay una petición refrescando el token, encolamos esta petición
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api.request(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retried = true;
      isRefreshing = true;

      // Intentar obtener refresh token de SecureStore primero, luego de memoria
      let refreshToken = await getStoredRefreshToken();
      const isPersistedSession = !!refreshToken;
      if (!refreshToken) {
        refreshToken = getInMemoryRefreshToken();
      }

      if (!refreshToken) {
        isRefreshing = false;
        await clearStoredTokens();
        clearInMemoryTokens();
        return Promise.reject(error);
      }

      try {
        // Hacemos el refresh usando axios puro para evitar el interceptor original
        const { data } = await axios.post<{ access: string; refresh?: string }>(
          `${API_BASE_URL}/users/token/refresh/`,
          { refresh: refreshToken }
        );

        if (data.access) {
          // Guardar tokens según el tipo de sesión original
          if (isPersistedSession) {
            await setStoredTokens(data.access, data.refresh ?? undefined);
          } else {
            setInMemoryTokens(data.access, data.refresh ?? undefined);
          }
          api.defaults.headers.common["Authorization"] = `Bearer ${data.access}`;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
          }

          processQueue(null, data.access);
          return api.request(originalRequest);
        }
      } catch (refreshErr: unknown) {
        const refreshStatus = (refreshErr as { response?: { status?: number } })?.response?.status;
        console.log("[API] Token refresh failed ←", refreshErr, "status:", refreshStatus);

        processQueue(refreshErr as Error, null);

        if (refreshStatus === 401) {
          await clearStoredTokens();
          clearInMemoryTokens();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

/** Envía un ping al backend para despertarlo (Render puede tardar ~50s en cold start). */
export function wakeUpServer(): void {
  const healthUrl = API_BASE_URL.replace(/\/$/, "") + "/health/";
  fetch(healthUrl, { method: "GET", cache: "no-store" }).catch(() => {});
}

export default api;
