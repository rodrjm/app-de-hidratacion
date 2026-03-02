import React from "react";
import { View, Platform } from "react-native";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";

type MobileAdPlacement = "footer" | "dashboard_history" | "profile";

interface MobileAdBannerProps {
  placement: MobileAdPlacement;
}

/**
 * Contenedor de anuncios para la app móvil (AdMob).
 *
 * - Solo se muestra para usuarios NO premium.
 * - En Expo Go no existe el módulo nativo de AdMob: no se carga y no se muestra nada.
 * - En development build / producción usa react-native-google-mobile-ads (BannerAd).
 */
export default function MobileAdBanner({ placement }: MobileAdBannerProps) {
  const { user } = useAuth();

  // En Expo Go el módulo nativo RNGoogleMobileAdsModule no existe → no cargar AdMob
  const isExpoGo = Constants.appOwnership === "expo";
  if (isExpoGo) {
    return null;
  }

  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return null;
  }

  if (!user || user.es_premium) {
    return null;
  }

  // Carga dinámica: solo cuando no estamos en Expo Go (evita TurboModuleRegistry.getEnforcing)
  try {
    const MobileAdBannerNative = require("./MobileAdBannerNative").default;
    return <MobileAdBannerNative placement={placement} />;
  } catch (e) {
    console.log("[MobileAdBanner] Error cargando AdMob:", e);
    return null;
  }
}
