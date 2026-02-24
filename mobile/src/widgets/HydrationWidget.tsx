import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

// Colores y estilo alineados con la app (tailwind.config.js y pantallas)
const COLORS = {
  background: "#F3F7F8", // primary-50
  border: "#DEE2E6", // neutral-200
  consumido: "#17A24A", // secondary (agua)
  meta: "#212529", // neutral-800
  restante: "#D97706", // amber-600 (restante en Dashboard)
  label: "#6C757D", // neutral-500
  buttonWater: "#17A24A", // secondary
  buttonActivity: "#007BFF", // accent
} as const;

interface HydrationWidgetProps {
  consumido: number;
  meta: number;
}

export function HydrationWidget({ consumido, meta }: HydrationWidgetProps) {
  const restante = Math.max(0, meta - consumido);
  const porcentaje =
    meta > 0 ? Math.min(100, Math.round((consumido / meta) * 100)) : 0;

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "wrap_content", // clave para que el widget respete el contenido y pueda ser 2x2
        flexDirection: "column",
        padding: 16,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        justifyContent: "flex-start",
      }}
    >
      {/* 1. Cabecera */}
      <FlexWidget
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="Progreso de hidratación"
          style={{ fontSize: 16, fontWeight: "700", color: COLORS.meta }}
        />
        <TextWidget
          text="¡Vamos! Tu cuerpo necesita hidratación 💧"
          style={{
            fontSize: 11,
            color: COLORS.label,
            marginTop: 4,
            textAlign: "center",
          }}
        />
      </FlexWidget>

      {/* 2. Barra de progreso */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <TextWidget
          text="Hidratación efectiva"
          style={{ fontSize: 11, fontWeight: "600", color: COLORS.meta }}
        />
        <TextWidget
          text={`${porcentaje}%`}
          style={{ fontSize: 11, fontWeight: "600", color: COLORS.label }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          width: "match_parent",
          height: 8,
          borderRadius: 4,
          backgroundColor: COLORS.border,
          overflow: "hidden",
        }}
      >
        <FlexWidget
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: COLORS.consumido,
            width: `${porcentaje}%`,
          }}
        />
      </FlexWidget>

      {/* 3. Tarjeta interna de estadísticas */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
        }}
      >
        {/* Columna Consumido */}
        <FlexWidget
          style={{
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <TextWidget
            text={`${consumido} ml`}
            style={{ fontSize: 14, fontWeight: "700", color: COLORS.consumido }}
          />
          <TextWidget
            text="Consumido"
            style={{ fontSize: 10, color: COLORS.label, marginTop: 2 }}
          />
        </FlexWidget>

        {/* Separador vertical */}
        <FlexWidget
          style={{
            width: 1,
            height: 32,
            backgroundColor: COLORS.border,
            marginHorizontal: 4,
          }}
        />

        {/* Columna Meta diaria */}
        <FlexWidget
          style={{
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <TextWidget
            text={`${meta} ml`}
            style={{ fontSize: 14, fontWeight: "700", color: COLORS.meta }}
          />
          <TextWidget
            text="Meta diaria"
            style={{ fontSize: 10, color: COLORS.label, marginTop: 2 }}
          />
        </FlexWidget>

        {/* Separador vertical */}
        <FlexWidget
          style={{
            width: 1,
            height: 32,
            backgroundColor: COLORS.border,
            marginHorizontal: 4,
          }}
        />

        {/* Columna Restante */}
        <FlexWidget
          style={{
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <TextWidget
            text={`${restante} ml`}
            style={{ fontSize: 14, fontWeight: "700", color: COLORS.restante }}
          />
          <TextWidget
            text="Restante"
            style={{ fontSize: 10, color: COLORS.label, marginTop: 2 }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 4. Botones de acción flotantes */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 10,
          columnGap: 16,
        }}
      >
        <FlexWidget
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: COLORS.buttonWater,
            alignItems: "center",
            justifyContent: "center",
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: "dosisvital://add-water" }}
        >
          <TextWidget text="💧" style={{ fontSize: 24 }} />
        </FlexWidget>
        <FlexWidget
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: COLORS.buttonActivity,
            alignItems: "center",
            justifyContent: "center",
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: "dosisvital://add-activity" }}
        >
          <TextWidget text="🚶" style={{ fontSize: 24 }} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
