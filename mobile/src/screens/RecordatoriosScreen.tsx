import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useAppAlert } from "../context/AppAlertContext";
import { authService } from "../services/auth";
import HeaderAppLogo from "../components/HeaderAppLogo";
import { notificationService } from "../services/notifications";

/** Opciones de intervalo: gratuitos (4h, 6h) y premium (30min–6h) */
const INTERVALOS_GRATUITOS = [
  { value: 240, label: "4 horas" },
  { value: 360, label: "6 horas" },
];
const INTERVALOS_PREMIUM = [
  { value: 30, label: "30 minutos" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
  { value: 360, label: "6 horas" },
];

function formatTimeForInput(time: string): string {
  if (!time || typeof time !== "string") return "08:00";
  // Backend puede devolver "08:00:00" o "08:00"
  const parts = time.trim().split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  if (isNaN(h)) return "08:00";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function RecordatoriosScreen() {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const { showAlert } = useAppAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordarNotificaciones, setRecordarNotificaciones] = useState(true);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("22:00");
  const [intervaloMinutos, setIntervaloMinutos] = useState(240);
  const [error, setError] = useState<string | null>(null);

  const intervalos = user?.es_premium ? INTERVALOS_PREMIUM : INTERVALOS_GRATUITOS;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const u = await authService.getCurrentUser();
        setRecordarNotificaciones(u?.recordar_notificaciones ?? true);
        setHoraInicio(formatTimeForInput(u?.hora_inicio ?? "08:00"));
        setHoraFin(formatTimeForInput(u?.hora_fin ?? "22:00"));
        const interval = u?.intervalo_notificaciones ?? 240;
        // Si el usuario no es premium y tiene un intervalo no permitido, usar 240
        const allowedFree = INTERVALOS_GRATUITOS.map((x) => x.value);
        if (!u?.es_premium && !allowedFree.includes(interval)) {
          setIntervaloMinutos(240);
        } else {
          setIntervaloMinutos(interval);
        }
      } catch (e) {
        console.log("[RecordatoriosScreen] Error cargando preferencias", e);
        setError("No se pudieron cargar las preferencias.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleGuardar = async () => {
    setError(null);
    const inicio = horaInicio.trim() || "08:00";
    const fin = horaFin.trim() || "22:00";
    const [hI, mI] = inicio.split(":").map(Number);
    const [hF, mF] = fin.split(":").map(Number);
    const minInicio = (hI || 8) * 60 + (mI || 0);
    const minFin = (hF || 22) * 60 + (mF || 0);
    if (minFin <= minInicio) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }
    setSaving(true);
    try {
      await authService.updateProfile({
        recordar_notificaciones: recordarNotificaciones,
        hora_inicio: inicio,
        hora_fin: fin,
        intervalo_notificaciones: intervaloMinutos,
      });
      await refreshUser();
      await notificationService.syncFromUserProfile({
        recordar_notificaciones: recordarNotificaciones,
        hora_inicio: inicio,
        hora_fin: fin,
        intervalo_notificaciones: intervaloMinutos,
      });
      showAlert({ title: "Listo", message: "Preferencias de recordatorios guardadas.", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar preferencias.";
      setError(msg);
      showAlert({ title: "Error", message: msg, variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-3 text-neutral-500">Cargando recordatorios...</Text>
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
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Ionicons name="notifications-outline" size={22} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">Recordatorios</Text>
            <Text className="text-xs text-neutral-500">
              Activa recordatorios y configura horario e intervalo
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="font-display font-medium text-neutral-800">
                Recordatorios de hidratación
              </Text>
              <Text className="text-sm text-neutral-600">
                Recibe notificaciones para beber agua
              </Text>
            </View>
            <Switch
              value={recordarNotificaciones}
              onValueChange={setRecordarNotificaciones}
              trackColor={{ false: "#d1d5db", true: "#10b981" }}
              thumbColor="#fff"
            />
          </View>

          {recordarNotificaciones && (
            <>
              <View className="mb-4">
                <Text className="text-sm font-display font-medium text-neutral-700 mb-2">
                  Hora de inicio
                </Text>
                <TextInput
                  value={horaInicio}
                  onChangeText={setHoraInicio}
                  placeholder="08:00"
                  className="border border-neutral-300 rounded-xl px-3 py-2.5 text-base bg-white"
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-display font-medium text-neutral-700 mb-2">
                  Hora de fin
                </Text>
                <TextInput
                  value={horaFin}
                  onChangeText={setHoraFin}
                  placeholder="22:00"
                  className="border border-neutral-300 rounded-xl px-3 py-2.5 text-base bg-white"
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-display font-medium text-neutral-700 mb-2">
                  Frecuencia (intervalo entre recordatorios)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {intervalos.map((opt) => {
                    const active = intervaloMinutos === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setIntervaloMinutos(opt.value)}
                        className={`px-4 py-2.5 rounded-xl border ${
                          active ? "bg-secondary-600 border-secondary-500" : "bg-white border-neutral-300"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${active ? "text-white" : "text-neutral-800"}`}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {!user?.es_premium && (
                  <Text className="text-xs text-neutral-500 mt-2">
                    Con Premium podés elegir intervalos más cortos (30 min, 1 h, 2 h, 3 h).
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleGuardar}
          disabled={saving}
          className="bg-secondary-600 rounded-2xl py-3.5 items-center shadow-soft"
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-display font-bold text-base">Guardar cambios</Text>
          )}
        </TouchableOpacity>

        {!user?.es_premium && (
          <View className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                <Ionicons name="star" size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-display font-semibold text-amber-800">
                  Más opciones con Premium
                </Text>
                <Text className="text-xs text-amber-700 mt-0.5">
                  Intervalos de 30 min, 1 h, 2 h y 3 h para recordatorios más precisos
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
      </ScrollView>
    </SafeAreaView>
  );
}
