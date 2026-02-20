import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { recipientesService } from "../services/consumos";
import HeaderAppLogo from "../components/HeaderAppLogo";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../context/AppAlertContext";
import type { Recipiente } from "../types";

interface RecipienteFormState {
  nombre: string;
  cantidad_ml: string;
}

export default function RecipientesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { showAlert, showConfirm } = useAppAlert();
  const [recipientes, setRecipientes] = useState<Recipiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RecipienteFormState>({
    nombre: "",
    cantidad_ml: "250",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await recipientesService.getRecipientes();
      setRecipientes(res.results || []);
    } catch (e) {
      console.log("[RecipientesScreen] Error cargando recipientes", e);
      setRecipientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ nombre: "", cantidad_ml: "250", color: "" });
    setIsEditing(false);
    setEditingId(null);
  };

  const openCreate = () => {
    // Limitar creación a usuarios premium si ya tienen 2 recipientes
    if (!user?.es_premium && recipientes.length >= 2) {
      showAlert({
        title: "Función Premium",
        message: "Los usuarios gratuitos pueden usar hasta 2 recipientes. Actualiza a Premium para crear recipientes ilimitados.",
        variant: "premium",
      });
      return;
    }
    resetForm();
    setFormVisible(true);
  };

  const openEdit = (rec: Recipiente) => {
    setForm({
      nombre: rec.nombre || "",
      cantidad_ml: String(rec.cantidad_ml || 250),
    });
    setIsEditing(true);
    setEditingId(rec.id);
    setFormVisible(true);
  };

  const handleDelete = (rec: Recipiente) => {
    // Prevenir eliminación de recipientes por defecto (250ml y 500ml)
    if (rec.cantidad_ml === 250 || rec.cantidad_ml === 500) {
      showAlert({
        title: "No se puede eliminar",
        message: "Los recipientes por defecto (250ml y 500ml) no pueden ser eliminados.",
        variant: "danger",
      });
      return;
    }

    showConfirm({
      title: "Eliminar recipiente",
      message: `¿Eliminar el recipiente "${rec.nombre}"?`,
      variant: "success",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await recipientesService.deleteRecipiente(rec.id);
              await load();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Error al eliminar";
              showAlert({ title: "Error", message: msg, variant: "danger" });
            }
          },
        },
      ],
    });
  };

  const validate = (): string | null => {
    if (!form.nombre.trim()) return "El nombre es requerido.";
    const cantidad = parseInt(form.cantidad_ml, 10);
    if (!cantidad || cantidad <= 0) return "La cantidad (ml) debe ser mayor a 0.";
    return null;
  };

  const handleSubmit = async () => {
    const validation = validate();
    if (validation) {
      showAlert({ title: "Error", message: validation, variant: "danger" });
      return;
    }
    const cantidad = parseInt(form.cantidad_ml, 10);
    setSubmitting(true);
    try {
      const payload: Partial<Recipiente> = {
        nombre: form.nombre.trim(),
        cantidad_ml: cantidad,
      };

      if (isEditing && editingId) {
        await recipientesService.updateRecipiente(editingId, payload);
      } else {
        await recipientesService.createRecipiente(payload as any);
      }
      setFormVisible(false);
      resetForm();
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar recipiente.";
      showAlert({ title: "Error", message: msg, variant: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-3 text-neutral-500">Cargando recipientes...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Ionicons name="wine-outline" size={22} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Recipientes
            </Text>
            <Text className="text-xs text-neutral-500">
              Gestiona tus recipientes para registrar consumos con precisión.
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
          {recipientes.length === 0 ? (
            <Text className="text-sm text-neutral-500">
              Aún no tienes recipientes configurados. Crea uno nuevo para empezar.
            </Text>
          ) : (
            recipientes.map((rec) => (
              <View
                key={rec.id}
                className="flex-row items-center justify-between py-3 border-b border-neutral-100 last:border-b-0"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-primary-100">
                    <Text className="text-xs font-display font-bold text-neutral-800">
                      {rec.cantidad_ml}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-neutral-800">
                      {rec.nombre}
                    </Text>
                    <Text className="text-xs text-neutral-500">
                      {rec.cantidad_ml} ml
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  {!(rec.cantidad_ml === 250 || rec.cantidad_ml === 500) && (
                    <>
                      <TouchableOpacity
                        onPress={() => openEdit(rec)}
                        className="px-2 py-1 mr-1"
                      >
                        <Ionicons name="create-outline" size={18} color="#4B5563" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(rec)}
                        className="px-2 py-1"
                      >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {!user?.es_premium && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                <Ionicons name="star" size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-display font-bold text-amber-800">
                  Más recipientes con Premium
                </Text>
                <Text className="text-xs text-amber-700 mt-1">
                  Los usuarios gratuitos pueden usar hasta 2 recipientes. Con Premium podrás crear todos los que necesites.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Premium")}
              className="bg-amber-600 rounded-xl py-3 items-center"
            >
              <Text className="text-sm font-display font-bold text-white">
                Ver Premium
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {user?.es_premium && (
          <TouchableOpacity
            onPress={openCreate}
            className="mt-2 bg-secondary-600 rounded-2xl py-3.5 items-center shadow-soft"
          >
            <Text className="text-white font-display font-bold text-base">
              Nuevo recipiente
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {formVisible && (
        <View className="absolute inset-x-0 bottom-0 bg-white border-t border-neutral-200 rounded-t-3xl p-4 shadow-2xl">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-display font-bold text-neutral-800">
              {isEditing ? "Editar recipiente" : "Nuevo recipiente"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setFormVisible(false);
                resetForm();
              }}
            >
              <Ionicons name="close-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-neutral-700 mb-1">
              Nombre
            </Text>
            <TextInput
              value={form.nombre}
              onChangeText={(text) => setForm((prev) => ({ ...prev, nombre: text }))}
              placeholder="Ej. Vaso, Botella, Taza"
              className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-neutral-700 mb-1">
              Cantidad (ml)
            </Text>
            <TextInput
              value={form.cantidad_ml}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, cantidad_ml: text.replace(/\D/g, "") }))
              }
              keyboardType="number-pad"
              placeholder="250"
              className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="mt-1 bg-secondary-600 rounded-2xl py-3 items-center"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-display font-bold text-base">
                {isEditing ? "Guardar cambios" : "Crear recipiente"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

