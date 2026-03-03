import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { activitiesService, getEstadisticasDiarias } from "../services/activities";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../context/AppAlertContext";
import HeaderAppLogo from "../components/HeaderAppLogo";
import SugerirActividadModal from "../components/SugerirActividadModal";
import type { TipoActividad, Intensidad, Actividad } from "../types";
import { updateWidgetData } from "../widgets/updateWidgetData";

const TIPO_OPTIONS: { value: TipoActividad; label: string }[] = [
  { value: "caminata", label: "Caminata" },
  { value: "caminata_rapida", label: "Caminata rápida" },
  { value: "correr", label: "Correr" },
  { value: "ciclismo", label: "Ciclismo" },
  { value: "natacion", label: "Natación" },
  { value: "gimnasio", label: "Gimnasio" },
  { value: "crossfit_hiit", label: "CrossFit / HIIT" },
  { value: "futbol_rugby", label: "Fútbol / Rugby" },
  { value: "baloncesto_voley", label: "Baloncesto / Vóley" },
  { value: "padel_tenis", label: "Pádel / Tenis" },
  { value: "baile_aerobico", label: "Baile aeróbico" },
  { value: "pilates", label: "Pilates" },
  { value: "yoga_hatha", label: "Yoga (Hatha)" },
  { value: "yoga_bikram", label: "Yoga (Bikram)" },
];

const INTENSIDAD_OPTIONS: { value: Intensidad; label: string }[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 19);
}

