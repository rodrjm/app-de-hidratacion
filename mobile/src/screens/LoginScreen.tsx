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
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../context/AppAlertContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import BrandLogo from "../components/BrandLogo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const { showAlert } = useAppAlert();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("El correo electrónico es requerido");
      return;
    }
    if (!password) {
      setError("La contraseña es requerida");
      return;
    }
    try {
      await login(email.trim(), password, { rememberMe });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al iniciar sesión";
      setError(message);
      showAlert({ title: "Error", message, variant: "danger" });
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle();
      if (result.is_new_user) {
        // El usuario será redirigido automáticamente al Onboarding por AppNavigatorWithOnboarding
        Toast.show({
          type: "success",
          text1: "¡Bienvenido! 🎉",
          text2: "Completa tu perfil para comenzar",
          position: "top",
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: "success",
          text1: "¡Bienvenido de vuelta! 🎉",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al autenticar con Google";
      setError(message);
      showAlert({ title: "Error", message, variant: "danger" });
    } finally {
      setIsGoogleLoading(false);
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
            <View className="w-full max-w-md items-center">
              <View className="items-center justify-center mb-6 self-center">
                <BrandLogo size={50} className="mb-4" withText />
                <Text className="mt-2 text-sm text-neutral-600 text-center">
                  Tu asistente de hidratación personal
                </Text>
              </View>

              <View className="w-full bg-white rounded-2xl p-5 shadow-card border border-neutral-200">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">
                  Correo electrónico
                </Text>
                <View className="flex-row items-center border border-neutral-300 rounded-lg mb-4">
                  <View className="pl-3 pr-2">
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="flex-1 px-2 py-3 text-base bg-white"
                  />
                </View>

                <Text className="text-sm font-semibold text-neutral-700 mb-1">
                  Contraseña
                </Text>
                <View className="flex-row items-center border border-neutral-300 rounded-lg mb-2">
                  <View className="pl-3 pr-2">
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Tu contraseña"
                    secureTextEntry={!showPassword}
                    className="flex-1 px-2 py-3 text-base bg-white"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="pr-3 pl-2"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <TouchableOpacity
                    onPress={() => setRememberMe((prev) => !prev)}
                    className="flex-row items-center"
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                        rememberMe ? "bg-secondary-600 border-secondary-600" : "border-neutral-400"
                      }`}
                    >
                      {rememberMe && (
                        <View className="w-2 h-2 rounded bg-white" />
                      )}
                    </View>
                    <Text className="text-sm text-neutral-600">Recordarme</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      showAlert({
                        title: "¿Olvidaste tu contraseña?",
                        message: "Por favor, contacta al soporte a través de la funcionalidad de Feedback en la aplicación para recuperar tu contraseña.",
                        variant: "success",
                      });
                    }}
                  >
                    <Text className="text-sm text-accent-600 font-display font-medium">
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </TouchableOpacity>
                </View>

                {error ? (
                  <View className="bg-error-50 border border-error-200 rounded-lg p-2.5 mb-4">
                    <Text className="text-error text-sm">{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading || isGoogleLoading}
                  className="bg-secondary-600 py-3.5 rounded-xl items-center mt-2"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-display font-bold text-base">
                      Iniciar sesión
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Separador */}
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-neutral-300" />
                  <Text className="px-3 text-xs text-neutral-500">O continúa con</Text>
                  <View className="flex-1 h-px bg-neutral-300" />
                </View>

                {/* Botón Google */}
                <GoogleAuthButton
                  onPress={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading}
                  loading={isGoogleLoading}
                />
              </View>

              {/* Separador antes del botón de registro */}
              <View className="mt-6">
                <View className="relative">
                  <View className="absolute inset-0 flex items-center">
                    <View className="flex-1 h-px bg-neutral-300" />
                  </View>
                  <View className="relative flex justify-center">
                    <Text className="px-2 bg-primary-50 text-xs text-neutral-500">
                      ¿No tienes cuenta?
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botón de registro */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                className="w-full mt-6 bg-secondary-600 rounded-xl py-3.5 items-center shadow-medium"
              >
                <Text className="text-white font-display font-bold text-sm">
                  Crear cuenta nueva
                </Text>
              </TouchableOpacity>

              {/* Features Section */}
              <View className="mt-8 items-center w-full">
                <Text className="text-sm text-neutral-600 mb-4 text-center">
                  Únete a miles de usuarios que ya están mejorando su hidratación
                </Text>
                <View className="flex-row justify-between items-start w-full max-w-md">
                  <View className="items-center flex-1 px-1">
                    <Text className="text-base mb-0.5">💧</Text>
                    <Text
                      className="text-[11px] text-neutral-500 text-center leading-tight"
                      numberOfLines={2}
                    >
                      Seguimiento inteligente
                    </Text>
                  </View>
                  <View className="items-center flex-1 px-1">
                    <Text className="text-base mb-0.5">📊</Text>
                    <Text
                      className="text-[11px] text-neutral-500 text-center leading-tight"
                      numberOfLines={2}
                    >
                      Estadísticas detalladas
                    </Text>
                  </View>
                  <View className="items-center flex-1 px-1">
                    <Text className="text-base mb-0.5">🔔</Text>
                    <Text
                      className="text-[11px] text-neutral-500 text-center leading-tight"
                      numberOfLines={2}
                    >
                      Recordatorios personalizados
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
