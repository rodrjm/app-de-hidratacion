import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../context/AppAlertContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Toast from "react-native-toast-message";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./LoginScreen";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import BrandLogo from "../components/BrandLogo";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register, loginWithGoogle, isLoading } = useAuth();
  const { showAlert } = useAppAlert();
  const route = useRoute();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [peso, setPeso] = useState("");
  const [pesoUnidad, setPesoUnidad] = useState<"kg" | "lb">("kg");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [esFragil, setEsFragil] = useState(false);
  const [codigoReferido, setCodigoReferido] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  // Obtener código de referido de los parámetros de ruta (si viene de un link)
  useEffect(() => {
    const params = route.params as { codigoReferido?: string } | undefined;
    if (params?.codigoReferido) {
      setCodigoReferido(params.codigoReferido);
    }
  }, [route.params]);

  // Calcular edad para mostrar campo de fragilidad si es necesario
  const calcularEdad = (fecha: string): number | null => {
    if (!fecha) return null;
    const fechaNac = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  };

  const edadCalculada = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const mostrarCampoFragilidad = edadCalculada !== null && edadCalculada > 65;

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("El correo electrónico es requerido");
      return;
    }
    if (emailAvailable === false) {
      setError("Este email ya está registrado");
      return;
    }
    if (!firstName.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!lastName.trim()) {
      setError("El apellido es requerido");
      return;
    }
    if (!password) {
      setError("La contraseña es requerida");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    const pesoNum = parseFloat(peso.replace(",", "."));
    const pesoMin = pesoUnidad === "kg" ? 20 : 44; // 44 lb ≈ 20 kg
    const pesoMax = pesoUnidad === "kg" ? 300 : 661; // 661 lb ≈ 300 kg
    if (!peso || isNaN(pesoNum) || pesoNum < pesoMin || pesoNum > pesoMax) {
      setError(`El peso debe ser entre ${pesoMin} y ${pesoMax} ${pesoUnidad === "kg" ? "kg" : "lb"}`);
      return;
    }
    if (!fechaNacimiento) {
      setError("La fecha de nacimiento es requerida");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones y la política de privacidad");
      return;
    }
    try {
      await register({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        confirmPassword,
        peso: pesoNum,
        peso_unidad: pesoUnidad,
        fecha_nacimiento: fechaNacimiento,
        es_fragil_o_insuficiencia_cardiaca: mostrarCampoFragilidad ? esFragil : undefined,
        codigo_referido: codigoReferido.trim() || undefined,
        acceptTerms: true,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al crear la cuenta";
      setError(message);
      showAlert({ title: "Error", message, variant: "danger" });
    }
  };

  // Simulación de verificación de email en tiempo real (paridad con web)
  useEffect(() => {
    if (!email || !email.includes("@")) {
      setEmailAvailable(null);
      setIsCheckingEmail(false);
      return;
    }

    setIsCheckingEmail(true);
    const timeout = setTimeout(() => {
      // Misma lógica que en web: marcar algunos emails como ocupados
      // Aquí simulamos que cualquier email que contenga "test@" ya está registrado
      setEmailAvailable(!email.includes("test@"));
      setIsCheckingEmail(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [email]);

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
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center">
            <View className="w-full max-w-md items-center">
              <View className="items-center justify-center mb-6 self-center">
                <BrandLogo size={50} className="mb-4" withText />
                <Text className="text-2xl font-display font-bold text-neutral-700 mt-4 text-center">
                  Crear cuenta
                </Text>
                <Text className="mt-2 text-sm text-neutral-600">
                  Únete a Dosis Vital y mejora tu hidratación
                </Text>
              </View>

              <View className="w-full bg-white rounded-2xl p-5 border border-neutral-200 shadow-card">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">
                  Correo electrónico
                </Text>
                <View className="flex-row items-center mb-1">
                  <View className="flex-1">
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="tu@email.com"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      className="border border-neutral-300 rounded-lg px-3 py-3 text-base bg-white"
                    />
                  </View>
                  <View className="w-8 items-center justify-center ml-2">
                    {isCheckingEmail ? (
                      <ActivityIndicator size="small" color="#10b981" />
                    ) : emailAvailable === true ? (
                      <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    ) : emailAvailable === false ? (
                      <Ionicons name="close-circle" size={18} color="#ef4444" />
                    ) : null}
                  </View>
                </View>
                {emailAvailable === false && (
                  <Text className="text-xs text-red-500 mb-2">
                    Este email ya está registrado
                  </Text>
                )}

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-neutral-700 mb-1">
                      Nombre
                    </Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Juan"
                      className="border border-neutral-300 rounded-lg px-3 py-3 text-base"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-neutral-700 mb-1">
                      Apellido
                    </Text>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Pérez"
                      className="border border-neutral-300 rounded-lg px-3 py-3 text-base bg-white"
                    />
                  </View>
                </View>

                <Text className="text-sm font-semibold text-neutral-700 mb-1 mt-3">
                  Contraseña
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  className="border border-neutral-300 rounded-lg px-3 py-3 text-base mb-3 bg-white"
                />

                <Text className="text-sm font-semibold text-neutral-700 mb-1">
                  Confirmar contraseña
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite tu contraseña"
                  secureTextEntry
                  className="border border-neutral-300 rounded-lg px-3 py-3 text-base mb-3 bg-white"
                />

                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-semibold text-neutral-700">
                      Peso
                    </Text>
                    <View className="flex-row bg-neutral-100 rounded-lg overflow-hidden">
                      <TouchableOpacity
                        onPress={() => setPesoUnidad("kg")}
                        className={`px-3 py-1 ${pesoUnidad === "kg" ? "bg-secondary-600" : "bg-transparent"}`}
                      >
                        <Text
                          className={`text-xs font-display font-semibold ${
                            pesoUnidad === "kg" ? "text-white" : "text-neutral-700"
                          }`}
                        >
                          kg
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setPesoUnidad("lb")}
                        className={`px-3 py-1 ${pesoUnidad === "lb" ? "bg-secondary-600" : "bg-transparent"}`}
                      >
                        <Text
                          className={`text-xs font-display font-semibold ${
                            pesoUnidad === "lb" ? "text-white" : "text-neutral-700"
                          }`}
                        >
                          lb
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TextInput
                    value={peso}
                    onChangeText={setPeso}
                    placeholder={pesoUnidad === "kg" ? "70" : "154"}
                    keyboardType="decimal-pad"
                    className="border border-neutral-300 rounded-lg px-3 py-3 text-base bg-white"
                  />
                </View>

                <Text className="text-sm font-semibold text-neutral-700 mb-1">
                  Fecha de nacimiento
                </Text>
                <TextInput
                  value={fechaNacimiento}
                  onChangeText={setFechaNacimiento}
                  placeholder="YYYY-MM-DD"
                  className="border border-neutral-300 rounded-lg px-3 py-3 text-base mb-3 bg-white"
                />
                {mostrarCampoFragilidad && (
                  <View className="mb-3 flex-row items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <View className="flex-1 pr-2">
                      <Text className="text-xs font-semibold text-amber-800 mb-1">
                        Fragilidad o insuficiencia cardíaca
                      </Text>
                      <Text className="text-[11px] text-amber-700">
                        Si tu médico te ha indicado cuidado especial con la hidratación, marca esta opción.
                      </Text>
                    </View>
                    <Switch value={esFragil} onValueChange={setEsFragil} />
                  </View>
                )}
                <View className="mb-3">
                  <Text className="text-sm font-semibold text-neutral-700 mb-1">
                    Código de referido (opcional)
                  </Text>
                  <TextInput
                    value={codigoReferido}
                    onChangeText={setCodigoReferido}
                    placeholder="Ingresa el código si un amigo te invitó"
                    autoCapitalize="characters"
                    className="border border-neutral-300 rounded-lg px-3 py-3 text-base bg-white"
                  />
                  <Text className="text-[11px] text-neutral-500 mt-1">
                    Si un amigo te invitó, ingresa su código aquí para obtener beneficios.
                  </Text>
                </View>

                <View className="flex-row items-start mt-1 mb-3">
                  <TouchableOpacity
                    onPress={() => setAcceptTerms((prev) => !prev)}
                    className="mt-1 mr-2 w-5 h-5 rounded border border-neutral-400 items-center justify-center bg-white"
                  >
                    {acceptTerms ? (
                      <View className="w-3 h-3 rounded bg-secondary-600" />
                    ) : null}
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text className="text-xs text-neutral-600">
                      Al registrarte aceptas los{" "}
                      <Text
                        className="text-accent-600 font-semibold"
                        onPress={() => navigation.navigate("TermsAndConditions")}
                      >
                        Términos y condiciones
                      </Text>{" "}
                      y la{" "}
                      <Text
                        className="text-accent-600 font-semibold"
                        onPress={() => navigation.navigate("PrivacyPolicy")}
                      >
                        Política de privacidad
                      </Text>
                      .
                    </Text>
                  </View>
                </View>

                {error ? (
                  <View className="bg-error-50 border border-error-200 rounded-lg p-2.5 mb-4">
                    <Text className="text-error text-sm">{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full bg-secondary-600 py-3.5 rounded-xl items-center mt-1"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-display font-bold text-base">
                      Crear cuenta
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

              <View className="mt-6 flex-row justify-center items-center">
                <Text className="text-neutral-600 mr-2">¿Ya tienes cuenta?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text className="text-accent-600 font-display font-bold">
                    Iniciar sesión
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
