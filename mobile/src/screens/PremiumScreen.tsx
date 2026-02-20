import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { monetizationService, type PlanType } from "../services/monetization";
import type { EstadoSuscripcion } from "../types";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../context/AppAlertContext";
import HeaderAppLogo from "../components/HeaderAppLogo";

export default function PremiumScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const { showAlert, showConfirm } = useAppAlert();
  const [status, setStatus] = useState<EstadoSuscripcion | null>(null);
  const [noAds, setNoAds] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const isPremium = Boolean(status?.is_premium ?? user?.es_premium);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [st, , , na] = await Promise.all([
          monetizationService.getSubscriptionStatus(),
          monetizationService.getPremiumFeatures(),
          monetizationService.getUpgradePrompt(),
          monetizationService.getNoAdsStatus(),
        ]);
        setStatus(st);
        setNoAds(!!na?.is_premium);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al cargar información de Premium.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleUpgrade = async (planType: PlanType) => {
    try {
      setIsSubscribing(true);
      setError(null);
      const initPoint = await monetizationService.createCheckoutSession(planType);
      const supported = await Linking.canOpenURL(initPoint);
      if (supported) {
        await Linking.openURL(initPoint);
      } else {
        throw new Error("No se pudo abrir el navegador para el pago.");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const apiError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null);
      const isServerError = err.response?.status && err.response.status >= 400;
      const msg = apiError
        ? String(apiError)
        : isServerError
          ? "El pago no está disponible en este entorno. Configura Mercado Pago en el servidor o prueba en producción."
          : e instanceof Error
            ? e.message
            : "Error al iniciar el proceso de pago.";
      setError(msg);
      showAlert({ title: "Error", message: msg, variant: "danger" });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCancelSubscription = () => {
    showConfirm({
      title: "Cancelar suscripción",
      message: "¿Seguro que quieres cancelar tu suscripción Premium?",
      variant: "premium",
      buttons: [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const res = await monetizationService.cancelSubscription();
              showAlert({ title: "Suscripción", message: res.message, variant: "premium" });
              const st = await monetizationService.getSubscriptionStatus();
              setStatus(st);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Error al cancelar suscripción.";
              showAlert({ title: "Error", message: msg, variant: "danger" });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    });
  };

  const handleReactivateSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await monetizationService.reactivateSubscription();
      showAlert({ title: "Suscripción", message: res.message, variant: "premium" });
      const st = await monetizationService.getSubscriptionStatus();
      setStatus(st);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error ?? (e instanceof Error ? e.message : "Error al reactivar.");
      showAlert({ title: "Error", message: msg, variant: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const planType = status?.plan_type ?? null;
  const isLifetime = planType === "lifetime";
  const isMonthly = planType === "monthly";
  const isAnnual = planType === "annual";

  const planLabel: Record<NonNullable<typeof planType>, string> = {
    monthly: "Mensual",
    annual: "Anual",
    lifetime: "De por vida",
  };

  /** Planes que se muestran como "Cambiar de plan" (excluye el actual y, si es vitalicio, no mostramos otros) */
  const otherPlans: { type: PlanType; title: string; price: string; subtitle?: string }[] = [];
  if (isPremium && !isLifetime) {
    if (!isMonthly) otherPlans.push({ type: "monthly", title: "Plan Mensual", price: "$1.000 ARS", subtitle: "Luego $2.000 ARS/mes" });
    if (!isAnnual) otherPlans.push({ type: "annual", title: "Plan Anual", price: "$18.000 ARS", subtitle: "Ahorras 25%" });
    if (!isLifetime) otherPlans.push({ type: "lifetime", title: "Plan De por vida", price: "$100.000 ARS", subtitle: "Pago único" });
  }

  if (isLoading && !status && !user?.es_premium) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D97706" />
          <Text className="mt-3 text-neutral-500">Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isPremium) {
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
          <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
              <Ionicons name="star" size={22} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-display font-bold text-neutral-800">
                Premium
              </Text>
              <Text className="text-xs text-neutral-500">
                Gracias por apoyar Dosis Vital 💧
              </Text>
            </View>
          <HeaderAppLogo />
          </View>

          <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
            {isLoading ? (
              <View className="items-center justify-center py-4">
                <ActivityIndicator size="small" color="#10b981" />
                <Text className="mt-2 text-neutral-500 text-sm">Cargando información...</Text>
              </View>
            ) : (
              <>
                {isLifetime ? (
                  <View className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                    <View className="flex-row items-center justify-center mb-2">
                      <Text className="text-2xl mr-2">✨</Text>
                      <Text className="text-yellow-800 font-display font-bold text-lg">
                        Eres miembro vitalicio
                      </Text>
                    </View>
                    <Text className="text-sm text-yellow-800 text-center">
                      Disfruta de Dosis Vital para siempre.
                    </Text>
                    <Text className="text-xs text-yellow-700 text-center mt-2">
                      Plan: De por vida
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-neutral-800 font-display font-medium">
                        Usuario Premium activo
                      </Text>
                      {planType && (
                        <Text className="text-sm text-neutral-600 mt-1">
                          Plan: {planLabel[planType]}
                        </Text>
                      )}
                      {status?.subscription_end_date && (
                        <Text className="text-xs text-neutral-500 mt-1">
                          Vence:{" "}
                          {new Date(status.subscription_end_date).toLocaleDateString("es-ES")}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                )}
              </>
            )}
          </View>

          {/* Experiencia sin anuncios (oculto mientras carga) */}
          {!isLoading && (
            <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
              <Text className="text-base font-display font-semibold text-neutral-800 mb-2">
                Experiencia sin anuncios
              </Text>
              <View className="flex-row items-center">
                <Ionicons
                  name="ban-outline"
                  size={18}
                  color={noAds ? "#16a34a" : "#9CA3AF"}
                />
                <Text className="ml-2 text-sm text-neutral-700">
                  {noAds ? "Anuncios deshabilitados" : "Anuncios habilitados (usuario free)"}
                </Text>
              </View>
            </View>
          )}

          {/* Otras opciones de plan (solo si es premium mensual o anual; ocultas mientras carga) */}
          {otherPlans.length > 0 && !isLoading && (
            <View className="mb-4">
              <Text className="text-lg font-display font-bold text-neutral-800 mb-3">
                Cambiar de plan
              </Text>
              {otherPlans.map((plan) => (
                <View
                  key={plan.type}
                  className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-3"
                >
                  <Text className="text-base font-display font-bold text-neutral-800">
                    {plan.title}
                  </Text>
                  <Text className="text-lg font-display font-bold text-amber-700 mt-1">
                    {plan.price}
                  </Text>
                  {plan.subtitle ? (
                    <Text className="text-xs text-neutral-500 mt-1">{plan.subtitle}</Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => handleUpgrade(plan.type)}
                    disabled={isSubscribing}
                    className="mt-3 bg-amber-600 rounded-xl py-3 items-center"
                  >
                    {isSubscribing ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-display font-bold text-sm">
                        Cambiar de plan
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {!isLoading && !isLifetime && status?.auto_renewal === false && status?.subscription_end_date ? (
            <View className="mt-2">
              <View className="bg-neutral-100 border border-neutral-200 rounded-2xl py-3 px-4">
                <Text className="text-neutral-600 text-sm text-center">
                  Cancelación solicitada. Tienes acceso hasta el{" "}
                  {new Date(status.subscription_end_date).toLocaleDateString("es-ES")}.
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleReactivateSubscription}
                disabled={isLoading}
                className="mt-3 bg-amber-600 rounded-2xl py-3 items-center"
              >
                <Text className="text-white font-display font-bold text-sm">
                  Continuar con el plan
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {!isLoading && !isLifetime && status?.auto_renewal !== false ? (
            <TouchableOpacity
              onPress={handleCancelSubscription}
              disabled={isLoading}
              className="mt-2 bg-red-50 border border-red-200 rounded-2xl py-3 items-center"
            >
              <Text className="text-red-600 font-display font-bold text-sm">
                Cancelar suscripción
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
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
          <View className="flex-1" />
          <HeaderAppLogo />
        </View>
        <View className="items-center mb-8">
          <View className="w-14 h-14 rounded-full bg-amber-100 items-center justify-center mb-3">
            <Ionicons name="star" size={26} color="#D97706" />
          </View>
          <Text className="text-2xl font-display font-bold text-neutral-800 text-center">
            Dosis Vital Premium
          </Text>
          <Text className="mt-2 text-sm text-neutral-600 text-center max-w-md">
            Controla tu hidratación de manera científica, maximiza tu rendimiento y evita la
            deshidratación real.
          </Text>
        </View>

        {error && (
          <View className="bg-error-50 border border-error-200 rounded-xl p-3 mb-4">
            <Text className="text-error text-sm">{error}</Text>
          </View>
        )}

        {/* Funcionalidades Premium (resumen estático, similar al web) */}
        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-6">
          <Text className="text-base font-display font-semibold text-neutral-800 mb-3">
            Funcionalidades Premium
          </Text>
          {[
            {
              title: "Cálculo científico (factor de hidratación)",
              desc: "Registra cerveza, café y otras bebidas con la seguridad de saber su impacto real.",
            },
            {
              title: "Recordatorios ajustables",
              desc: "Recibe recordatorios con intervalos cortos para mantenerte hidratado.",
            },
            {
              title: "Estadísticas avanzadas",
              desc: "Tendencias diarias, semanales y anuales para entender tus hábitos.",
            },
            {
              title: "Ajustá la aplicación a tu gusto",
              desc: "Incorporá los recipientes que vos desees o que más utilices en tu día a día para hidratarte.",
            },
            {
              title: "Experiencia sin anuncios",
              desc: "Disfruta de una interfaz limpia y fluida, sin distracciones.",
            },
          ].map((f) => (
            <View key={f.title} className="flex-row items-start mb-3">
              <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" className="mr-2" />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-display font-medium text-neutral-800">
                  {f.title}
                </Text>
                <Text className="text-xs text-neutral-600 mt-1">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

          {/* Planes de suscripción */}
        <View className="mb-6">
          <Text className="text-xl font-display font-bold text-neutral-800 text-center mb-4">
            Elige tu plan
          </Text>

          {/* Plan mensual */}
          <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-4">
            <Text className="text-lg font-display font-bold text-neutral-800 mb-1">
              Plan Mensual
            </Text>
            <Text className="text-xs text-neutral-500 mb-1 line-through">
              $2.000 ARS
            </Text>
            <Text className="text-2xl font-display font-bold text-amber-700">
              $1.000 ARS
            </Text>
            <Text className="text-xs text-neutral-500 mb-2">
              Solo el primer mes, luego $2.000 ARS
            </Text>
            <Text className="text-xs text-neutral-500 mb-4">
              Opción de menor compromiso.
            </Text>
            <TouchableOpacity
              onPress={() => handleUpgrade("monthly")}
              disabled={isSubscribing}
              className="mt-1 bg-amber-600 rounded-xl py-3 items-center"
            >
              {isSubscribing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-display font-bold text-sm">
                  Suscribirme ahora
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Plan anual */}
          <View className="bg-white rounded-2xl border-2 border-amber-500 shadow-card p-4 mb-4">
            <View className="self-center mb-2 px-3 py-1 rounded-full bg-amber-500 flex-row items-center">
              <Ionicons name="star" size={14} color="#FFFFFF" />
              <Text className="ml-1 text-[11px] font-display font-semibold text-white">
                Opción más popular
              </Text>
            </View>
            <Text className="text-lg font-display font-bold text-neutral-800 mb-1">
              Plan Anual
            </Text>
            <Text className="text-2xl font-display font-bold text-amber-700">
              $18.000 ARS
            </Text>
            <Text className="text-xs text-neutral-600 mt-1">
              Equivale a $1.500 ARS/mes
            </Text>
            <Text className="text-xs text-amber-700 font-semibold mt-1">
              Ahorras 25% frente al plan mensual
            </Text>
            <TouchableOpacity
              onPress={() => handleUpgrade("annual")}
              disabled={isSubscribing}
              className="mt-3 bg-amber-600 rounded-xl py-3 items-center"
            >
              {isSubscribing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-display font-bold text-sm">
                  Suscribirme ahora
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Plan de por vida */}
          <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4 mb-2">
            <Text className="text-lg font-display font-bold text-neutral-800 mb-1">
              Plan De por vida
            </Text>
            <Text className="text-2xl font-display font-bold text-amber-700">
              $100.000 ARS
            </Text>
            <Text className="text-xs text-neutral-600 mt-1">
              Pago único
            </Text>
            <TouchableOpacity
              onPress={() => handleUpgrade("lifetime")}
              disabled={isSubscribing}
              className="mt-3 bg-amber-600 rounded-xl py-3 items-center"
            >
              {isSubscribing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-display font-bold text-sm">
                  Suscribirme ahora
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

