/**
 * Servicio de autenticación para la app móvil.
 * Usa api (axios con token desde SecureStore) y persiste tokens con setStoredTokens/clearStoredTokens.
 */
import api, { setStoredTokens, clearStoredTokens, getStoredRefreshToken, setInMemoryToken } from "./api";
import type { User, LoginForm, RegisterForm, AuthResponse, RegisterBackendResponse } from "../types";

const RETRY_INTERVAL_MS = 5000;
const RETRY_MAX_TOTAL_MS = 55000;

function isConnectionError(e: unknown): boolean {
  const ex = e as { response?: unknown; code?: string };
  return !ex.response && (ex.code === "ECONNABORTED" || ex.code === "ERR_NETWORK");
}

async function withRetryOnConnection<T>(fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  for (;;) {
    try {
      return await fn();
    } catch (e: unknown) {
      const elapsed = Date.now() - start;
      if (!isConnectionError(e)) throw e;
      if (elapsed >= RETRY_MAX_TOTAL_MS) throw new Error("Error de conexión. Verifica tu internet.");
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
    }
  }
}

export const authService = {
  async login(
    credentials: LoginForm,
    options?: { rememberMe?: boolean }
  ): Promise<AuthResponse> {
    try {
      console.log("[AUTH] login →", { email: credentials.email, rememberMe: options?.rememberMe });
      const { data } = await withRetryOnConnection(() =>
        api.post<AuthResponse>("/users/login/", {
          email: credentials.email,
          password: credentials.password,
        })
      );
      console.log("[AUTH] login success ←", { userId: data.user?.id });
      // Persistir tokens según la opción "Recordarme"
      if (options?.rememberMe === true) {
        // Guardar en SecureStore para persistencia entre sesiones
        await setStoredTokens(data.access, data.refresh);
      } else {
        // Guardar solo en memoria para la sesión actual
        setInMemoryToken(data.access);
      }
      return data;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: Record<string, unknown> }; code?: string };
      if (!e.response) {
        console.log("[AUTH] login network error ←", err);
        throw new Error("Error de conexión. Verifica tu internet.");
      }
      if (e.response?.status === 400) {
        const d = e.response.data;
        if (d?.email) throw new Error("Correo electrónico no encontrado. Verifica tu email.");
        if (d?.password) throw new Error("Contraseña incorrecta. Inténtalo de nuevo.");
        if (d?.non_field_errors) throw new Error("Credenciales inválidas. Verifica tu correo y contraseña.");
        if (d?.detail) throw new Error(String(d.detail));
      }
      if (e.response?.status === 401 || e.response?.status === 404) {
        throw new Error("Credenciales inválidas. Verifica tu correo electrónico y contraseña.");
      }
      console.log("[AUTH] login server error ←", e.response?.status, e.response?.data);
      throw new Error("Error del servidor. Inténtalo más tarde.");
    }
  },

  async register(userData: RegisterForm): Promise<AuthResponse> {
    try {
      console.log("[AUTH] register →", { email: userData.email });
      const base = userData.email.replace(/@.*$/, "").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20) || "user";
      const username = `${base}_${Date.now()}`;
      const payload: Record<string, unknown> = {
        username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: userData.password,
        password_confirm: userData.confirmPassword ?? userData.password,
        peso: userData.peso_unidad === "lb" ? userData.peso * 0.453592 : userData.peso,
        fecha_nacimiento: userData.fecha_nacimiento,
      };
      if (userData.codigo_referido) payload.codigo_referido = userData.codigo_referido;
      if (userData.es_fragil_o_insuficiencia_cardiaca != null) {
        payload.es_fragil_o_insuficiencia_cardiaca = userData.es_fragil_o_insuficiencia_cardiaca;
      }
      const { data } = await withRetryOnConnection(() =>
        api.post<RegisterBackendResponse>("/users/register/", payload)
      );
      console.log("[AUTH] register success ←", { userId: data.user?.id });
      const access = data.tokens.access;
      const refresh = data.tokens.refresh;
      await setStoredTokens(access, refresh);
      return { user: data.user, access, refresh };
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: Record<string, unknown> }; code?: string };
      if (!e.response) {
        console.log("[AUTH] register network error ←", err);
        throw new Error("Error de conexión. Verifica tu internet.");
      }
      console.log("[AUTH] register server error ←", e.response?.status, e.response?.data);
      if (err instanceof Error) throw err;
      throw new Error("Error del servidor. Inténtalo más tarde.");
    }
  },

  async logout(): Promise<void> {
    try {
      console.log("[AUTH] logout →");
      const refresh = await getStoredRefreshToken();
      if (refresh) {
        await api.post("/users/logout/", { refresh_token: refresh }).catch(() => {});
      }
    } catch {
      // ignore
    } finally {
      await clearStoredTokens();
      setInMemoryToken(null);
      console.log("[AUTH] logout done");
    }
  },

  async getCurrentUser(): Promise<User> {
    console.log("[AUTH] getCurrentUser →");
    const { data } = await api.get<User>("/users/profile/");
    console.log("[AUTH] getCurrentUser success ←", { userId: data?.id });
    return data;
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    try {
      console.log("[AUTH] updateProfile →", payload);
      const { data } = await api.patch<User>("/users/profile/", payload);
      console.log("[AUTH] updateProfile success ←", { userId: data?.id });
      return data;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: any } };
      if (!e.response) {
        throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet.");
      }
      const d = e.response.data;
      if (typeof d === "object") {
        if (d.error && d.detail) {
          throw new Error(String(d.detail));
        }
        const firstField = Object.keys(d)[0];
        if (firstField && Array.isArray(d[firstField])) {
          throw new Error(String(d[firstField][0]));
        }
      }
      throw new Error("Error al actualizar el perfil. Inténtalo más tarde.");
    }
  },

  async changePassword(params: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<void> {
    try {
      console.log("[AUTH] changePassword →");
      await api.post("/users/change-password/", params);
      console.log("[AUTH] changePassword success ←");
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: any } };
      if (!e.response) {
        throw new Error(
          "No se pudo conectar con el servidor. Verifica tu conexión a internet."
        );
      }
      const d = e.response.data;
      if (d?.old_password) {
        throw new Error(
          Array.isArray(d.old_password) ? String(d.old_password[0]) : String(d.old_password)
        );
      }
      if (d?.new_password_confirm) {
        throw new Error(
          Array.isArray(d.new_password_confirm)
            ? String(d.new_password_confirm[0])
            : String(d.new_password_confirm)
        );
      }
      if (d?.new_password) {
        const msg = Array.isArray(d.new_password) ? d.new_password.join(" ") : String(d.new_password);
        throw new Error(msg);
      }
      if (d?.detail) {
        throw new Error(String(d.detail));
      }
      throw new Error("Error al cambiar la contraseña. Inténtalo más tarde.");
    }
  },

  async loginWithGoogle(credential: string): Promise<{ user: User; access: string; refresh: string; is_new_user: boolean }> {
    try {
      console.log("[AUTH] loginWithGoogle →");
      const { data } = await api.post<{
        user: User;
        access: string;
        refresh: string;
        is_new_user: boolean;
      }>("/users/google-auth/", { credential });
      console.log("[AUTH] loginWithGoogle success ←", { userId: data.user?.id, is_new_user: data.is_new_user });
      await setStoredTokens(data.access, data.refresh);
      return data;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: Record<string, unknown> } };
      if (!e.response) {
        const message =
          (err as any)?.code === "ECONNABORTED"
            ? "No se pudo conectar con el servidor. Verifica tu conexión a internet (tiempo de espera agotado)."
            : "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
        console.log("[AUTH] loginWithGoogle network error ←", err);
        throw new Error(message);
      }
      console.log("[AUTH] loginWithGoogle server error ←", e.response?.status, e.response?.data);
      const d = e.response.data;
      if (d?.error) {
        throw new Error(String(d.error));
      }
      if (d?.detail) {
        throw new Error(String(d.detail));
      }
      throw new Error("Error al autenticar con Google. Inténtalo más tarde.");
    }
  },

  async deleteAccount(): Promise<void> {
    try {
      console.log("[AUTH] deleteAccount →");
      await api.post("/users/delete-account/");
      console.log("[AUTH] deleteAccount success ←");
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } };
      if (!e.response) {
        throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet.");
      }
      const msg = e.response.data?.error ?? "No se pudo eliminar la cuenta. Inténtalo más tarde.";
      throw new Error(msg);
    } finally {
      await clearStoredTokens();
    }
  },
};
