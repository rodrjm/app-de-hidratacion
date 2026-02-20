import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

interface HydrationWidgetProps {
  consumido: number;
  meta: number;
}

export function HydrationWidget({ consumido, meta }: HydrationWidgetProps) {
  const restante = Math.max(0, meta - consumido);
  const progreso = meta > 0 ? Math.min(100, Math.round((consumido / meta) * 100)) : 0;

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        flexDirection: "column",
        padding: 12,
        backgroundColor: "#F3F7F8", // primary-50
        borderRadius: 16,
      }}
    >
      <TextWidget
        text="Hidratación de hoy"
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: "#111827", // neutral-900
          marginBottom: 4,
        }}
      />

      {/* Fila de resumen: Consumido / Meta / Restante */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <FlexWidget
          style={{
            flexDirection: "column",
            flex: 1,
          }}
        >
          <TextWidget
            text="Consumido"
            style={{
              fontSize: 10,
              color: "#6B7280", // neutral-500
            }}
          />
          <TextWidget
            text={`${consumido} ml`}
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#059669", // verde
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: "column",
            flex: 1,
            alignItems: "center",
          }}
        >
          <TextWidget
            text="Meta diaria"
            style={{
              fontSize: 10,
              color: "#6B7280",
            }}
          />
          <TextWidget
            text={`${meta} ml`}
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#111827", // neutral-900
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: "column",
            flex: 1,
            alignItems: "flex-end",
          }}
        >
          <TextWidget
            text="Restante"
            style={{
              fontSize: 10,
              color: "#6B7280",
            }}
          />
          <TextWidget
            text={`${restante} ml`}
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#1F2937", // neutral-800
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Barra de progreso simple */}
      <FlexWidget
        style={{
          height: 6,
          borderRadius: 999,
          backgroundColor: "#E5E7EB", // neutral-200
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <FlexWidget
          style={{
            height: "match_parent",
            width: `${progreso}%`,
            borderRadius: 999,
            backgroundColor:
              progreso >= 100
                ? "#B1DCCF" // chart-500
                : progreso >= 80
                ? "#16A34A" // secondary-600
                : "#007BFF", // accent-500
          }}
        />
      </FlexWidget>

      {/* Botones de acción */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {/* Agua (verde) */}
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: "#17A24A", // secondary
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: "dosisvital://add-water" }}
        >
          <TextWidget
            text="💧 Agua"
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          />
        </FlexWidget>

        {/* Actividad (azul) */}
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: "#007BFF", // accent
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: "dosisvital://add-activity" }}
        >
          <TextWidget
            text="🚶 Actividad"
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

