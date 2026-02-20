import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { Buffer } from "buffer";

// Necesario para que WebBrowser funcione correctamente en web
if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

/**
 * Configuración de Google OAuth usando expo-auth-session
 */
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

/**
 * Inicia el flujo de autenticación con Google
 * Retorna el credential codificado en base64 que el backend espera
 */
export async function signInWithGoogle(): Promise<string | null> {
  try {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error("Google Client ID no configurado. Configura EXPO_PUBLIC_GOOGLE_CLIENT_ID en tu archivo .env");
    }

    // Configurar el redirect URI según la plataforma
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: Platform.OS === "web" ? undefined : "com.dosisvital.app",
      path: "auth",
    });

    console.log("[GoogleAuth] Redirect URI:", redirectUri);

    // Crear el request de autenticación
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
      usePKCE: Platform.OS !== "web", // PKCE solo en mobile
      additionalParameters: {},
    });

    // Obtener la URL de autorización
    const authUrl = await request.makeAuthUrlAsync(discovery);
    console.log("[GoogleAuth] Auth URL generada");

    // Abrir el navegador para autenticación
    const result = await AuthSession.startAsync({
      authUrl,
      returnUrl: redirectUri,
    });

    console.log("[GoogleAuth] Result type:", result.type);

    if (result.type === "success" && result.params.access_token) {
      // Obtener información del usuario usando el token
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${result.params.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error("Error al obtener información del usuario de Google");
      }

      const userInfo = await userInfoResponse.json();
      console.log("[GoogleAuth] User info obtenida:", { email: userInfo.email });

      // Construir el credential en el formato que espera el backend
      const credentialData = {
        email: userInfo.email,
        first_name: userInfo.given_name || "",
        last_name: userInfo.family_name || "",
        picture: userInfo.picture,
        sub: userInfo.id,
      };

      // Codificar en base64 (como lo hace el frontend web con btoa)
      // En React Native usamos Buffer
      const credentialJson = JSON.stringify(credentialData);
      const credential = Buffer.from(credentialJson, "utf-8").toString("base64");

      console.log("[GoogleAuth] Credential generado");
      return credential;
    } else if (result.type === "cancel") {
      throw new Error("Autenticación cancelada por el usuario");
    } else if (result.type === "error") {
      throw new Error(result.error?.message || "Error en la autenticación con Google");
    } else {
      throw new Error("Error desconocido en la autenticación con Google");
    }
  } catch (error) {
    console.error("[GoogleAuth] Error:", error);
    throw error;
  }
}
