import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useAppAlert } from "../context/AppAlertContext";
import MobileAdBanner from "../components/MobileAdBanner";
import HeaderAppLogo from "../components/HeaderAppLogo";

const CHEVRON = <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />;

interface RowItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  onPress: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

function RowItem({
  icon,
  iconColor,
  label,
  value,
  onPress,
  showChevron = true,
  destructive = false,
}: RowItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center justify-between py-3 px-4"
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-9 h-9 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: destructive ? "#FEE2E2" : `${iconColor}18` }}
        >
          <Ionicons
            name={icon}
            size={20}
            color={destructive ? "#DC2626" : iconColor}
          />
        </View>
        <Text
          className={`text-base font-medium flex-1 ${
            destructive ? "text-red-600" : "text-neutral-800"
          }`}
          numberOfLines={1}
        >
          {label}
        </Text>
        {value !== undefined && value !== "" && (
          <Text className="text-sm text-neutral-500" numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {showChevron && <View className="ml-2">{CHEVRON}</View>}
    </TouchableOpacity>
  );
}

function GroupCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-semibold text-neutral-500 uppercase tracking-wide px-1 mb-2">
        {title}
      </Text>
      <View className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-neutral-100 mx-4" />;
}

export default function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const navigation = useNavigation<any>();
  const { showAlert, showConfirm } = useAppAlert();
  const [deleting, setDeleting] = useState(false);

  const nombre =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "—";
  const plan = user?.es_premium ? "Premium" : "Gratuito";
  const peso = user?.peso != null ? `${user.peso} kg` : "—";

  const handleLogout = () => {
    showConfirm({
      title: "Cerrar sesión",
      message: "¿Estás seguro de que quieres cerrar sesión?",
      variant: "success",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: () => logout() },
      ],
    });
  };

  const handleDeleteAccount = () => {
    showConfirm({
      title: "Eliminar mi cuenta",
      message:
        "Esta acción es irreversible. Se eliminarán todos tus datos (consumos, recipientes, recordatorios, etc.). ¿Estás seguro de que deseas eliminar tu cuenta?",
      variant: "danger",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar cuenta",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
            } catch (e) {
              showAlert({
                title: "Error",
                message: e instanceof Error ? e.message : "No se pudo eliminar la cuenta.",
                variant: "danger",
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-50" edges={["top"]}>
      {/* Header interno */}
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
          <Ionicons name="person-outline" size={22} color="#17A24A" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-display font-bold text-neutral-800">
            Mi perfil
          </Text>
          <Text className="text-xs text-neutral-500">
            Tu cuenta y preferencias
          </Text>
        </View>
        <HeaderAppLogo />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Bloque superior: Nombre, Email, Badge */}
        <View className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 mb-6">
          <Text className="text-lg font-display font-bold text-neutral-900">
            {nombre}
          </Text>
          <Text className="text-sm text-neutral-500 mt-0.5" numberOfLines={1}>
            {user?.email ?? "—"}
          </Text>
          <View className="mt-3 self-start">
            <View
              className={`px-3 py-1.5 rounded-full ${
                user?.es_premium ? "bg-amber-100" : "bg-neutral-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  user?.es_premium ? "text-amber-800" : "text-neutral-600"
                }`}
              >
                {plan}
              </Text>
            </View>
          </View>
        </View>

        {/* Grupo A: Configuración de hidratación */}
        <GroupCard title="Configuración de hidratación">
          <RowItem
            icon="person-outline"
            iconColor="#17A24A"
            label="Mi peso"
            value={peso}
            onPress={() => navigation.navigate("EditProfile")}
          />
          <Divider />
          <RowItem
            icon="notifications-outline"
            iconColor="#059669"
            label="Recordatorios"
            onPress={() => navigation.navigate("Recordatorios")}
          />
          <Divider />
          <RowItem
            icon="water-outline"
            iconColor="#059669"
            label="Catálogo de bebidas"
            onPress={() => navigation.navigate("Bebidas")}
          />
          <Divider />
          <RowItem
            icon="wine-outline"
            iconColor="#6366F1"
            label="Recipientes"
            onPress={() => navigation.navigate("Recipientes")}
          />
        </GroupCard>

        <MobileAdBanner placement="profile" />

        {/* Grupo B: Cuenta y seguridad */}
        <GroupCard title="Cuenta y seguridad">
          <RowItem
            icon="star"
            iconColor="#D97706"
            label="Premium"
            onPress={() => navigation.navigate("Premium")}
          />
          <Divider />
          <RowItem
            icon="gift-outline"
            iconColor="#16A34A"
            label="Programa de referidos"
            onPress={() => navigation.navigate("Referidos")}
          />
          <Divider />
          <RowItem
            icon="lock-closed-outline"
            iconColor="#4B5563"
            label="Cambiar contraseña"
            onPress={() => navigation.navigate("ChangePassword")}
          />
        </GroupCard>

        {/* Grupo C: Otros */}
        <GroupCard title="Otros">
          <RowItem
            icon="chatbubble-ellipses-outline"
            iconColor="#059669"
            label="Enviar comentarios"
            onPress={() => navigation.navigate("Feedback")}
          />
          <Divider />
          <RowItem
            icon="log-out-outline"
            iconColor="#6B7280"
            label="Cerrar sesión"
            onPress={handleLogout}
          />
          <Divider />
          <RowItem
            icon="trash-outline"
            iconColor="#DC2626"
            label="Eliminar mi cuenta"
            onPress={handleDeleteAccount}
            destructive
          />
        </GroupCard>

        {deleting && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#17A24A" />
            <Text className="text-sm text-neutral-500 mt-2">
              Eliminando cuenta...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
