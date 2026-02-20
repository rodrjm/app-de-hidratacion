import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

interface DashboardPremiumCardProps {
  isPremium: boolean;
}

export default function DashboardPremiumCard({ isPremium }: DashboardPremiumCardProps) {
  const navigation = useNavigation<any>();

  if (isPremium) {
    return null;
  }

  const handleUpgrade = () => {
    navigation.navigate("Premium");
  };

  return (
    <View className="bg-amber-50 rounded-2xl p-4 shadow-card border border-amber-200 mb-4">
      <View className="items-center">
        <View className="w-12 h-12 rounded-full bg-amber-200 items-center justify-center mb-3">
          <Ionicons name="star" size={24} color="#D97706" />
        </View>
        <Text className="text-lg font-display font-bold text-neutral-800 mb-2">
          Desbloquea Premium
        </Text>
        <Text className="text-sm font-display font-medium text-neutral-700 mb-3 text-center">
          Funcionalidades Premium
        </Text>
        <View className="w-full mb-4">
          <View className="flex-row items-center mb-1.5">
            <Ionicons name="checkmark-circle" size={16} color="#17A24A" />
            <Text className="text-sm text-neutral-700 ml-2">Cálculo científico (factor de hidratación)</Text>
          </View>
          <View className="flex-row items-center mb-1.5">
            <Ionicons name="checkmark-circle" size={16} color="#17A24A" />
            <Text className="text-sm text-neutral-700 ml-2">Recordatorios ajustables</Text>
          </View>
          <View className="flex-row items-center mb-1.5">
            <Ionicons name="checkmark-circle" size={16} color="#17A24A" />
            <Text className="text-sm text-neutral-700 ml-2">Estadísticas avanzadas</Text>
          </View>
          <View className="flex-row items-center mb-1.5">
            <Ionicons name="checkmark-circle" size={16} color="#17A24A" />
            <Text className="text-sm text-neutral-700 ml-2">Recipientes a tu gusto</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color="#17A24A" />
            <Text className="text-sm text-neutral-700 ml-2">Experiencia sin anuncios</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleUpgrade}
          className="bg-amber-600 rounded-xl py-2.5 px-6 w-full items-center"
        >
          <Text className="text-white font-display font-bold text-sm">
            Actualizar a Premium
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
