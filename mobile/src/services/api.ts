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

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = (config.method || "GET").toUpperCase();
    const url = `${config.baseURL || ""}${config.url || ""}`;
    console.log("[API] Request →", method, url, {
      params: config.params,
      data: config.data,
    });
    if (!isPublicEndpoint(config.url)) {
      const token = await getStoredToken();
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
    console.log(
      "[API] Response ←",
      response.status,
      response.config.url,
      typeof response.data === "string" ? response.data.slice(0, 200) : response.data
    );
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    console.log("[API] Response error ←", {
      message: error?.message,
      code: error?.code,
      status,
      url,
    });
    if (status === 401 && !isPublicEndpoint(url)) {
      await clearStoredTokens();
    }
    return Promise.reject(error);
  }
);

export default api;
