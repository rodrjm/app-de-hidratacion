import React from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";

type MobileAdPlacement = "footer" | "dashboard_history" | "profile";

interface MobileAdBannerNativeProps {
  placement: MobileAdPlacement;
}

/**
 * Implementación real del banner AdMob. Solo se carga en development build / producción.
 * No importar este archivo desde Expo Go (el módulo nativo no existe ahí).
 */
export default function MobileAdBannerNative({ placement }: MobileAdBannerNativeProps) {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight?.() ?? 0;

  if (!user || user.es_premium) {
    return null;
  }

  const getUnitId = () => {
    let envId: string | undefined;
    if (placement === "footer") {
      envId = process.env.EXPO_PUBLIC_ADMOB_BANNER_FOOTER;
    } else if (placement === "dashboard_history") {
      envId = process.env.EXPO_PUBLIC_ADMOB_BANNER_DASHBOARD;
    } else {
      envId = process.env.EXPO_PUBLIC_ADMOB_BANNER_PROFILE;
    }
    return envId && envId.trim().length > 0 ? envId : TestIds.BANNER;
  };

  const unitId = getUnitId();

  if (placement === "footer") {
    // Cuando se usa globalmente (como en MainTabs), anclamos el banner justo por encima
    // del Bottom Tab Navigator usando su altura real. Si por algún motivo no hay tab bar,
    // usamos bottom: 0 para pegarlo al borde inferior del contenedor.
    const bottom = tabBarHeight > 0 ? tabBarHeight : 0;

    return (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom,
          alignItems: "center",
        }}
      >
        <BannerAd unitId={unitId} size={BannerAdSize.BANNER} />
      </View>
    );
  }

  // Banners embebidos en pantallas (dashboard_history, profile): sin márgenes extra que generen huecos.
  return (
    <View
      style={{
        minHeight: 50,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <BannerAd unitId={unitId} size={BannerAdSize.BANNER} />
    </View>
  );
}
