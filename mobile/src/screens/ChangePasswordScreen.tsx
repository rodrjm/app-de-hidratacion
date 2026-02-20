import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { authService } from "../services/auth";
import { useAppAlert } from "../context/AppAlertContext";
import HeaderAppLogo from "../components/HeaderAppLogo";

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { showAlert } = useAppAlert();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!currentPassword) {
      setError("La contraseña actual es requerida");
      return;
    }
    if (!newPassword) {
      setError("La nueva contraseña es requerida");
      return;
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      await authService.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      showAlert({ title: "Contraseña actualizada", message: "Tu contraseña se cambió correctamente.", variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cambiar la contraseña.";
      setError(msg);
      showAlert({ title: "Error", message: msg, variant: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mr-3">
            <Ionicons name="lock-closed-outline" size={22} color="#4B5563" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Cambiar contraseña
            </Text>
            <Text className="text-xs text-neutral-500">
              Usa una contraseña segura para proteger tu cuenta.
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4">
          <View className="mb-3">
            <Text className="text-xs font-semibold text-neutral-700 mb-1">
              Contraseña actual
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Tu contraseña actual"
              secureTextEntry
              className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-neutral-700 mb-1">
              Nueva contraseña
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </View>

          <View className="mb-1">
            <Text className="text-xs font-semibold text-neutral-700 mb-1">
              Confirmar nueva contraseña
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la nueva contraseña"
              secureTextEntry
              className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </View>

          <Text className="text-[11px] text-neutral-500 mt-1">
            Evita usar contraseñas fáciles de adivinar. Combina letras, números y símbolos.
          </Text>

          {error ? (
            <View className="bg-error-50 border border-error-200 rounded-lg p-2.5 mt-3">
              <Text className="text-error text-xs">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSave}
            disabled={submitting}
            className="mt-4 bg-secondary-600 rounded-2xl py-3 items-center"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-display font-bold text-base">
                Guardar nueva contraseña
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

