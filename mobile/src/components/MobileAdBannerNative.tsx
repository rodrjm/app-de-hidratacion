import React from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
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
    // Banner de footer: se posiciona justo encima del tab bar
    // Usamos un valor fijo aproximado ya que el componente se renderiza fuera del Tab.Navigator
    // y no tiene acceso a useBottomTabBarHeight
    const TAB_BAR_HEIGHT = 64;

    return (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: TAB_BAR_HEIGHT,
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
