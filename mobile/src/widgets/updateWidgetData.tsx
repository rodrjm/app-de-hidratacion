import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { HydrationWidget } from "./HydrationWidget";

/**
 * Actualiza el widget de hidratación con los valores actuales.
 *
 * Puedes llamarla, por ejemplo, después de registrar un consumo:
 *
 *   await updateWidgetData(totalConsumidoHoy, metaDiariaMl);
 */
export async function updateWidgetData(consumido: number, meta: number) {
  try {
    await requestWidgetUpdate({
      widgetName: "HydrationWidget",
      renderWidget: () => <HydrationWidget consumido={consumido} meta={meta} />,
    });
  } catch (e) {
    console.log("[Widget] Error actualizando widget de hidratación:", e);
  }
}