function formatTimeForInput(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeToDate(today: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(today);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

const DEBOUNCE_MS = 1000;

export default function AddActivityScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const actividadEditar: Actividad | undefined = route.params?.actividad;
  const [showSugerirModal, setShowSugerirModal] = useState(false);

  const [tipo, setTipo] = useState<TipoActividad>(
    (actividadEditar?.tipo_actividad as TipoActividad) || "caminata"
  );
  const [intensidad, setIntensidad] = useState<Intensidad>(
    (actividadEditar?.intensidad as Intensidad) || "media"
  );
  const [duracionMinutos, setDuracionMinutos] = useState(
    actividadEditar ? String(actividadEditar.duracion_minutos) : "30"
  );
  const [horaInicioStr, setHoraInicioStr] = useState(() => {
    if (actividadEditar) {
      const d = new Date(actividadEditar.fecha_hora);
      return formatTimeForInput(d);
    }
    return formatTimeForInput(new Date());
  });
  const [acaboDeTerminar, setAcaboDeTerminar] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{
    estimated_pse_ml: number;
    weather_message?: string | null;
    climate_adjustment?: string | null;
  } | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Obtener ubicación al montar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== "granted") {
          setLocationError("Sin permiso de ubicación");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        if (cancelled) return;
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationError(null);
      } catch (e) {
        if (!cancelled) setLocationError("No se pudo obtener la ubicación");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Calcular fecha_hora para “hoy” según hora de inicio o “acabo de terminar”
  const getActivityDateTime = useCallback((): Date => {
    const today = new Date();
    if (acaboDeTerminar) {
      const mins = parseInt(duracionMinutos, 10) || 0;
      const end = new Date(today);
      const start = new Date(end.getTime() - mins * 60 * 1000);
      return start;
    }
    return parseTimeToDate(today, horaInicioStr);
  }, [acaboDeTerminar, duracionMinutos, horaInicioStr]);

  // Debounce: estimación 1s después de dejar de cambiar
  useEffect(() => {
    const duracion = parseInt(duracionMinutos, 10);
    if (!duracion || duracion < 1 || duracion > 1440) {
      setEstimate(null);
      return;
    }
    const t = setTimeout(async () => {
      if (!location) {
        setEstimate(null);
        return;
      }
      setEstimateLoading(true);
      try {
        const activityDt = getActivityDateTime();
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await activitiesService.estimate({
          tipo_actividad: tipo,
          duracion_minutos: duracion,
          intensidad,
          fecha_hora: activityDt.toISOString(),
          latitude: location.lat,
          longitude: location.lon,
          tz,
        });
        setEstimate(res);
      } catch {
        setEstimate(null);
      } finally {
        setEstimateLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [tipo, intensidad, duracionMinutos, horaInicioStr, acaboDeTerminar, location, getActivityDateTime]);

  const handleSubmit = async () => {
    const duracion = parseInt(duracionMinutos, 10);
    if (!duracion || duracion < 1 || duracion > 1440) {
      showAlert({ title: "Error", message: "Duración debe ser entre 1 y 1440 minutos.", variant: "danger" });
      return;
    }
    const activityDt = getActivityDateTime();
    if (activityDt > new Date()) {
      showAlert({ title: "Error", message: "La hora de inicio no puede ser futura.", variant: "danger" });
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        tipo_actividad: tipo,
        duracion_minutos: duracion,
        intensidad,
        fecha_hora: activityDt.toISOString(),
        ...(location && { latitude: location.lat, longitude: location.lon }),
      };
      if (actividadEditar) {
        await activitiesService.update(actividadEditar.id, payload);
        showAlert({ title: "Listo", message: "Actividad actualizada. Tu meta de hidratación se recalculó.", variant: "activity" });
      } else {
        await activitiesService.create(payload);
        showAlert({ title: "Listo", message: "Actividad registrada. Tu meta de hidratación se actualizó.", variant: "activity" });
      }
      setDuracionMinutos("30");
      setHoraInicioStr(formatTimeForInput(new Date()));
      setEstimate(null);
      // Recalcular stats del día (meta + PSE de actividades) y actualizar widget
      try {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const todayStr = `${y}-${m}-${d}`;
        const stats = await getEstadisticasDiarias(todayStr);
        await updateWidgetData(
          stats.total_hidratacion_efectiva_ml ?? 0,
          stats.meta_ml ?? 2000,
        );
      } catch (e) {
        console.log("[AddActivity] Error actualizando widget:", e);
      }
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Error al guardar";
      showAlert({ title: "Error", message: msg, variant: "danger" });
    } finally {
      setSubmitLoading(false);
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
        >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("MainTabs");
              }
            }}
            className="mr-3 p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-accent-100 items-center justify-center mr-3">
            <Ionicons name="walk" size={22} color="#007BFF" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Registrar actividad
            </Text>
            <Text className="text-xs text-neutral-500">
              Registra tu actividad física de hoy
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        {/* Tipo de actividad (mismo estilo que Bebidas en Registrar consumo: scroll horizontal) */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">Tipo de actividad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {TIPO_OPTIONS.map((opt) => {
            const selected = tipo === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setTipo(opt.value)}
                className={`px-3.5 py-2.5 rounded-xl mr-2 border ${
                  selected
                    ? "bg-accent-600 border-accent-500"
                    : "bg-white border-neutral-300"
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    selected ? "text-white" : "text-neutral-800"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {user?.es_premium && (
          <View className="mb-4 flex-row flex-wrap items-center">
            <Text className="text-xs text-neutral-500">¿No encuentras tu actividad? </Text>
            <TouchableOpacity onPress={() => setShowSugerirModal(true)} activeOpacity={0.7}>
              <Text className="text-accent-600 font-display font-bold text-xs">
                Sugerir nueva actividad
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Intensidad */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">Intensidad</Text>
        <View className="flex-row mb-4">
          {INTENSIDAD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setIntensidad(opt.value)}
              className={`px-3.5 py-2.5 rounded-xl border mr-2 ${
                intensidad === opt.value
                  ? "bg-accent-600 border-accent-500"
                  : "bg-white border-neutral-300"
              }`}
            >
              <Text
                className={`text-base font-medium ${
                  intensidad === opt.value ? "text-white" : "text-neutral-800"
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duración */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">Duración (minutos)</Text>
        <TextInput
          value={duracionMinutos}
          onChangeText={setDuracionMinutos}
          keyboardType="number-pad"
          placeholder="30"
          className="border border-neutral-300 rounded-lg px-3 py-3 text-base mb-4 bg-white"
        />

        {/* Acabo de terminar */}
        <View className="flex-row items-center justify-between py-3 border-t border-neutral-100 mb-2">
          <Text className="text-neutral-800 font-medium">Acabo de terminar</Text>
          <Switch value={acaboDeTerminar} onValueChange={setAcaboDeTerminar} />
        </View>

        {/* Hora inicio (24h) */}
        <Text className="text-sm font-semibold text-neutral-700 mb-2">Hora de inicio (24h)</Text>
        <TextInput
          value={horaInicioStr}
          onChangeText={setHoraInicioStr}
          placeholder="14:30"
          editable={!acaboDeTerminar}
          className={`border rounded-lg px-3 py-3 text-base mb-2 ${
            !acaboDeTerminar ? "border-neutral-300 bg-white" : "border-neutral-200 bg-neutral-100"
          }`}
        />
        {/* Estimación de hidratación (mismo estilo que Hidratación efectiva en Registrar consumo; tono azul) */}
        <View className="rounded-xl p-4 mb-6 border border-accent-100 bg-accent-50">
          <Text className="text-sm font-semibold text-neutral-700 mb-1">
            Estimación de hidratación
          </Text>
          {estimateLoading && (
            <View className="py-2">
              <ActivityIndicator size="small" color="#007BFF" />
            </View>
          )}
          {!estimateLoading && estimate && (
            <>
              <Text className="text-lg font-bold text-accent-700">
                +{estimate.estimated_pse_ml} ml
                {estimate.climate_adjustment
                  ? ` (Incluye ajuste por clima ☀️ ${estimate.climate_adjustment})`
                  : ""}
              </Text>
              {estimate.weather_message && estimate.weather_message !== "" && (
                <Text className="text-sm text-neutral-600 mt-2">
                  {estimate.weather_message}
                </Text>
              )}
              {!estimate.climate_adjustment && (!estimate.weather_message || estimate.weather_message === "") && (
                <Text className="text-xs text-neutral-500 mt-2">
                  El clima no está disponible en este momento (por ejemplo, límite diario de la API de clima alcanzado). 
                  Usamos un ajuste neutro para no afectar tu meta.
                </Text>
              )}
            </>
          )}
          {!estimateLoading && !estimate && duracionMinutos && parseInt(duracionMinutos, 10) > 0 && (
            <Text className="text-neutral-500">Calculando...</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitLoading}
          className="bg-accent-600 py-4 rounded-2xl items-center"
        >
          {submitLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-display font-bold text-[15px]">
              Guardar actividad
            </Text>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <SugerirActividadModal
        visible={showSugerirModal}
        onClose={() => setShowSugerirModal(false)}
      />
    </SafeAreaView>
  );
}
