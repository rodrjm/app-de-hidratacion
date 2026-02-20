import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { bebidasService } from "../services/consumos";
import HeaderAppLogo from "../components/HeaderAppLogo";
import { useAuth } from "../context/AuthContext";
import type { Bebida } from "../types";
import { useNavigation } from "@react-navigation/native";
import SugerirBebidaModal from "../components/SugerirBebidaModal";

interface ClasificacionHidrica {
  nivel: number;
  nombre: string;
  color: string;
  simbolo: string;
  mensaje: string;
}

function getClasificacionHidrica(factor: number): ClasificacionHidrica {
  if (factor >= 1.15) {
    return {
      nivel: 1,
      nombre: "Muy Bueno",
      color: "#17A24A",
      simbolo: "💧💧💧",
      mensaje: "Ayuda a retener líquidos",
    };
  }
  if (factor >= 1.05) {
    return {
      nivel: 2,
      nombre: "Bueno",
      color: "#28A745",
      simbolo: "💧💧",
      mensaje: "Hidratación superior al agua",
    };
  }
  if (factor >= 0.95) {
    return {
      nivel: 3,
      nombre: "Neutro",
      color: "#007BFF",
      simbolo: "💧",
      mensaje: "Similar al agua",
    };
  }
  if (factor >= 0.8) {
    return {
      nivel: 4,
      nombre: "Regular",
      color: "#FFC107",
      simbolo: "⚠️",
      mensaje: "Hidrata poco, ligera compensación necesaria",
    };
  }
  return {
    nivel: 5,
    nombre: "Malo",
    color: "#DC3545",
    simbolo: "❌",
    mensaje: "Deshidrata más de lo que aporta, requiere compensación",
  };
}

export default function BebidasScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [bebidas, setBebidas] = useState<Bebida[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSugerirModal, setShowSugerirModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bebidasService.getBebidas({ activa: true });
        if (!cancelled) {
          setBebidas(res.results || []);
        }
      } catch (e) {
        console.log("[BebidasScreen] Error cargando bebidas", e);
        if (!cancelled) setBebidas([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { gratuitas, premium } = useMemo(() => {
    const gratuitasList = bebidas.filter((b) => !b.es_premium);
    const premiumList = bebidas.filter((b) => b.es_premium);
    return { gratuitas: gratuitasList, premium: premiumList };
  }, [bebidas]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-3 text-neutral-500">Cargando bebidas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mr-3">
            <Ionicons name="water-outline" size={22} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Catálogo de bebidas
            </Text>
            <Text className="text-xs text-neutral-500">
              Consulta las bebidas disponibles y su impacto en tu hidratación.
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

          <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4">
          <Text className="text-xs font-semibold text-neutral-500 mb-3">
            Bebidas gratuitas
          </Text>
          {gratuitas.length === 0 ? (
            <Text className="text-sm text-neutral-400 mb-4">
              No hay bebidas configuradas.
            </Text>
          ) : (
            gratuitas.map((b) => {
              const clas = getClasificacionHidrica(b.factor_hidratacion);
              return (
                <View
                  key={b.id}
                  className="flex-row items-center py-2 border-b border-neutral-100 last:border-b-0"
                >
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: clas.color }}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-neutral-800">
                      {b.nombre}
                    </Text>
                    <Text className="text-xs text-neutral-500">
                      {clas.simbolo} {clas.nombre} · {clas.mensaje}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {premium.length > 0 && (
            <View className="mt-4 pt-3 border-t border-neutral-200">
              <Text className="text-xs font-semibold text-neutral-500 mb-3">
                Bebidas premium
              </Text>
              {premium.map((b) => {
                const clas = getClasificacionHidrica(b.factor_hidratacion);
                const locked = !user?.es_premium;
                return (
                  <View
                    key={b.id}
                    className={`flex-row items-center py-2 border-b border-neutral-100 last:border-b-0 ${
                      locked ? "opacity-60" : ""
                    }`}
                  >
                    <View
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: clas.color }}
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text
                          className={`text-sm font-medium ${
                            locked ? "text-neutral-500" : "text-neutral-800"
                          }`}
                        >
                          {b.nombre}
                        </Text>
                        <View className="ml-2 px-2 py-0.5 rounded-full bg-secondary-100 flex-row items-center">
                          <Ionicons name="star" size={12} color="#16a34a" />
                          <Text className="ml-1 text-[10px] font-semibold text-secondary-700">
                            Premium
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-neutral-500">
                        {clas.simbolo} {clas.nombre} · {clas.mensaje}
                      </Text>
                    </View>
                    {locked && (
                      <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {!user?.es_premium && premium.length > 0 && (
          <View className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <View className="items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mb-2">
                <Ionicons name="star" size={24} color="#D97706" />
              </View>
              <Text className="text-base font-display font-bold text-amber-800 mb-1">
                Desbloquea más bebidas con Premium
              </Text>
              <Text className="text-sm text-amber-700 text-center mb-3">
                Accede a todas las bebidas premium y disfruta de funcionalidades exclusivas
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Premium")}
              className="bg-amber-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-display font-bold text-sm">
                Ver Premium
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón Sugerir Bebida (solo Premium) */}
        {user?.es_premium && (
          <TouchableOpacity
            onPress={() => setShowSugerirModal(true)}
            className="mt-4 bg-secondary-600 rounded-2xl py-3.5 px-4 flex-row items-center justify-center shadow-soft"
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 text-white font-display font-bold text-base">
              Sugerir nueva bebida
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal Sugerir Bebida */}
      <SugerirBebidaModal
        visible={showSugerirModal}
        onClose={() => setShowSugerirModal(false)}
        onSuccess={() => {
          // Opcional: recargar bebidas después de enviar sugerencia
        }}
      />
    </SafeAreaView>
  );
}

