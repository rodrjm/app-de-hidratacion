import React, { useState, useMemo } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppAlert } from "../context/AppAlertContext";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";
import HeaderAppLogo from "../components/HeaderAppLogo";

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, setUser } = useAuth();
  const { showAlert } = useAppAlert();
  const [peso, setPeso] = useState(user?.peso ? String(user.peso) : "");
  const [esFragil, setEsFragil] = useState<boolean>(!!user?.es_fragil_o_insuficiencia_cardiaca);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edadAprox = useMemo(() => {
    const fn = user?.fecha_nacimiento;
    if (!fn) return null;
    const nac = new Date(fn);
    const hoy = new Date();
    return hoy.getFullYear() - nac.getFullYear();
  }, [user?.fecha_nacimiento]);

  const mostrarFragilidad = edadAprox !== null && edadAprox >= 65;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    setError(null);
    const pesoNum = parseFloat(peso.replace(",", "."));
    if (!peso || Number.isNaN(pesoNum) || pesoNum < 20 || pesoNum > 300) {
      setError("El peso debe ser entre 20 y 300 kg");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Parameters<typeof authService.updateProfile>[0] = {
        peso: pesoNum,
      };
      if (mostrarFragilidad) {
        payload.es_fragil_o_insuficiencia_cardiaca = esFragil;
      }
      const updated = await authService.updateProfile(payload as any);
      setUser(updated);
      showAlert({ title: "Perfil actualizado", message: "Tu información básica se ha actualizado correctamente.", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al actualizar el perfil.";
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
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Ionicons name="person-outline" size={22} color="#17A24A" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Mi peso
            </Text>
            <Text className="text-xs text-neutral-500">
              Actualiza tu peso y datos para una hidratación más precisa.
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4">
          <View className="mb-3">
            <Text className="text-xs font-semibold text-neutral-700 mb-1">
              Peso (kg)
            </Text>
            <TextInput
              value={peso}
              onChangeText={setPeso}
              placeholder="70"
              keyboardType="decimal-pad"
              className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-neutral-700 mb-1">
              Fecha de nacimiento
            </Text>
            <Text className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
              {user.fecha_nacimiento || "—"}
            </Text>
            <Text className="text-[11px] text-neutral-500 mt-1">
              La fecha de nacimiento no se puede modificar una vez registrada.
            </Text>
          </View>

          {mostrarFragilidad && (
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-xs font-semibold text-neutral-700 mb-1">
                  Fragilidad o insuficiencia cardíaca
                </Text>
                <Text className="text-[11px] text-neutral-500">
                  Marca esta opción si tu médico te ha indicado cuidado especial con la hidratación (solo para mayores de 65 años).
                </Text>
              </View>
              <Switch value={esFragil} onValueChange={setEsFragil} />
            </View>
          )}

          {error ? (
            <View className="bg-error-50 border border-error-200 rounded-lg p-2.5 mt-2">
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
                Guardar cambios
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

