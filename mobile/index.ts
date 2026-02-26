import { registerRootComponent } from "expo";
import { Platform } from "react-native";

import App from "./App";

// Registrar el manejador de tareas del widget solo en Android
// (el módulo react-native-android-widget solo existe en Android con build nativo)
if (Platform.OS === "android") {
  try {
    const { registerWidgetTaskHandler } = require("react-native-android-widget");
    const { widgetTaskHandler } = require("./src/widgets/widget-task-handler");
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (e) {
    // Ignorar si el módulo no está disponible (ej: Expo Go)
    console.log("[Widget] Módulo de widget no disponible:", e);
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
