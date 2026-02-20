import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { referidosService, type ReferidosInfo } from "../services/referidos";
import HeaderAppLogo from "../components/HeaderAppLogo";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useAppAlert } from "../context/AppAlertContext";

const INVITACION_BASE =
  "¡Sumate a Dosis Vital y mejorá tu hidratación! 🚰 Usá mi código de referido al registrarte: ";

export default function ReferidosScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const { showAlert, showConfirm } = useAppAlert();
  const [info, setInfo] = useState<ReferidosInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await referidosService.getReferidosInfo();
        if (!cancelled) setInfo(data);
      } catch (e) {
        if (!cancelled) {
          setInfo(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getMensajeInvitacion = () =>
    info ? `${INVITACION_BASE}${info.codigo_referido}. Descargá la app y al registrarte ingresá mi código.` : "";

  const handleCopy = async () => {
    if (!info) return;
    await Clipboard.setStringAsync(info.codigo_referido);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCompartirGeneral = async () => {
    const message = getMensajeInvitacion();
    if (!message) return;
    try {
      await Share.share({
        message,
        title: "Invitación a Dosis Vital",
      });
    } catch (e) {
      if ((e as { code?: string })?.code !== "SHARE_CANCELLED") {
        showAlert({ title: "Error", message: "No se pudo abrir el menú de compartir.", variant: "danger" });
      }
    }
  };


  const handleClaim = () => {
    if (!info?.tiene_recompensa_disponible) return;
    showConfirm({
      title: "Reclamar recompensa",
      message: "Has completado 3 referidos exitosos. ¿Quieres activar tu mes Premium gratis ahora?",
      variant: "premium",
      buttons: [
        { text: "Más tarde", style: "cancel" },
        {
          text: "Activar ahora",
          onPress: async () => {
            try {
              setClaiming(true);
              const res = await referidosService.reclamarRecompensa();
              showAlert({ title: "Recompensa", message: res.message, variant: "premium" });
              const data = await referidosService.getReferidosInfo();
              setInfo(data);
              await refreshUser();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Error al reclamar recompensa.";
              showAlert({ title: "Error", message: msg, variant: "danger" });
            } finally {
              setClaiming(false);
            }
          },
        },
      ],
    });
  };

  const progresoActual = info?.referidos_pendientes ?? 0;
  const necesarios = 3;
  const pct = Math.min((progresoActual / necesarios) * 100, 100);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-3 text-neutral-500">Cargando programa de referidos...</Text>
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
          <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mr-3">
            <Ionicons name="gift-outline" size={22} color="#16A34A" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Programa de referidos
            </Text>
            <Text className="text-xs text-neutral-500">
              ¡Recomienda Dosis Vital y gana meses Premium gratis!
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
          <Text className="text-sm font-display font-semibold text-neutral-800 mb-2">
            {user?.first_name ? `Hola, ${user.first_name}` : "Hola"}
          </Text>
          <Text className="text-xs text-neutral-600 mb-2">
            Gana 1 mes Premium gratis por cada 3 amigos que se registren y verifiquen su cuenta
            con tu código.
          </Text>
        </View>

        {/* Progreso */}
        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
          <Text className="text-xs font-semibold text-neutral-700 mb-2">
            Progreso
          </Text>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-display font-medium text-neutral-800">
              {progresoActual}/{necesarios} referidos
            </Text>
            {info?.tiene_recompensa_disponible && (
              <View className="flex-row items-center">
                <Ionicons name="gift-outline" size={16} color="#16A34A" />
                <Text className="ml-1 text-xs font-display font-semibold text-secondary-700">
                  ¡Recompensa disponible!
                </Text>
              </View>
            )}
          </View>
          <View className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden mb-1">
            <View
              className="bg-secondary-500 h-full rounded-full"
              style={{ width: `${pct}%` }}
            />
          </View>
          <View className="flex-row justify-between mt-1">
            {[1, 2, 3].map((num) => (
              <View
                key={num}
                className={`w-2 h-2 rounded-full ${
                  num <= progresoActual ? "bg-secondary-500" : "bg-neutral-300"
                }`}
              />
            ))}
          </View>
        </View>

        {/* Código de referido */}
        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
          <Text className="text-xs font-semibold text-neutral-700 mb-2">
            Tu código de referido
          </Text>
          {info ? (
            <View className="flex-row items-center">
              <View className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 mr-2">
                <Text className="font-mono text-lg font-bold text-neutral-800">
                  {info.codigo_referido}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCopy}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white mr-1"
              >
                <Ionicons
                  name={codeCopied ? "checkmark-outline" : "copy-outline"}
                  size={16}
                  color={codeCopied ? "#16A34A" : "#4B5563"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCompartirGeneral}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
              >
                <Ionicons name="share-social-outline" size={16} color="#4B5563" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-neutral-500">
                Generando tu código único...
              </Text>
              <ActivityIndicator size="small" color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Botón reclamar recompensa */}
        {info?.tiene_recompensa_disponible && (
          <TouchableOpacity
            onPress={handleClaim}
            disabled={claiming}
            className="mt-1 bg-secondary-600 rounded-2xl py-3 items-center"
          >
            {claiming ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="gift-outline" size={18} color="#FFFFFF" />
                <Text className="ml-2 text-white font-display font-bold text-sm">
                  Reclamar 1 mes Premium gratis
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

