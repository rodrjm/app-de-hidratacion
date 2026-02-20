import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../context/AppAlertContext";
import { authService } from "../services/auth";
import Toast from "react-native-toast-message";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AppStackParamList = {
  MainTabs: undefined;
  Onboarding: undefined;
  AddActivity: { actividad?: any } | undefined;
  AddConsumo: { consumo?: any } | undefined;
  Bebidas: undefined;
  Recipientes: undefined;
  Recordatorios: undefined;
  Premium: undefined;
  Feedback: undefined;
  Referidos: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
};

type Props = NativeStackScreenProps<AppStackParamList, "Onboarding">;

export default function OnboardingScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();
  const { showAlert } = useAppAlert();
  const [peso, setPeso] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Validaciones
    const pesoNum = parseFloat(peso.replace(",", "."));
    if (!peso || isNaN(pesoNum) || pesoNum < 10 || pesoNum > 500) {
      setError("El peso debe ser entre 10 y 500 kg");
      return;
    }

    if (!fechaNacimiento) {
      setError("La fecha de nacimiento es requerida");
      return;
    }

    // Validar fecha de nacimiento
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    if (fechaNac >= hoy) {
      setError("La fecha de nacimiento debe ser anterior a hoy");
      return;
    }

    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    const edadReal = mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate()) ? edad - 1 : edad;

    if (edadReal > 120) {
      setError("La fecha de nacimiento no puede ser anterior a 120 años");
      return;
    }

    setSubmitting(true);
    try {
      // Actualizar el perfil del usuario con el peso y fecha de nacimiento
      await authService.updateProfile({
        peso: pesoNum,
        fecha_nacimiento: fechaNacimiento,
      } as any);

      // Recargar datos del usuario para obtener la meta calculada
      await refreshUser();

      Toast.show({
        type: "success",
        text1: "¡Configuración completada! 🎉",
        position: "top",
        visibilityTime: 3000,
      });

      // Navegar al Dashboard usando reset para limpiar el stack y evitar volver atrás
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar los datos";
      setError(msg);
      showAlert({ title: "Error", message: msg, variant: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center justify-center">
            <View className="w-full max-w-md">
              {/* Logo and Title */}
              <View className="items-center mb-8">
                <View className="w-16 h-16 bg-secondary-600 rounded-full items-center justify-center mb-4 shadow-medium">
                  <Ionicons name="water" size={32} color="#FFFFFF" />
                </View>
                <Text className="text-3xl font-display font-bold text-neutral-800 text-center">
                  ¡Casi listo, che!
                </Text>
                <Text className="mt-2 text-sm text-neutral-600 text-center">
                  Para calcular tu meta de hidratación personalizada, necesitamos conocer tu peso
                  y fecha de nacimiento.
                </Text>
              </View>

              {/* Onboarding Form */}
              <View className="bg-white rounded-2xl p-5 shadow-card border border-neutral-200">
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-neutral-700 mb-1">
                    Tu Peso (kg)
                  </Text>
                  <TextInput
                    value={peso}
                    onChangeText={setPeso}
                    placeholder="Ej: 75"
                    keyboardType="decimal-pad"
                    className="border border-neutral-300 rounded-lg px-3 py-3 text-base bg-white"
                  />
                  <Text className="mt-1 text-xs text-neutral-500">
                    Se usará para calcular tu meta de hidratación diaria personalizada
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold text-neutral-700 mb-1">
                    Fecha de nacimiento
                  </Text>
                  <TextInput
                    value={fechaNacimiento}
                    onChangeText={setFechaNacimiento}
                    placeholder="YYYY-MM-DD"
                    className="border border-neutral-300 rounded-lg px-3 py-3 text-base bg-white"
                  />
                  <Text className="mt-1 text-xs text-neutral-500">
                    Necesaria para calcular tu meta de hidratación según tu edad
                  </Text>
                </View>

                {error ? (
                  <View className="bg-error-50 border border-error-200 rounded-lg p-2.5 mb-4">
                    <Text className="text-error text-sm">{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  className="bg-secondary-600 py-3.5 rounded-xl items-center mt-2"
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-display font-bold text-base">
                      ¡Comenzar a hidratarme!
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View className="mt-6">
                <Text className="text-xs text-neutral-500 text-center">
                  Podrás modificar estos datos más tarde en tu perfil
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
