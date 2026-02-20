import React from "react";
import { View } from "react-native";
import BrandLogo from "./BrandLogo";

/**
 * Logo de la app (sin texto) para mostrar en la esquina superior derecha del header.
 * Tamaño fijo pequeño para que sea persistente en todas las páginas.
 */
export default function HeaderAppLogo() {
  return (
    <View className="ml-2">
      <BrandLogo size={22} />
    </View>
  );
}
