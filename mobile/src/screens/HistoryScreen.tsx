import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { activitiesService } from "../services/activities";
import type { Actividad } from "../types";

const TIPO_LABELS: Record<string, string> = {
  correr: "Correr",
  ciclismo: "Ciclismo",
  natacion: "Natación",
  futbol_rugby: "Fútbol / Rugby",
  baloncesto_voley: "Baloncesto / Vóley",
  gimnasio: "Gimnasio",
  crossfit_hiit: "CrossFit / HIIT",
  padel_tenis: "Pádel / Tenis",
  baile_aerobico: "Baile aeróbico",
  caminata_rapida: "Caminata rápida",
  pilates: "Pilates",
  caminata: "Caminata",
  yoga_hatha: "Yoga (Hatha)",
  yoga_bikram: "Yoga (Bikram)",
};

function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActivityItem({ item }: { item: Actividad }) {
  const label = TIPO_LABELS[item.tipo_actividad] || item.tipo_actividad_display || item.tipo_actividad;
  const hasClimate = !!(item as any).weather_message || !!(item as any).climate_adjustment;
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-neutral-100 shadow-sm flex-row items-center">
      <View className="w-10 h-10 mr-3 rounded-full bg-primary-100 items-center justify-center">
        <Ionicons name="walk" size={20} color="#17A24A" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-neutral-800 text-base">{label}</Text>
        <Text className="text-sm text-neutral-500 mt-0.5">
          {item.duracion_minutos} min · {item.intensidad_display || item.intensidad}
        </Text>
        <Text className="text-xs text-neutral-400 mt-1">{formatFechaHora(item.fecha_hora)}</Text>
      </View>
      <View className="items-end ml-3">
        <View className="bg-emerald-50 px-2 py-1 rounded-lg mb-1">
          <Text className="font-bold text-emerald-700 text-sm">+{item.pse_calculado} ml</Text>
        </View>
        {hasClimate && (
          <View className="flex-row items-center">
            <Ionicons name="cloud-outline" size={14} color="#6B7280" />
            <Text className="ml-1 text-[11px] text-neutral-500">Clima</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [list, setList] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await activitiesService.list({ page_size: 100 });
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50 justify-center items-center">
        <ActivityIndicator size="large" className="text-emerald-500" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-display font-bold text-neutral-800">
          Historial de actividades
        </Text>
        <Text className="text-neutral-600 text-sm">
          Tus actividades físicas registradas
        </Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ActivityItem item={item} />}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={
          <View className="py-8 items-center">
            <Text className="text-neutral-500">Aún no hay actividades.</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}
