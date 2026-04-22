import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { bebidasService, recipientesService, consumosService } from "../services/consumos";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../context/AppAlertContext";
import { useOfflineStore, type PendingConsumoForm } from "../store/useOfflineStore";
import { isLikelyNetworkError, OFFLINE_QUEUED_USER_MESSAGE } from "../utils/networkErrors";
import HeaderAppLogo from "../components/HeaderAppLogo";
import SugerirBebidaModal from "../components/SugerirBebidaModal";
import type { Bebida, Recipiente, Consumo } from "../types";
import { getEstadisticasDiarias } from "../services/activities";
import { updateWidgetData } from "../widgets/updateWidgetData";

type CantidadMode = "recipiente" | "personalizada";

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

export default function AddConsumoScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { showAlert } = useAppAlert();
  const consumoEditar: Consumo | undefined = route.params?.consumo;
  const [bebidas, setBebidas] = useState<Bebida[]>([]);
  const [recipientes, setRecipientes] = useState<Recipiente[]>([]);
  const [bebidaId, setBebidaId] = useState<number | null>(null);
  const [cantidadMode, setCantidadMode] = useState<CantidadMode>("recipiente");
  const [recipienteId, setRecipienteId] = useState<number | null>(null);
  const [cantidadPersonalizada, setCantidadPersonalizada] = useState<number>(
    consumoEditar?.cantidad_ml ?? 250
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSugerirModal, setShowSugerirModal] = useState(false);
  // "Acabo de consumir" = ON por defecto: no se muestra hora; si OFF, se puede editar la hora (solo de hoy).
  const [acaboDeConsumir, setAcaboDeConsumir] = useState(true);
  const [horaConsumoStr, setHoraConsumoStr] = useState(() => {
    if (consumoEditar?.fecha_hora) {
      return formatTimeForInput(new Date(consumoEditar.fecha_hora));
    }
    return formatTimeForInput(new Date());
  });

  // Filtrar bebidas según el plan del usuario
  const bebidasDisponibles = useMemo(() => {
    if (user?.es_premium) {
      return bebidas; // Usuarios premium ven todas las bebidas
    }
    return bebidas.filter((b) => !b.es_premium); // Usuarios gratuitos solo ven bebidas gratuitas
  }, [bebidas, user?.es_premium]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bebidasRes, recipientesRes] = await Promise.all([
          bebidasService.getBebidas(),
          recipientesService.getRecipientes(),
        ]);
        if (cancelled) return;
        const bebidasList = bebidasRes.results || [];
        const recipList = recipientesRes.results || [];
        setBebidas(bebidasList);
        setRecipientes(recipList);
        if (consumoEditar) {
          const bebidaIdInicial =
            typeof consumoEditar.bebida === "object"
              ? consumoEditar.bebida.id
              : (consumoEditar.bebida as number);
          setBebidaId(bebidaIdInicial);
          const recId =
            typeof consumoEditar.recipiente === "object"
              ? consumoEditar.recipiente?.id ?? null
              : (consumoEditar.recipiente as number | null);
          setRecipienteId(recId ?? recipList[0]?.id ?? null);
        } else {
          const agua = bebidasList.find((b) => b.es_agua) || bebidasList[0];
          setBebidaId(agua ? agua.id : null);
          setRecipienteId(recipList[0]?.id ?? null);
        }
      } catch (e) {
        console.log("[AddConsumo] error cargando bebidas/recipientes", e);
        showAlert({ title: "Error", message: "No se pudieron cargar bebidas y recipientes.", variant: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bebidaSeleccionada = useMemo(
    () => bebidasDisponibles.find((b) => b.id === bebidaId) || null,
    [bebidasDisponibles, bebidaId]
  );

  const cantidad = useMemo(() => {
    if (cantidadMode === "recipiente" && recipienteId) {
      const r = recipientes.find((x) => x.id === recipienteId);
      return r?.cantidad_ml ?? cantidadPersonalizada;
    }
    return cantidadPersonalizada;
  }, [cantidadMode, recipienteId, recipientes, cantidadPersonalizada]);

  const hidratacionEfectiva = useMemo(() => {
    if (!bebidaSeleccionada) return cantidad;
    return Math.round(cantidad * bebidaSeleccionada.factor_hidratacion);
  }, [cantidad, bebidaSeleccionada]);

  const validar = (): string | null => {
    if (!bebidaId) return "Selecciona una bebida.";
    if (cantidadMode === "recipiente" && !recipienteId) return "Selecciona un recipiente.";
    if (cantidadMode === "personalizada" && (!cantidadPersonalizada || cantidadPersonalizada <= 0)) {
      return "La cantidad debe ser mayor a 0.";
    }
    if (!acaboDeConsumir) {
      const today = new Date();
      const fechaElegida = parseTimeToDate(today, horaConsumoStr);
      if (fechaElegida > new Date()) {
        return "La hora del consumo no puede ser futura.";
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validar();
    if (err) {
      showAlert({ title: "Error", message: err, variant: "danger" });
      return;
    }
    if (!bebidaId) return;
    setSubmitting(true);

    let createPayload: Parameters<typeof consumosService.createConsumo>[0] | null = null;

    try {
      if (consumoEditar) {
        const payload: Parameters<typeof consumosService.updateConsumo>[1] = {
          bebida: bebidaId,
          cantidad_ml: cantidad,
          recipiente: cantidadMode === "recipiente" ? (recipienteId ?? null) : null,
        };
        // Solo enviar fecha_hora si el usuario desactivó "Acabo de consumir" y eligió otra hora.
        if (!acaboDeConsumir) {
          const today = new Date();
          payload.fecha_hora = parseTimeToDate(today, horaConsumoStr).toISOString();
        } else {
          payload.fecha_hora = consumoEditar.fecha_hora;
        }
        await consumosService.updateConsumo(consumoEditar.id, payload);
        showAlert({ title: "Listo", message: "Consumo actualizado exitosamente.", variant: "success" });
      } else {
        const today = new Date();
        createPayload = {
          bebida: bebidaId!,
          cantidad_ml: cantidad,
          recipiente: cantidadMode === "recipiente" && recipienteId != null ? recipienteId : null,
          fecha_hora: acaboDeConsumir
            ? new Date().toISOString()
            : parseTimeToDate(today, horaConsumoStr).toISOString(),
        };

        if (currentUserId == null) {
          showAlert({
            title: "Error",
            message: "No se pudo identificar tu usuario. Vuelve a iniciar sesión e intenta de nuevo.",
            variant: "danger",
          });
          return;
        }
        const offlineRow: PendingConsumoForm = { ...createPayload, userId: currentUserId };

        const net = await NetInfo.fetch();
        if (net.isConnected === false) {
          useOfflineStore.getState().addPendingConsumo(offlineRow);
          showAlert({
            title: "Sin conexión",
            message: OFFLINE_QUEUED_USER_MESSAGE,
            variant: "success",
          });
          navigation.goBack();
          return;
        }

        await consumosService.createConsumo(createPayload);
        showAlert({ title: "Listo", message: "Consumo registrado exitosamente.", variant: "success" });
      }
      // Recalcular stats del día y actualizar widget
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
        console.log("[AddConsumo] Error actualizando widget:", e);
      }
      navigation.goBack();
    } catch (e: unknown) {
      if (!consumoEditar && createPayload && currentUserId != null && isLikelyNetworkError(e)) {
        useOfflineStore.getState().addPendingConsumo({ ...createPayload, userId: currentUserId });
        showAlert({
          title: "Sin conexión",
          message: OFFLINE_QUEUED_USER_MESSAGE,
          variant: "success",
        });
        navigation.goBack();
        return;
      }

      let message = consumoEditar ? "Error al actualizar consumo." : "Error al registrar consumo.";
      const anyErr = e as { response?: { status?: number; data?: any } };
      const status = anyErr.response?.status;
      const data = anyErr.response?.data;

      if (status === 400 && data && typeof data === "object") {
        if (typeof data.detail === "string") {
          message = data.detail;
        } else {
          const firstField = Object.keys(data)[0];
          const fieldErrors = firstField ? data[firstField] : null;
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            message = String(fieldErrors[0]);
          } else if (typeof fieldErrors === "string") {
            message = fieldErrors;
          }
        }
      } else if (e instanceof Error && e.message) {
        message = e.message;
      }

      showAlert({ title: "Error", message, variant: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

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
            <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mr-3">
              <Ionicons name="water" size={22} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-display font-bold text-neutral-800">
                Registrar consumo
              </Text>
                <Text className="text-xs text-neutral-500">
                Registra tu ingesta de líquidos
              </Text>
            </View>
            <HeaderAppLogo />
          </View>

          {/* Bebida */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-neutral-700 mb-2">
              Bebida
              {!user?.es_premium && bebidas.some((b) => b.es_premium) && (
                <Text className="text-xs text-neutral-500 font-normal">
                  {" "}(Solo bebidas gratuitas)
                </Text>
              )}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bebidasDisponibles.map((b) => {
                const selected = b.id === bebidaId;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setBebidaId(b.id)}
                    className={`px-3.5 py-2.5 rounded-xl mr-2 border ${
                      selected ? "bg-secondary-600 border-secondary-500" : "bg-white border-neutral-300"
                    }`}
                  >
                    <Text
                      className={`text-base font-medium ${
                        selected ? "text-white" : "text-neutral-800"
                      }`}
                    >
                      {b.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {user?.es_premium && (
              <View className="mt-2 flex-row flex-wrap items-center">
                <Text className="text-xs text-neutral-500">¿No encuentras tu bebida? </Text>
                <TouchableOpacity onPress={() => setShowSugerirModal(true)} activeOpacity={0.7}>
                  <Text className="text-secondary-600 font-display font-bold text-xs">
                    Sugerir nueva bebida
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Cantidad */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-neutral-700 mb-2">Cantidad</Text>
            <View className="flex-row mb-3">
              <TouchableOpacity
                onPress={() => setCantidadMode("recipiente")}
                className={`px-3.5 py-2.5 rounded-l-xl border ${
                  cantidadMode === "recipiente"
                    ? "bg-secondary-600 border-secondary-500"
                    : "bg-white border-neutral-300"
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    cantidadMode === "recipiente" ? "text-white" : "text-neutral-800"
                  }`}
                >
                  Por recipiente
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCantidadMode("personalizada")}
                className={`px-3.5 py-2.5 rounded-r-xl border-l-0 border ${
                  cantidadMode === "personalizada"
                    ? "bg-secondary-600 border-secondary-500"
                    : "bg-white border-neutral-300"
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    cantidadMode === "personalizada" ? "text-white" : "text-neutral-800"
                  }`}
                >
                  Personalizada
                </Text>
              </TouchableOpacity>
            </View>

            {cantidadMode === "recipiente" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recipientes.map((r) => {
                  const selected = r.id === recipienteId;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setRecipienteId(r.id)}
                      className={`px-3.5 py-2.5 rounded-xl mr-2 border ${
                        selected ? "bg-primary-600 border-primary-500" : "bg-white border-neutral-300"
                      }`}
                    >
                      <Text
                        className={`text-base font-medium ${
                          selected ? "text-white" : "text-neutral-800"
                        }`}
                      >
                        {r.nombre} ({r.cantidad_ml} ml)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <TextInput
                value={String(cantidadPersonalizada)}
                onChangeText={(txt) => {
                  const v = parseInt(txt.replace(/\D/g, ""), 10);
                  if (!Number.isNaN(v)) setCantidadPersonalizada(v);
                  else setCantidadPersonalizada(0);
                }}
                keyboardType="number-pad"
                placeholder="250"
                className="border border-neutral-300 rounded-lg px-3 py-3 text-base bg-white"
              />
            )}
          </View>

          {/* Resumen de hidratación (mismo estilo que Estimación de hidratación en Registrar actividad) */}
          <View className="rounded-xl p-4 mb-6 border border-secondary-100 bg-secondary-50">
            <Text className="text-sm font-semibold text-neutral-700 mb-1">
              Hidratación efectiva estimada
            </Text>
            <Text className="text-lg font-bold text-secondary-700">
              {hidratacionEfectiva} ml
            </Text>
          </View>

          {/* Acabo de consumir: ON = no enviar/editar hora; OFF = mostrar selector de hora (solo hoy) */}
          <View className="flex-row items-center justify-between py-3 border-t border-neutral-100 mb-2">
            <Text className="text-neutral-800 font-medium">Acabo de consumir</Text>
            <Switch value={acaboDeConsumir} onValueChange={setAcaboDeConsumir} />
          </View>
          {!acaboDeConsumir && (
            <>
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Hora del consumo (24h)</Text>
              <TextInput
                value={horaConsumoStr}
                onChangeText={setHoraConsumoStr}
                placeholder="14:30"
                className="border border-neutral-300 rounded-lg px-3 py-3 text-base mb-4 bg-white"
              />
            </>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-secondary-600 py-4 rounded-2xl items-center"
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-display font-bold text-[15px]">
                Guardar consumo
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <SugerirBebidaModal
        visible={showSugerirModal}
        onClose={() => setShowSugerirModal(false)}
      />
    </SafeAreaView>
  );
}

