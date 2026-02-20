import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sugerenciasService, SugerenciaForm } from "../services/sugerencias";
import { useAppAlert } from "../context/AppAlertContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SugerirActividadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SugerirActividadModal({
  visible,
  onClose,
  onSuccess,
}: SugerirActividadModalProps) {
  const { showAlert } = useAppAlert();
  const [nombre, setNombre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!nombre.trim()) {
      setError("El nombre de la actividad es requerido");
      return;
    }
    setIsSubmitting(true);
    try {
      const sugerencia: SugerenciaForm = {
        tipo: "actividad",
        nombre: nombre.trim(),
        intensidad_estimada: "media",
      };
      await sugerenciasService.createSugerencia(sugerencia);
      onSuccess?.();
      setNombre("");
      setError(null);
      onClose();
      showAlert({ title: "Listo", message: "Sugerencia enviada exitosamente. Gracias por tu aporte.", variant: "activity" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al enviar la sugerencia";
      setError(message);
      showAlert({ title: "Error", message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNombre("");
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 32,
                maxHeight: SCREEN_HEIGHT * 0.7,
                minHeight: 280,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-display font-bold text-neutral-800">
                  Sugerir nueva actividad
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={isSubmitting}
                  className="p-1"
                >
                  <Ionicons name="close-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ flexGrow: 0 }}
              >
                {error && (
                  <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <Text className="text-red-600 text-sm">{error}</Text>
                  </View>
                )}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-neutral-700 mb-1">
                    Nombre de la actividad
                  </Text>
                  <TextInput
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Ej: Escalada"
                    className="border border-neutral-300 rounded-xl px-3 py-3 text-base bg-white"
                    editable={!isSubmitting}
                  />
                </View>
                <View className="flex-row gap-3 mt-2 mb-4">
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 border border-neutral-300 rounded-xl py-3 items-center"
                  >
                    <Text className="text-neutral-700 font-display font-semibold text-base">
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-accent-600 rounded-xl py-3 items-center"
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-display font-semibold text-base">
                        Enviar sugerencia
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
