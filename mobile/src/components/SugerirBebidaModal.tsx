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

interface SugerirBebidaModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SugerirBebidaModal({
  visible,
  onClose,
  onSuccess,
}: SugerirBebidaModalProps) {
  const { showAlert } = useAppAlert();
  const [nombre, setNombre] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre de la bebida es requerido");
      return;
    }

    setIsSubmitting(true);
    try {
      const sugerencia: SugerenciaForm = {
        tipo: "bebida",
        nombre: nombre.trim(),
        comentarios: comentarios.trim() || undefined,
      };

      await sugerenciasService.createSugerencia(sugerencia);
      onSuccess?.();
      setNombre("");
      setComentarios("");
      setError(null);
      onClose();
      showAlert({ title: "Listo", message: "Sugerencia enviada exitosamente. Gracias por tu aporte.", variant: "success" });
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
      setComentarios("");
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
                maxHeight: SCREEN_HEIGHT * 0.88,
                minHeight: 360,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-display font-bold text-neutral-800">
                  Sugerir nueva bebida
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
                    <View className="bg-error-50 border border-error-200 rounded-lg p-3 mb-4">
                      <Text className="text-error text-sm">{error}</Text>
                    </View>
                  )}

                  {/* Nombre de la bebida */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-1">
                      Nombre de la bebida
                    </Text>
                    <TextInput
                      value={nombre}
                      onChangeText={setNombre}
                      placeholder="Ej: Agua de coco"
                      className="border border-neutral-300 rounded-xl px-3 py-3 text-base bg-white"
                      editable={!isSubmitting}
                    />
                  </View>

                  {/* Comentarios/Ingredientes */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-1">
                      Comentarios/Ingredientes (Opcional)
                    </Text>
                    <TextInput
                      value={comentarios}
                      onChangeText={setComentarios}
                      placeholder="Ingredientes o información adicional sobre la bebida..."
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      className="border border-neutral-300 rounded-xl px-3 py-3 text-base bg-white min-h-[100px]"
                      editable={!isSubmitting}
                    />
                  </View>

                  {/* Botones */}
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
                      className="flex-1 bg-secondary-600 rounded-xl py-3 items-center"
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
