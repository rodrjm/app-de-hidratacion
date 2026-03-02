import React from "react";
import { Platform } from "react-native";
import { HydrationWidget } from "./HydrationWidget";

/**
 * Actualiza el widget de hidratación con los valores actuales.
 *
 * Puedes llamarla, por ejemplo, después de registrar un consumo:
 *
 *   await updateWidgetData(totalConsumidoHoy, metaDiariaMl);
 *
 * NOTA: Esta función está protegida para evitar crashes en iOS o cuando
 * el módulo nativo no está disponible.
 */
export async function updateWidgetData(consumido: number, meta: number) {
  // Solo ejecutar en Android (el widget es exclusivo de Android)
  if (Platform.OS !== "android") {
    return;
  }

  try {
    // Importación dinámica para evitar crashes si el módulo nativo no está disponible
    const { requestWidgetUpdate } = await import("react-native-android-widget");
    
    // Validar parámetros para evitar errores de renderizado
    const safeConsumido = typeof consumido === "number" && !isNaN(consumido) ? Math.round(consumido) : 0;
    const safeMeta = typeof meta === "number" && !isNaN(meta) && meta > 0 ? Math.round(meta) : 2000;

    await requestWidgetUpdate({
      widgetName: "HydrationWidget",
      renderWidget: () => <HydrationWidget consumido={safeConsumido} meta={safeMeta} />,
    });
  } catch (e) {
    // Silenciar errores del widget para no afectar la experiencia del usuario
    console.log("[Widget] Error actualizando widget:", e);
  }
}

