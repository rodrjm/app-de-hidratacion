import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

// Paleta de colores EXACTA alineada con tailwind.config.js de la app
const COLORS = {
  background: "#F3F7F8", // primary-50
  border: "#E5E7EB", // neutral-200
  textPrimary: "#1f2937", // neutral-800
  label: "#737373", // neutral-500
  // Estados de progreso
  startAccent: "#0EA5E9", // accent-500 (Azul Ciel)
  middleSecondary: "#059669", // secondary-600 (Verde Esmeralda)
  doneChart: "#10b981", // chart-500 (Verde Menta)
  // Otros
  restanteAmber: "#d97706", // amber-600
  buttonActivity: "#007BFF", // Mantenemos acento original para contraste
} as const;

interface HydrationWidgetProps {
  consumido: number;
  meta: number;
}

export function HydrationWidget({ consumido, meta }: HydrationWidgetProps) {
  const restante = Math.max(0, meta - consumido);
  const porcentaje =
    meta > 0 ? Math.min(100, Math.round((consumido / meta) * 100)) : 0;
  const completada = porcentaje >= 100;

  // Lógica dinámica de textos y colores (portada de HydrationProgress.tsx)
  const getDynamicStyle = () => {
    if (completada) {
      return {
        message: "¡Excelente! Has alcanzado tu meta de hidratación 🎉",
        color: COLORS.doneChart,
      };
    }
    if (porcentaje >= 80) {
      return {
        message: "¡Casi lo logras! Solo un poco más 💪",
        color: COLORS.middleSecondary,
      };
    }
    if (porcentaje >= 50) {
      return {
        message: "Vas por buen camino, sigue así! 🌟",
        color: COLORS.startAccent, // Azul en rango medio
      };
    }
    return {
      message: "¡Vamos! Tu cuerpo necesita hidratación 💧",
      color: COLORS.startAccent, // Azul al inicio
    };
  };

  const dynamic = getDynamicStyle();

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "wrap_content", // CLAVE: wrap_content para que se compacte verticalmente en 2x2
        flexDirection: "column",
        padding: 8, // Compactamos padding exterior
        backgroundColor: COLORS.background,
        borderRadius: 20,
        justifyContent: "flex-start",
      }}
    >
      {/* 1. Cabecera - Compactada */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <TextWidget
          text="Progreso de hidratación"
          style={{ fontSize: 12, fontWeight: "700", color: COLORS.textPrimary }}
        />
        <TextWidget
          text={dynamic.message} // Texto dinámico
          style={{
            fontSize: 8, // Achicado para asegurar una sola fila
            color: COLORS.label,
            marginTop: 1,
            textAlign: "center",
          }}
        />
      </FlexWidget>

      {/* 2. Barra de progreso - Compactada y Dinámica */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
          marginBottom: 6,
        }}
      >
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 3,
          }}
        >
          <TextWidget
            text="Hidratación efectiva"
            style={{ fontSize: 9, fontWeight: "600", color: COLORS.textPrimary }}
          />
          <TextWidget
            text={`${porcentaje}%`}
            style={{ fontSize: 9, fontWeight: "600", color: COLORS.label }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            width: "match_parent",
            height: 6,
            borderRadius: 3,
            backgroundColor: COLORS.border,
            overflow: "hidden",
          }}
        >
          <FlexWidget
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: dynamic.color, // Color dinámico de la barra
              width: `${porcentaje}%`,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 3. Tarjeta interna de estadísticas - Compactada y Dinámica */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 5,
          paddingHorizontal: 2,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 14,
          marginBottom: 6,
        }}
      >
        {/* Columna Consumido */}
        <FlexWidget style={{ alignItems: "center", flex: 1 }}>
          <TextWidget
            text={`${consumido} ml`}
            style={{ fontSize: 9, fontWeight: "700", color: dynamic.color }} // Color dinámico en el número
          />
          <TextWidget
            text="Consumido"
            style={{ fontSize: 7, color: COLORS.label, marginTop: 1 }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            width: 1,
            height: 20,
            backgroundColor: COLORS.border,
          }}
        />

        {/* Columna Meta diaria */}
        <FlexWidget style={{ alignItems: "center", flex: 1 }}>
          <TextWidget
            text={`${meta} ml`}
            style={{ fontSize: 9, fontWeight: "700", color: COLORS.textPrimary }}
          />
          <TextWidget
            text="Meta diaria"
            style={{ fontSize: 7, color: COLORS.label, marginTop: 1 }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            width: 1,
            height: 20,
            backgroundColor: COLORS.border,
          }}
        />

        {/* Columna Restante */}
        <FlexWidget style={{ alignItems: "center", flex: 1 }}>
          <TextWidget
            text={`${restante} ml`}
            style={{ fontSize: 9, fontWeight: "700", color: COLORS.restanteAmber }}
          />
          <TextWidget
            text="Restante"
            style={{ fontSize: 7, color: COLORS.label, marginTop: 1 }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 4. Botones de acción flotantes - Compactados y Centrados */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 2,
        }}
      >
        <FlexWidget
          style={{
            width: 32, // Botones más chicos
            height: 32,
            borderRadius: 16,
            backgroundColor: COLORS.middleSecondary, // Usamos Esmeralda para agua
            alignItems: "center",
            justifyContent: "center",
            marginRight: 24, // Separación explícita fija
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: "dosisvital://add-water" }}
        >
          <TextWidget text="💧" style={{ fontSize: 14 }} />
        </FlexWidget>
        <FlexWidget
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: COLORS.buttonActivity,
            alignItems: "center",
            justifyContent: "center",
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: "dosisvital://add-activity" }}
        >
          <TextWidget text="🚶" style={{ fontSize: 14 }} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
