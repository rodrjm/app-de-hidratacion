import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { HydrationWidget } from "./HydrationWidget";

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  HydrationWidget,
};

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
      renderWidget(<WidgetComponent consumido={0} meta={2000} />);
      break;
    }
    case "WIDGET_CLICK":
    case "WIDGET_DELETED":
    default:
      break;
  }
}

