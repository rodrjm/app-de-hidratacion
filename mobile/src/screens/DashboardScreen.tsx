import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../context/AppAlertContext";
import { activitiesService, getEstadisticasDiarias } from "../services/activities";
import { consumosService } from "../services/consumos";
import DashboardTips from "../components/DashboardTips";
import DashboardPremiumCard from "../components/DashboardPremiumCard";
import MobileAdBanner from "../components/MobileAdBanner";
import HeaderAppLogo from "../components/HeaderAppLogo";
import { updateWidgetData } from "../widgets/updateWidgetData";
import type { EstadisticasDiarias, Actividad, Consumo } from "../types";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TIPO_LABELS: Record<string, string> = {
  correr: "Correr", ciclismo: "Ciclismo", natacion: "Natación",
  futbol_rugby: "Fútbol / Rugby", baloncesto_voley: "Baloncesto / Vóley",
  gimnasio: "Gimnasio", crossfit_hiit: "CrossFit / HIIT", padel_tenis: "Pádel / Tenis",
  baile_aerobico: "Baile aeróbico", caminata_rapida: "Caminata rápida",
  pilates: "Pilates", caminata: "Caminata", yoga_hatha: "Yoga (Hatha)", yoga_bikram: "Yoga (Bikram)",
};

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useAppAlert();
  const [stats, setStats] = useState<EstadisticasDiarias | null>(null);
  const [actividadesHoy, setActividadesHoy] = useState<Actividad[]>([]);
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refs para rastrear toasts de progreso y evitar duplicados
  const lastShownPercentageRef = useRef<number>(-1);
  const lastShownThresholdRef = useRef<number | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  const load = useCallback(async () => {
    const today = formatLocalDate(new Date());
    try {
      const [s, resumen, consumosRes] = await Promise.all([
        getEstadisticasDiarias(today),
        activitiesService.resumenDia(today),
        consumosService.getConsumos(1, 50, { fecha_inicio: today, fecha_fin: today }),
      ]);
      setStats(s);
      setActividadesHoy(resumen.actividades ?? []);
      setConsumos(consumosRes.results || []);
      try {
        await updateWidgetData(
          s?.total_hidratacion_efectiva_ml ?? 0,
          s?.meta_ml ?? 2000,
        );
      } catch (e) {
        console.log("[Dashboard] Error actualizando widget:", e);
      }
    } catch {
      setStats(null);
      setActividadesHoy([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recalcular estadísticas cuando cambie el peso del usuario, de modo que la meta diaria
  // se actualice automáticamente después de editar el perfil sin necesidad de refrescar manualmente.
  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.peso, load]);

  // Cargar al montar y cada vez que la pantalla gana foco (p. ej. tras registrar consumo o actividad)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const nombre = user?.first_name || user?.username || "";
  const totalMl = stats?.total_hidratacion_efectiva_ml ?? 0;
  const metaMl = stats?.meta_ml ?? 0;
  const progreso = Math.min(100, stats?.progreso_porcentaje ?? 0);
  const restante = Math.max(0, metaMl - totalMl);

  const todayStr = formatLocalDate(new Date());

  const historialReciente = useMemo(() => {
    const isHoy = (fechaHora: string) => formatLocalDate(new Date(fechaHora)) === todayStr;
    const consumosHoy = (consumos || []).filter((c) => isHoy(c.fecha_hora));
    const actividadesHoyFiltradas = (actividadesHoy || []).filter((a) => isHoy(a.fecha_hora));

    const items: Array<{
      id: string;
      tipo: "consumo" | "actividad";
      fecha_hora: string;
      consumo?: Consumo;
      actividad?: Actividad;
    }> = [
      ...consumosHoy.map((c) => ({
        id: `consumo-${c.id}`,
        tipo: "consumo" as const,
        fecha_hora: c.fecha_hora,
        consumo: c,
      })),
      ...actividadesHoyFiltradas.map((a) => ({
        id: `actividad-${a.id}`,
        tipo: "actividad" as const,
        fecha_hora: a.fecha_hora,
        actividad: a,
      })),
    ];

    items.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
    return items.slice(0, 8);
  }, [consumos, actividadesHoy, todayStr]);

  const handleDeleteConsumo = async (id: number) => {
    showConfirm({
      title: "Eliminar consumo",
      message: "¿Deseas eliminar este consumo?",
      variant: "success",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await consumosService.deleteConsumo(id);
              await load();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Error al eliminar consumo.";
              showAlert({ title: "Error", message: msg, variant: "danger" });
            }
          },
        },
      ],
    });
  };

  const handleDeleteActividad = async (id: number) => {
    showConfirm({
      title: "Eliminar actividad",
      message: "¿Deseas eliminar esta actividad?",
      variant: "activity",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await activitiesService.delete(id);
              await load();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Error al eliminar actividad.";
              showAlert({ title: "Error", message: msg, variant: "danger" });
            }
          },
        },
      ],
    });
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: 180,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Ionicons name="water" size={22} color="#17A24A" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              ¡Hola{nombre ? `, ${nombre}` : ""}! 👋
            </Text>
            <Text className="text-xs text-neutral-500">
              Mantente hidratado durante todo el día
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        {/* Progreso de hidratación mejorado */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-card border border-neutral-200">
          <View className="items-center mb-4">
            <Text className="text-xl font-display font-bold text-neutral-700 mb-2">
              Progreso de hidratación
            </Text>
            <Text className="text-sm text-neutral-600 text-center">
              {stats?.completada
                ? "¡Excelente! Has alcanzado tu meta de hidratación 🎉"
                : progreso >= 80
                ? "¡Casi lo logras! Solo un poco más 💪"
                : progreso >= 50
                ? "Vas por buen camino, sigue así! 🌟"
                : "¡Vamos! Tu cuerpo necesita hidratación 💧"}
            </Text>
          </View>
          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-display font-medium text-neutral-700">
                Hidratación efectiva
              </Text>
              <Text className="text-sm font-display font-medium text-neutral-500">
                {Math.round(progreso)}%
              </Text>
            </View>
            <View className="h-4 bg-neutral-200 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  stats?.completada
                    ? "bg-chart-500"
                    : progreso >= 80
                    ? "bg-secondary-600"
                    : "bg-accent-500"
                }`}
                style={{ width: `${Math.min(progreso, 100)}%` }}
              />
            </View>
          </View>
          {stats?.completada && (
            <View className="bg-chart-100 border border-chart-200 rounded-lg p-3 items-center">
              <Ionicons name="checkmark-circle" size={24} color="#17A24A" />
              <Text className="text-base font-display font-bold text-chart-800 mt-1">
                ¡Meta completada!
              </Text>
              <Text className="text-xs text-chart-600 text-center">
                Has alcanzado tu objetivo de hidratación para hoy
              </Text>
            </View>
          )}
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4 shadow-card border border-neutral-200">
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-xl font-display font-bold text-secondary-600">
                {totalMl} ml
              </Text>
              <Text className="text-xs text-neutral-600">Consumido</Text>
            </View>
            <View className="flex-1 items-center border-x border-neutral-100">
              <Text className="text-xl font-display font-bold text-neutral-800">
                {metaMl} ml
              </Text>
              <Text className="text-xs text-neutral-600">Meta diaria</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xl font-display font-bold text-amber-600">
                {restante} ml
              </Text>
              <Text className="text-xs text-neutral-600">Restante</Text>
            </View>
          </View>
        </View>

        {/* Anuncio arriba del historial para no superponer con el footer */}
        {!user?.es_premium && (
          <View className="mb-4 min-h-[50px] items-center justify-center">
            <MobileAdBanner placement="dashboard_history" />
          </View>
        )}

        {/* Layout con grid para tablets y pantallas grandes */}
        <View className="flex-row flex-wrap gap-4 mb-4">
          {/* Columna principal */}
          <View className="flex-1 min-w-[280px]">
            <View className="bg-white rounded-2xl p-4 shadow-card border border-neutral-200 mb-4">
              <Text className="text-base font-semibold text-neutral-800 mb-3">
                Historial de hoy
              </Text>
              {historialReciente.length === 0 ? (
            <View className="items-center py-8">
              <View className="mb-4">
                <Ionicons name="water-outline" size={48} color="#D1D5DB" />
                <Ionicons name="walk-outline" size={48} color="#D1D5DB" style={{ marginTop: -24, marginLeft: 24 }} />
              </View>
              <Text className="text-base font-display font-bold text-neutral-700 mb-2">
                ¡Comienza tu día hidratado! 💧
              </Text>
              <Text className="text-sm text-neutral-600 mb-4 text-center">
                Aún no has registrado consumos o actividades hoy
              </Text>
              <View className="w-full max-w-xs gap-2">
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddConsumo")}
                  className="bg-secondary-600 rounded-xl py-3 items-center"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="water-outline" size={20} color="#FFFFFF" />
                    <Text className="text-white font-display font-bold text-sm ml-2">
                      Registrar Consumo
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddActivity")}
                  className="bg-accent-500 rounded-xl py-3 items-center"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="walk-outline" size={20} color="#FFFFFF" />
                    <Text className="text-white font-display font-bold text-sm ml-2">
                      Registrar Actividad
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              </View>
              ) : (
              historialReciente.map((item) => {
              if (item.tipo === "consumo" && item.consumo) {
                const c = item.consumo;
                const bebidaNombre =
                  typeof c.bebida === "object" ? c.bebida.nombre : c.bebida_nombre || "Bebida";
                const hora = new Date(c.fecha_hora).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                return (
                  <View
                    key={item.id}
                    className="flex-row items-center justify-between py-2 border-b border-neutral-100 last:border-b-0"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 rounded-full bg-secondary-50 items-center justify-center mr-3">
                        <Ionicons name="water-outline" size={18} color="#17A24A" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-neutral-800">
                          <Text className="font-display font-bold text-secondary-600">
                            {bebidaNombre}
                          </Text>
                          {`: ${c.cantidad_ml}ml`}
                          {c.cantidad_hidratacion_efectiva &&
                            c.cantidad_hidratacion_efectiva !== c.cantidad_ml && (
                              <Text className="font-display font-bold text-accent-600">
                                {" "}({c.cantidad_hidratacion_efectiva}ml efectivos)
                              </Text>
                            )}
                        </Text>
                        <Text className="text-xs text-neutral-500">{hora}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("AddConsumo", { consumo: c })}
                      className="px-2 py-1 mr-1"
                    >
                      <Ionicons name="create-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteConsumo(c.id)}
                      className="px-2 py-1"
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                );
              }

              if (item.tipo === "actividad" && item.actividad) {
                const a = item.actividad;
                const nombreActividad =
                  TIPO_LABELS[a.tipo_actividad] || a.tipo_actividad_display || a.tipo_actividad;
                const hora = new Date(a.fecha_hora).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                return (
                  <View
                    key={item.id}
                    className="flex-row items-center justify-between py-2 border-b border-neutral-100 last:border-b-0"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 rounded-full bg-accent-50 items-center justify-center mr-3">
                        <Ionicons name="walk-outline" size={18} color="#0EA5E9" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-neutral-800">
                          <Text className="font-display font-bold text-accent-600">
                            {nombreActividad} ({a.intensidad_display || a.intensidad})
                          </Text>
                          {`: ${a.duracion_minutos} min `}
                          <Text className="font-display font-bold text-secondary-600">
                            [+{a.pse_calculado}ml]
                          </Text>
                        </Text>
                        <Text className="text-xs text-neutral-500">{hora}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("AddActivity", { actividad: a })}
                      className="px-2 py-1 mr-1"
                    >
                      <Ionicons name="create-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteActividad(a.id)}
                      className="px-2 py-1"
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                );
              }

              return null;
            })
              )}
            </View>
          </View>

          {/* Columna derecha - Tips y Premium (solo visible en tablets/pantallas grandes) */}
          <View className="w-full md:w-[280px] md:flex-shrink-0">
            <DashboardTips />
            <DashboardPremiumCard isPremium={!!user?.es_premium} />
          </View>
        </View>

      </ScrollView>

      {/* Botones Flotantes de Acción (FAB): por encima del anuncio y del footer */}
      <View className="absolute right-4 z-50" style={{ bottom: 100, gap: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("AddConsumo")}
          className="w-16 h-16 rounded-full bg-secondary-600 items-center justify-center shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="water-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("AddActivity")}
          className="w-16 h-16 rounded-full bg-accent-500 items-center justify-center shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="walk-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
