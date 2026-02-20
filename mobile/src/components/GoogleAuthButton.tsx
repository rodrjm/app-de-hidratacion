import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";

interface GoogleAuthButtonProps {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function GoogleAuthButton({
  onPress,
  text = "Continuar con Google",
  disabled = false,
  loading = false,
}: GoogleAuthButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center w-full py-3 px-4 border border-neutral-300 rounded-xl bg-white shadow-sm ${
        disabled || loading ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          {/* Google Logo - usando texto simple con colores */}
          <View className="w-5 h-5 mr-3 items-center justify-center bg-white rounded">
            <Text className="text-base font-bold" style={{ color: "#4285F4" }}>
              G
            </Text>
          </View>
          <Text className="text-sm font-display font-medium text-neutral-700">
            {text}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
