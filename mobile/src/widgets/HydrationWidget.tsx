import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

const COLORS = {
  background: "#F3F7F8",
  border: "#DEE2E6",
  consumido: "#17A24A",
  meta: "#212529",
  restante: "#D97706",
  label: "#6C757D",
  buttonWater: "#17A24A",
  buttonActivity: "#007BFF",
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
        height: "match_parent",
        flexDirection: "column",
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        justifyContent: "space-between",
      }}
    >
      {/* 1. Cabecera */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TextWidget
          text="Progreso de hidratación"
          style={{ fontSize: 12, fontWeight: "700", color: COLORS.meta }}
        />
        <TextWidget
          text="¡Vamos! Tu cuerpo necesita hidratación 💧"
          style={{
            fontSize: 8,
            color: COLORS.label,
            marginTop: 2,
          }}
        />
      </FlexWidget>

      {/* 2. Barra de progreso */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
        }}
      >
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <TextWidget
            text="Hidratación efectiva"
            style={{ fontSize: 9, fontWeight: "600", color: COLORS.meta }}
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
              backgroundColor: COLORS.consumido,
              width: `${porcentaje}%`,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 3. Tarjeta interna de estadísticas */}
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
        }}
      >
        {/* Columna Consumido */}
        <FlexWidget style={{ alignItems: "center", flex: 1 }}>
          <TextWidget
            text={`${consumido} ml`}
            style={{ fontSize: 9, fontWeight: "700", color: COLORS.consumido }}
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
            style={{ fontSize: 9, fontWeight: "700", color: COLORS.meta }}
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
            style={{ fontSize: 9, fontWeight: "700", color: COLORS.restante }}
          />
          <TextWidget
            text="Restante"
            style={{ fontSize: 7, color: COLORS.label, marginTop: 1 }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 4. Botones de acción flotantes */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FlexWidget
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: COLORS.buttonWater,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 24,
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
