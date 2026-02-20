import "./global.css";
import React from "react";
import { View, Text, ActivityIndicator, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AppAlertProvider } from "./src/context/AppAlertContext";
import { notificationService } from "./src/services/notifications";
import LoginScreen, { AuthStackParamList } from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AddActivityScreen from "./src/screens/AddActivityScreen";
import AddConsumoScreen from "./src/screens/AddConsumoScreen";
// HistoryScreen removido - el historial está integrado en DashboardScreen para mantener paridad con la web
import ProfileScreen from "./src/screens/ProfileScreen";
import StatisticsScreen from "./src/screens/StatisticsScreen";
import BebidasScreen from "./src/screens/BebidasScreen";
import RecipientesScreen from "./src/screens/RecipientesScreen";
import TermsAndConditionsScreen from "./src/screens/TermsAndConditionsScreen";
import PrivacyPolicyScreen from "./src/screens/PrivacyPolicyScreen";
import RecordatoriosScreen from "./src/screens/RecordatoriosScreen";
import PremiumScreen from "./src/screens/PremiumScreen";
import FeedbackScreen from "./src/screens/FeedbackScreen";
import ReferidosScreen from "./src/screens/ReferidosScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import Toast from "react-native-toast-message";
import MobileAdBanner from "./src/components/MobileAdBanner";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();
const AppStack = createNativeStackNavigator();

const commonHeaderOptions = {
  headerStyle: { backgroundColor: "#f9fafb" },
  headerTitleStyle: { fontWeight: "700", fontSize: 18 },
  headerTintColor: "#1f2937",
  headerShadowVisible: false,
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        ...commonHeaderOptions,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      {/* Términos y política accesibles también antes de iniciar sesión */}
      <AuthStack.Screen
        name="TermsAndConditions"
        component={TermsAndConditionsScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <View className="flex-1">
      <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          borderTopColor: "#E5E7EB",
          backgroundColor: "#FFFFFF",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "Dashboard") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Statistics") iconName = focused ? "stats-chart" : "stats-chart-outline";
          else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#737373",
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Inicio" }} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} options={{ title: "Estadísticas" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
      </Tab.Navigator>
      {/* Banner inferior global (solo usuarios no premium; controlado dentro de MobileAdBanner) */}
      <MobileAdBanner placement="footer" />
    </View>
  );
}


function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa" }}>
      <ActivityIndicator size="large" color="#059669" />
      <Text style={{ marginTop: 12, color: "#737373" }}>Cargando...</Text>
    </View>
  );
}

function AppNavigatorWithOnboarding() {
  const { user } = useAuth();
  const navigationRef = React.useRef<any>(null);

  // Verificar si el usuario necesita onboarding
  const needsOnboarding =
    user &&
    (user.peso === 70.0 ||
      !user.fecha_nacimiento ||
      (user.fecha_nacimiento && (() => {
        const fechaNac = new Date(user.fecha_nacimiento);
        const hoy = new Date();
        const edadAprox = hoy.getFullYear() - fechaNac.getFullYear();
        return Math.abs(edadAprox - 25) < 2; // Edad aproximada de 25 años (valor temporal)
      })()));

  // Efecto para navegar automáticamente cuando el usuario complete el onboarding
  React.useEffect(() => {
    if (navigationRef.current && user && !needsOnboarding) {
      const currentRoute = navigationRef.current.getCurrentRoute();
      if (currentRoute?.name === "Onboarding") {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      }
    }
  }, [user, needsOnboarding]);

  return (
    <AppStack.Navigator
      ref={navigationRef}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={needsOnboarding ? "Onboarding" : "MainTabs"}
    >
      <AppStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen name="MainTabs" component={MainTabs} />
      <AppStack.Screen
        name="AddActivity"
        component={AddActivityScreen}
        options={{ presentation: "modal" }}
      />
      <AppStack.Screen
        name="AddConsumo"
        component={AddConsumoScreen}
        options={{ presentation: "modal" }}
      />
      <AppStack.Screen
        name="Bebidas"
        component={BebidasScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Recipientes"
        component={RecipientesScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Recordatorios"
        component={RecordatoriosScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Referidos"
        component={ReferidosScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="TermsAndConditions"
        component={TermsAndConditionsScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
    </AppStack.Navigator>
  );
}

function RootNavigator() {
  const { user, token, isLoading } = useAuth();

  // Inicializar notificaciones según preferencias del perfil (hora_inicio, hora_fin, intervalo)
  React.useEffect(() => {
    if (user && token) {
      const initNotifications = async () => {
        try {
          await notificationService.requestPermissions();
          const enabled = user.recordar_notificaciones ?? true;
          const horaInicio = user.hora_inicio ?? "08:00";
          const horaFin = user.hora_fin ?? "22:00";
          const intervalo = user.intervalo_notificaciones ?? 240;
          await notificationService.syncFromUserProfile({
            recordar_notificaciones: enabled,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            intervalo_notificaciones: intervalo,
          });
        } catch (error) {
          console.log("[App] Error inicializando notificaciones:", error);
        }
      };
      initNotifications();
    }
  }, [user, token]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user || token) {
    return <AppNavigatorWithOnboarding />;
  }

  return <AuthNavigator />;
}

export default function App() {
  // Inicializar AdMob SDK solo en development build / producción (en Expo Go el módulo nativo no existe)
  React.useEffect(() => {
    if (Constants.appOwnership === "expo") return;
    if (Platform.OS !== "ios" && Platform.OS !== "android") return;
    const { MobileAds } = require("react-native-google-mobile-ads");
    MobileAds()
      .initialize()
      .then((adapterStatuses: unknown) => {
        console.log("[App] AdMob inicializado:", adapterStatuses);
      })
      .catch((error: unknown) => {
        console.warn("[App] Error inicializando AdMob:", error);
      });
  }, []);

  const linking = {
    prefixes: ["dosisvital://"],
    config: {
      screens: {
        // Rutas principales
        MainTabs: {
          screens: {
            Dashboard: "dashboard",
          },
        },
        // Accesos rápidos desde el widget
        AddConsumo: "add-water",
        AddActivity: "add-activity",
      },
    },
  };

  return (
    <AuthProvider>
      <AppAlertProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="dark" />
          <RootNavigator />
          <Toast />
        </NavigationContainer>
      </AppAlertProvider>
    </AuthProvider>
  );
}
