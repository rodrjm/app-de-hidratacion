import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardTips() {
  const tips = [
    {
      icon: "water-outline" as const,
      iconColor: "#0EA5E9",
      title: "Bebe agua al despertar",
      description: "Un vaso de agua en ayunas activa tu metabolismo",
    },
    {
      icon: "water-outline" as const,
      iconColor: "#17A24A",
      title: "Hidrátate antes de sentir sed",
      description: "La sed es una señal tardía de deshidratación",
    },
    {
      icon: "nutrition-outline" as const,
      iconColor: "#10b981",
      title: "Frutas y verduras cuentan",
      description: "El 20% de tu hidratación viene de los alimentos",
    },
  ];

  return (
    <View className="bg-white rounded-2xl p-4 shadow-card border border-neutral-200 mb-4">
      <Text className="text-base font-display font-bold text-neutral-800 mb-3">
        💡 Consejos de hidratación
      </Text>
      <View>
        {tips.map((tip, index) => (
          <View key={index} className={`flex-row items-start py-2 ${index < tips.length - 1 ? "mb-1" : ""}`}>
            <View className="mt-0.5 mr-3">
              <Ionicons name={tip.icon} size={20} color={tip.iconColor} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-display font-medium text-neutral-700 mb-0.5">
                {tip.title}
              </Text>
              <Text className="text-xs text-neutral-600">{tip.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
