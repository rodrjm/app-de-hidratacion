import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { consumosService } from "../services/consumos";
import type { Consumo, Tendencias, Insights } from "../types";
import { useAuth } from "../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAppAlert } from "../context/AppAlertContext";
import HeaderAppLogo from "../components/HeaderAppLogo";
import { isLikelyNetworkError, showOfflineModeToast } from "../utils/networkErrors";

type Period = "daily" | "weekly" | "monthly" | "annual";

interface Bucket {
  label: string;
  value: number;
  pct: number;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPeriodDates(period: Period) {
  const today = new Date();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const start = new Date(today);
  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    start.setDate(today.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (period === "annual") {
    start.setDate(today.getDate() - 364);
    start.setHours(0, 0, 0, 0);
  }

  return { fechaInicio: formatLocalDate(start), fechaFin: formatLocalDate(end) };
}

function isConsumoInPeriod(c: Consumo, period: Period): boolean {
  const d = new Date(c.fecha_hora);
  const dateStr = formatLocalDate(d);
  const { fechaInicio, fechaFin } = getPeriodDates(period);
  return dateStr >= fechaInicio && dateStr <= fechaFin;
}

function getHydrationValue(c: Consumo): number {
  const efectiva = c.hidratacion_efectiva_ml ?? c.cantidad_hidratacion_efectiva;
  if (efectiva !== undefined && efectiva !== null) {
    return Number(efectiva) || 0;
  }
  return Number(c.cantidad_ml ?? 0) || 0;
}

export default function StatisticsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { showConfirm } = useAppAlert();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(true);
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [tendencias, setTendencias] = useState<Tendencias | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loadingTendencias, setLoadingTendencias] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const loadData = useCallback(
    async (period: Period) => {
      setLoading(true);
      try {
        const { fechaInicio, fechaFin } = getPeriodDates(period);
        const res = await consumosService.getConsumos(1, 500, {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        });
        setConsumos(res.results || []);

        // Cargar tendencias solo si es Premium y el período no es "annual"
        if (user?.es_premium && period !== "annual") {
          setLoadingTendencias(true);
          try {
            const trends = await consumosService.getTendencias(
              period as "daily" | "weekly" | "monthly",
            );
            setTendencias(trends);
          } catch (e) {
            console.log("[StatisticsScreen] Error cargando tendencias", e);
            if (!isLikelyNetworkError(e)) {
              setTendencias(null);
            }
          } finally {
            setLoadingTendencias(false);
          }
        } else {
          setTendencias(null);
        }
      } catch (e) {
        console.log("[StatisticsScreen] Error cargando consumos", e);
        if (isLikelyNetworkError(e)) {
          showOfflineModeToast();
        } else {
          setConsumos([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.es_premium],
  );

  // Cargar al montar, al cambiar período y al volver a la pantalla (tras editar/agregar consumo)
  useFocusEffect(
    useCallback(() => {
      loadData(selectedPeriod);
    }, [selectedPeriod, loadData]),
  );

  // Filtrar consumos por período en hora local (por si el API devuelve datos fuera del rango)
  const consumosEnPeriodo = useMemo(() => {
    if (!consumos.length) return [];
    return consumos.filter((c) => isConsumoInPeriod(c, selectedPeriod));
  }, [consumos, selectedPeriod]);

  // Cargar insights solo para Premium
  useEffect(() => {
    if (user?.es_premium) {
      setLoadingInsights(true);
      consumosService
        .getInsights(30)
        .then((data) => {
          setInsights(data);
        })
        .catch((e) => {
          console.log("[StatisticsScreen] Error cargando insights", e);
          if (!isLikelyNetworkError(e)) {
            setInsights(null);
          }
        })
        .finally(() => {
          setLoadingInsights(false);
        });
    } else {
      setInsights(null);
    }
  }, [user?.es_premium]);

  const buckets: Bucket[] = useMemo(() => {
    if (!consumosEnPeriodo || consumosEnPeriodo.length === 0) return [];

    if (selectedPeriod === "daily") {
      // 8 bloques de 3 horas (solo del día actual)
      const raw = new Array(8).fill(0);
      consumosEnPeriodo.forEach((c) => {
        const d = new Date(c.fecha_hora);
        const idx = Math.floor(d.getHours() / 3);
        if (idx >= 0 && idx < 8) {
          raw[idx] += getHydrationValue(c);
        }
      });
      const max = Math.max(...raw, 0);
      return raw.map((v, i) => ({
        value: v,
        pct: max > 0 ? Math.round((v / max) * 100) : 0,
        label: `${i * 3}:00`,
      }));
    }

    if (selectedPeriod === "weekly") {
      // Lunes a domingo
      const raw = new Array(7).fill(0);
      const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
      consumosEnPeriodo.forEach((c) => {
        const d = new Date(c.fecha_hora);
        let day = d.getDay(); // 0=Dom
        day = day === 0 ? 6 : day - 1; // 0=Lun
        if (day >= 0 && day < 7) {
          raw[day] += getHydrationValue(c);
        }
      });
      const max = Math.max(...raw, 0);
      return raw.map((v, i) => ({
        value: v,
        pct: max > 0 ? Math.round((v / max) * 100) : 0,
        label: labels[i],
      }));
    }

    if (selectedPeriod === "monthly") {
      // 4 "semanas" aproximadas
      const raw = new Array(4).fill(0);
      const labels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
      consumosEnPeriodo.forEach((c) => {
        const d = new Date(c.fecha_hora);
        const day = d.getDate();
        const idx = Math.min(3, Math.floor((day - 1) / 7));
        if (idx >= 0 && idx < 4) raw[idx] += getHydrationValue(c);
      });
      const max = Math.max(...raw, 0);
      return raw.map((v, i) => ({
        value: v,
        pct: max > 0 ? Math.round((v / max) * 100) : 0,
        label: labels[i],
      }));
    }

    // annual: 12 meses
    const raw = new Array(12).fill(0);
    const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    consumosEnPeriodo.forEach((c) => {
      const d = new Date(c.fecha_hora);
      const idx = d.getMonth();
      if (idx >= 0 && idx < 12) raw[idx] += getHydrationValue(c);
    });
    const max = Math.max(...raw, 0);
    return raw.map((v, i) => ({
      value: v,
      pct: max > 0 ? Math.round((v / max) * 100) : 0,
      label: labels[i],
    }));
  }, [consumosEnPeriodo, selectedPeriod]);

  const totalPeriodo = useMemo(
    () => buckets.reduce((sum, b) => sum + b.value, 0),
    [buckets],
  );

  const periodLabel = useMemo(() => {
    if (selectedPeriod === "daily") return "Hoy";
    if (selectedPeriod === "weekly") return "Últimos 7 días";
    if (selectedPeriod === "monthly") return "Últimos 30 días";
    return "Últimos 12 meses";
  }, [selectedPeriod]);

  const periodSubtitle = useMemo(() => {
    if (selectedPeriod === "daily") return "Hidratación por bloques de 3 horas";
    if (selectedPeriod === "weekly") return "Hidratación por día de la semana";
    if (selectedPeriod === "monthly") return "Hidratación por semana";
    return "Hidratación por mes";
  }, [selectedPeriod]);

  const handlePeriodChange = (period: Period) => {
    // Restringir períodos "monthly" y "annual" solo para Premium
    if ((period === "monthly" || period === "annual") && !user?.es_premium) {
      showConfirm({
        title: "Función Premium",
        message: "Los períodos mensual y anual están disponibles solo para usuarios Premium.",
        variant: "premium",
        buttons: [
          { text: "Cancelar", style: "cancel" },
          { text: "Ver planes Premium", onPress: () => navigation.navigate("Premium") },
        ],
      });
      return;
    }
    setSelectedPeriod(period);
  };

  const renderPeriodButton = (period: Period, label: string, isPremiumOnly = false) => {
    const active = selectedPeriod === period;
    const isLocked = isPremiumOnly && !user?.es_premium;
    return (
      <TouchableOpacity
        key={period}
        onPress={() => handlePeriodChange(period)}
        disabled={isLocked}
        className={`px-3 py-1.5 rounded-full border ${
          active
            ? "bg-secondary-600 border-secondary-500"
            : isLocked
              ? "bg-neutral-100 border-neutral-200 opacity-50"
              : "bg-white border-neutral-300"
        }`}
      >
        <View className="flex-row items-center">
          {isLocked && (
            <View className="mr-1">
              <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
            </View>
          )}
          <Text
            className={`text-xs font-medium ${
              active ? "text-white" : isLocked ? "text-neutral-400" : "text-neutral-800"
            }`}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-3 text-neutral-500">Cargando estadísticas...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        >
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mr-3">
              <Ionicons name="stats-chart" size={22} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-display font-bold text-neutral-800">
                Estadísticas
              </Text>
              <Text className="text-xs text-neutral-500">
                Visualiza tu hidratación en distintos períodos
              </Text>
            </View>
            <HeaderAppLogo />
          </View>

          {/* Selector de período */}
          <View className="bg-white rounded-2xl p-3 mb-4 shadow-card border border-neutral-200">
            <Text className="text-xs font-semibold text-neutral-600 mb-2">
              Período
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {renderPeriodButton("daily", "Hoy")}
              {renderPeriodButton("weekly", "Semana")}
              {renderPeriodButton("monthly", "Mes", true)}
              {renderPeriodButton("annual", "Año", true)}
            </View>
          </View>

          {/* Resumen */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-card border border-neutral-200">
            <Text className="text-xs font-semibold text-neutral-600 mb-1">
              Resumen del período
            </Text>
            <Text className="text-sm font-semibold text-neutral-800 mb-3">
              {periodLabel}
            </Text>
            <View className="flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="text-xl font-display font-bold text-secondary-600">
                  {Math.round(totalPeriodo)} ml
                </Text>
                <Text className="text-xs text-neutral-600 text-center">
                  Hidratación total
                </Text>
              </View>
              <View className="flex-1 items-center border-l border-neutral-100 pl-4">
                <Text className="text-xl font-display font-bold text-neutral-800">
                  {consumosEnPeriodo.length}
                </Text>
                <Text className="text-xs text-neutral-600 text-center">
                  Registros de consumo
                </Text>
              </View>
            </View>
          </View>

          {/* Gráfico de barras simple */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-card border border-neutral-200">
            <Text className="text-base font-semibold text-neutral-800 mb-1">
              Distribución de hidratación
            </Text>
            <Text className="text-xs text-neutral-500 mb-3">
              {periodSubtitle}
            </Text>

            {buckets.length === 0 ? (
              <Text className="text-sm text-neutral-500 mt-2">
                No hay datos de consumo en este período.
              </Text>
            ) : (
              <View className="mt-1">
                {buckets.map((b) => (
                  <View key={b.label} className="mb-3">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-medium text-neutral-700">
                        {b.label}
                      </Text>
                      <Text className="text-xs text-neutral-500">
                        {Math.round(b.value)} ml
                      </Text>
                    </View>
                    <View className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                      {b.value > 0 && (
                        <View
                          className="h-full rounded-full bg-secondary-500"
                          style={{ width: `${b.pct}%` }}
                        />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Card de Tendencias (solo Premium y períodos no anuales) */}
          {user?.es_premium && selectedPeriod !== "annual" && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-card border border-neutral-200">
              <Text className="text-base font-semibold text-neutral-800 mb-1">
                Tendencias
              </Text>
              <Text className="text-xs text-neutral-500 mb-3">
                {selectedPeriod === "daily"
                  ? "Comparación día actual vs día anterior"
                  : selectedPeriod === "weekly"
                    ? "Comparación semana actual vs anterior"
                    : "Comparación mes actual vs anterior"}
              </Text>
              {loadingTendencias ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#10b981" />
                </View>
              ) : tendencias ? (
                <View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm text-neutral-600">Cambio</Text>
                    {tendencias.cambio_porcentaje !== null &&
                    tendencias.cambio_porcentaje !== undefined ? (
                      <View className="flex-row items-center">
                        <Ionicons
                          name={
                            tendencias.cambio_porcentaje >= 0
                              ? "arrow-up"
                              : "arrow-down"
                          }
                          size={18}
                          color={
                            tendencias.cambio_porcentaje >= 0 ? "#17A24A" : "#DC2626"
                          }
                        />
                        <Text
                          className={`ml-1 font-display font-bold ${
                            tendencias.cambio_porcentaje >= 0
                              ? "text-secondary-600"
                              : "text-error-600"
                          }`}
                        >
                          {Math.round(Math.abs(tendencias.cambio_porcentaje))}%
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-sm text-neutral-500">N/A</Text>
                    )}
                  </View>
                  <View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-neutral-600">Anterior</Text>
                      <Text className="text-xs text-neutral-600">
                        {tendencias.total_anterior || 0} ml
                      </Text>
                    </View>
                    <View className="w-full h-3 bg-neutral-200 rounded-md overflow-hidden mb-2">
                      <View
                        className="h-full bg-neutral-400"
                        style={{
                          width: `${Math.min(
                            100,
                            ((tendencias.total_anterior || 0) /
                              Math.max(1, tendencias.total_actual || 1)) *
                              100,
                          )}%`,
                        }}
                      />
                    </View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-neutral-600">Actual</Text>
                      <Text className="text-xs text-neutral-600">
                        {tendencias.total_actual || 0} ml
                      </Text>
                    </View>
                    <View className="w-full h-3 bg-neutral-200 rounded-md overflow-hidden">
                      <View className="h-full bg-accent-500" style={{ width: "100%" }} />
                    </View>
                  </View>
                </View>
              ) : (
                <Text className="text-sm text-neutral-500">Sin datos de tendencias</Text>
              )}
            </View>
          )}

          {/* Card de Insights (solo Premium) */}
          {user?.es_premium && insights && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-card border border-neutral-200">
              <Text className="text-base font-semibold text-neutral-800 mb-1">
                💡 Insights Personalizados
              </Text>
              <Text className="text-xs text-neutral-500 mb-3">
                Análisis inteligente de tus patrones
              </Text>
              {loadingInsights ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#10b981" />
                </View>
              ) : (
                <View>
                  <View className="p-3 bg-accent-50 rounded-lg border border-accent-100 mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-10 h-10 bg-accent-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="water" size={20} color="#0EA5E9" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-display font-bold text-accent-900">
                          Bebida Favorita
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-accent-700 font-display font-medium">
                      {insights.bebida_mas_consumida || "Agua"}
                    </Text>
                  </View>
                  <View className="p-3 bg-secondary-50 rounded-lg border border-secondary-100 mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-10 h-10 bg-secondary-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="time-outline" size={20} color="#17A24A" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-display font-bold text-secondary-900">
                          Hora Pico
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-secondary-700 font-display font-medium">
                      {insights.hora_pico_hidratacion || "14:00"}
                    </Text>
                  </View>
                  <View className="p-3 bg-chart-50 rounded-lg border border-chart-100">
                    <View className="flex-row items-center mb-2">
                      <View className="w-10 h-10 bg-chart-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="trending-up" size={20} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-display font-bold text-chart-900">
                          Recomendación
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-chart-700">
                      {insights.recomendacion ||
                        "Mantén una hidratación constante durante el día"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Desbloquea Premium (abajo, similar a catálogo de bebidas) */}
          {!user?.es_premium && (
            <View className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <View className="items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mb-2">
                  <Ionicons name="star" size={24} color="#D97706" />
                </View>
                <Text className="text-base font-display font-bold text-amber-800 mb-1">
                  Desbloquea estadísticas avanzadas con Premium
                </Text>
                <Text className="text-sm text-amber-700 text-center mb-3">
                  Tendencias, insights personalizados y más períodos.
                </Text>
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
      )}
    </SafeAreaView>
  );
}

