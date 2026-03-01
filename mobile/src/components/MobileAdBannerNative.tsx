import React from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

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
    const extraBottom = Math.max(insets.bottom, 0);
    const TAB_BAR_TOTAL_HEIGHT = 64 + extraBottom;

    return (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: TAB_BAR_TOTAL_HEIGHT,
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
