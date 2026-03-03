import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import * as SecureStore from "expo-secure-store";
import { HydrationWidget } from "./HydrationWidget";

const TOKEN_KEY = "access_token";

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  HydrationWidget,
};

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  return "http://192.168.0.26:8000/api";
};

async function fetchTodayStatsFromApi(): Promise<{ consumido: number; meta: number } | null> {
  try {
    const baseUrl = getApiBaseUrl().replace(/\/$/, "");
    const url = `${baseUrl}/consumos/daily_summary/`;
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      total_hidratacion_efectiva_ml?: number;
      meta_ml?: number;
    };
    const consumido = typeof data.total_hidratacion_efectiva_ml === "number" ? data.total_hidratacion_efectiva_ml : 0;
    const meta = typeof data.meta_ml === "number" ? data.meta_ml : 2000;
    return { consumido, meta };
  } catch (e) {
    console.log("[Widget] Error obteniendo stats para widget:", e);
    return null;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;
  const WidgetComponent = WIDGET_COMPONENTS[widgetInfo.widgetName];

  if (!WidgetComponent) {
    return;
  }

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const stats = await fetchTodayStatsFromApi();
      const consumido = stats?.consumido ?? 0;
      const meta = stats?.meta ?? 2000;
      renderWidget(<WidgetComponent consumido={consumido} meta={meta} />);
      break;
    }
    case "WIDGET_CLICK":
    case "WIDGET_DELETED":
    default:
      break;
  }
}

