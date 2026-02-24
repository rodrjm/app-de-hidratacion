/**
 * Google Sign-In nativo (@react-native-google-signin/google-signin).
 * Requiere development build (no funciona en Expo Go).
 * En Google Cloud: cliente Android con package com.dosisvital.app + SHA-1;
 * webClientId = Client ID del cliente "Aplicación web" (o el Android).
 */
import Constants from "expo-constants";
import { Buffer } from "buffer";
import type { User as GoogleUser } from "@react-native-google-signin/google-signin";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

/** Decodifica el payload del idToken (JWT) para obtener email u otros claims si el user object no los trae. */
function getEmailFromIdToken(idToken: string | null): string | null {
  if (!idToken || typeof idToken !== "string") return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];

    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
    ) as { email?: string };

    return decoded.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Inicia el flujo de autenticación con Google (SDK nativo).
 * Retorna el credential codificado en base64 que el backend espera (email, first_name, last_name, picture, sub).
 * Solo funciona en development build o producción; en Expo Go lanza un error claro.
 * Tras el registro, el backend devuelve is_new_user y el usuario es redirigido al Onboarding para completar peso y fecha de nacimiento.
 */
export async function signInWithGoogle(): Promise<string | null> {
  const isExpoGo = Constants.appOwnership === "expo";
  if (isExpoGo) {
    throw new Error(
      "Iniciar sesión con Google requiere una build de desarrollo o producción. No está disponible en Expo Go. Ejecuta: npx expo prebuild --clean y luego npx expo run:android"
    );
  }

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      "Google Client ID no configurado. Configura EXPO_PUBLIC_GOOGLE_CLIENT_ID en tu archivo .env"
    );
  }

  try {
    const { GoogleSignin } = await import("@react-native-google-signin/google-signin");

    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      scopes: ["email", "profile"],
    });

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();

    if (!result || (result as { type?: string }).type === "cancelled") {
      throw new Error("Autenticación cancelada por el usuario");
    }

    const signInResult = result as GoogleUser;
    const user = signInResult.user;
    if (!user) throw new Error("Google no proporcionó los datos del usuario");

    let email = user.email ?? null;
    if (!email && signInResult.idToken) {
      email = getEmailFromIdToken(signInResult.idToken);
    }
    if (!email) throw new Error("Google no proporcionó el correo electrónico");

    const givenName = user.givenName ?? "";
    const familyName = user.familyName ?? "";
    const fullName = user.name ?? "";
    const first_name = givenName || (fullName ? fullName.trim().split(/\s+/)[0] ?? "" : "");
    const last_name = familyName || (fullName ? fullName.trim().split(/\s+/).slice(1).join(" ") ?? "" : "");

    const credentialData = {
      email,
      first_name,
      last_name,
      picture: user.photo ?? null,
      sub: user.id ?? "",
    };

    const credentialJson = JSON.stringify(credentialData);
    const credential = Buffer.from(credentialJson, "utf-8").toString("base64");
    return credential;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("cancelada") || message.includes("cancel")) {
      throw new Error("Autenticación cancelada por el usuario");
    }
    if (message.includes("DEVELOPER_ERROR") || message.includes("10")) {
      throw new Error(
        "Error de configuración de Google. Comprueba en Google Cloud: cliente Android con package com.dosisvital.app y SHA-1 correcto."
      );
    }
    throw err;
  }
}
