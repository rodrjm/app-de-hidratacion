/**
 * Contexto de autenticación para la app móvil.
 * Maneja user, isLoading, token (vía sesión persistida en SecureStore).
 * Provee login(email, password), logout() y restauración de sesión al arrancar.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authService } from "../services/auth";
import { clearStoredTokens, clearInMemoryTokens } from "../services/api";
import { signInWithGoogle } from "../utils/googleAuth";
import type { User } from "../types";

const TOKEN_KEY = "access_token";

function getHttpStatus(err: unknown): number | null {
  const e = err as { response?: { status?: number } };
  return typeof e?.response?.status === "number" ? e.response.status : null;
}

function isAuthFailureStatus(status: number | null): boolean {
  return status === 401 || status === 403;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, options?: { rememberMe?: boolean }) => Promise<void>;
  loginWithGoogle: () => Promise<{ is_new_user: boolean }>;
  register: (userData: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirmPassword?: string;
  peso: number;
  peso_unidad?: "kg" | "lb";
  fecha_nacimiento: string;
  es_fragil_o_insuficiencia_cardiaca?: boolean;
  codigo_referido?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      console.log("[AuthContext] refreshUser →");
      const u = await authService.getCurrentUser();
      setUser(u);
      console.log("[AuthContext] refreshUser success ←", { userId: u?.id });
    } catch (e) {
      console.log("[AuthContext] refreshUser error ←", e);
      const status = getHttpStatus(e);
      // Solo invalidar sesión si el token ya no es válido (401/403).
      // Para errores transitorios (500 / red / Neon), mantener token y usuario actual.
      if (isAuthFailureStatus(status)) {
        await clearStoredTokens();
        clearInMemoryTokens();
        setUser(null);
        setToken(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log("[AuthContext] bootstrap session →");
        const t = await SecureStore.getItemAsync(TOKEN_KEY);
        if (cancelled) return;
        if (t) {
          setToken(t);
          try {
            const u = await authService.getCurrentUser();
            if (cancelled) return;
            setUser(u);
            console.log("[AuthContext] bootstrap success ←", { userId: u?.id });
          } catch (profileErr) {
            const status = getHttpStatus(profileErr);
            console.log("[AuthContext] bootstrap profile error ←", profileErr);
            // Si el token es inválido, limpiar sesión. Si es un fallo transitorio (Neon/red),
            // conservar token para que "Recordarme" no se rompa y permitir reintento posterior.
            if (isAuthFailureStatus(status)) {
              await clearStoredTokens();
              clearInMemoryTokens();
              if (!cancelled) setToken(null);
              if (!cancelled) setUser(null);
            } else {
              if (!cancelled) setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.log("[AuthContext] bootstrap error ←", e);
        // No borrar tokens por fallos transitorios durante bootstrap (p.ej. DB/SSL en Neon).
        // Si hubiera un problema real de auth, se limpiará al intentar getCurrentUser().
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (
    email: string,
    password: string,
    options?: { rememberMe?: boolean }
  ) => {
    setIsLoading(true);
    try {
      console.log("[AuthContext] login →", { rememberMe: options?.rememberMe });
      const res = await authService.login({ email, password }, options);
      setToken(res.access);
      setUser(res.user);
      // Si "Recordarme" está desmarcado, asegurarse de que no hay tokens persistidos
      // (authService.login ya maneja guardar en memoria vs SecureStore)
      if (options?.rememberMe === false) {
        await clearStoredTokens();
      }
      console.log("[AuthContext] login success ←", { userId: res.user?.id });
    } catch (e) {
      console.log("[AuthContext] login error ←", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("[AuthContext] loginWithGoogle →");
      const credential = await signInWithGoogle();
      if (!credential) {
        throw new Error("No se pudo obtener la credencial de Google");
      }
      const res = await authService.loginWithGoogle(credential);
      setToken(res.access);
      setUser(res.user);
      console.log("[AuthContext] loginWithGoogle success ←", {
        userId: res.user?.id,
        is_new_user: res.is_new_user,
      });
      return { is_new_user: res.is_new_user };
    } catch (e) {
      console.log("[AuthContext] loginWithGoogle error ←", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterPayload) => {
    setIsLoading(true);
    try {
      console.log("[AuthContext] register →");
      const res = await authService.register(userData as import("../types").RegisterForm);
      setToken(res.access);
      setUser(res.user);
      console.log("[AuthContext] register success ←", { userId: res.user?.id });
    } catch (e) {
      console.log("[AuthContext] register error ←", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("[AuthContext] logout →");
      await authService.logout();
      setToken(null);
      setUser(null);
      console.log("[AuthContext] logout done ←");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("[AuthContext] deleteAccount →");
      await authService.deleteAccount();
      setToken(null);
      setUser(null);
      console.log("[AuthContext] deleteAccount done ←");
    } catch (e) {
      console.log("[AuthContext] deleteAccount error ←", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    deleteAccount,
    setUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
