import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { feedbackService, type FeedbackTipo, type FeedbackForm } from "../services/feedback";
import HeaderAppLogo from "../components/HeaderAppLogo";
import { useNavigation } from "@react-navigation/native";
import { useAppAlert } from "../context/AppAlertContext";

const FEEDBACK_OPTIONS: { value: FeedbackTipo; label: string }[] = [
  { value: "idea_sugerencia", label: "Idea / sugerencia" },
  { value: "reporte_error", label: "Reporte de error" },
  { value: "pregunta_general", label: "Pregunta general" },
];

export default function FeedbackScreen() {
  const navigation = useNavigation<any>();
  const { showAlert } = useAppAlert();
  const [tipo, setTipo] = useState<FeedbackTipo>("idea_sugerencia");
  const [mensaje, setMensaje] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const trimmed = mensaje.trim();
    if (!trimmed) {
      setError("El mensaje es requerido");
      return;
    }
    if (trimmed.length < 10) {
      setError("El mensaje debe tener al menos 10 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      const payload: FeedbackForm = { tipo, mensaje: trimmed };
      await feedbackService.createFeedback(payload);
      showAlert({ title: "Gracias", message: "¡Feedback enviado exitosamente! Gracias por tu aporte.", variant: "success" });
      setMensaje("");
      setTipo("idea_sugerencia");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al enviar el feedback";
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mr-3">
            <Ionicons name="chatbox-ellipses-outline" size={22} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Enviar comentarios
            </Text>
            <Text className="text-xs text-neutral-500">
              Ayúdanos a mejorar Dosis Vital con tus ideas y reportes.
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4">
          <Text className="text-xs font-semibold text-neutral-700 mb-2">
            Tipo de feedback
          </Text>
          <View className="flex-row bg-neutral-100 rounded-xl overflow-hidden mb-4">
            {FEEDBACK_OPTIONS.map((opt) => {
              const active = tipo === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setTipo(opt.value)}
                  className={`flex-1 px-2 py-2 items-center ${
                    active ? "bg-secondary-600" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-display font-semibold ${
                      active ? "text-white" : "text-neutral-700"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-xs font-semibold text-neutral-700 mb-2">
            Tu mensaje
          </Text>
          <TextInput
            value={mensaje}
            onChangeText={setMensaje}
            placeholder="Escribe tu feedback aquí..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white min-h-[140px]"
          />
          <Text className="text-[11px] text-neutral-500 mt-1">
            Mínimo 10 caracteres.
          </Text>

          {error ? (
            <View className="bg-error-50 border border-error-200 rounded-lg p-2.5 mt-3">
              <Text className="text-error text-xs">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="mt-4 bg-secondary-600 rounded-2xl py-3 items-center"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-display font-bold text-base">
                Enviar feedback
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

