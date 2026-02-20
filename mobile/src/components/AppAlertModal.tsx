import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type AppAlertVariant = "activity" | "premium" | "danger" | "success";

export interface AppAlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  /** "destructive" = estilo rojo; "cancel" = secundario; por defecto = primario según variant */
  style?: "cancel" | "destructive";
}

export interface AppAlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant: AppAlertVariant;
  /** Si no se pasan buttons, se muestra un solo botón "Entendido" que cierra. */
  buttons?: AppAlertButton[];
}

const VARIANT_STYLES: Record<
  AppAlertVariant,
  { bg: string; border: string; icon: string; iconName: keyof typeof Ionicons.glyphMap; primaryBg: string; primaryText: string }
> = {
  activity: {
    bg: "#E6F2FF",
    border: "#007BFF",
    icon: "#007BFF",
    iconName: "fitness",
    primaryBg: "#007BFF",
    primaryText: "#FFFFFF",
  },
  premium: {
    bg: "#FFFBEB",
    border: "#D97706",
    icon: "#D97706",
    iconName: "star",
    primaryBg: "#D97706",
    primaryText: "#FFFFFF",
  },
  danger: {
    bg: "#FCE4E6",
    border: "#DC3545",
    icon: "#DC3545",
    iconName: "warning",
    primaryBg: "#DC3545",
    primaryText: "#FFFFFF",
  },
  success: {
    bg: "#E8F5ED",
    border: "#17A24A",
    icon: "#17A24A",
    iconName: "checkmark-circle",
    primaryBg: "#17A24A",
    primaryText: "#FFFFFF",
  },
};

export default function AppAlertModal({
  visible,
  onClose,
  title,
  message,
  variant,
  buttons,
}: AppAlertModalProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.88, 360);
  const stylesheet = VARIANT_STYLES[variant];
  const list = buttons && buttons.length > 0 ? buttons : [{ text: "Entendido", onPress: onClose }];

  const handlePress = (btn: AppAlertButton) => {
    const run = async () => {
      onClose();
      if (btn.onPress) {
        try {
          await btn.onPress();
        } catch (_) {
          // El llamador puede mostrar otro alert en caso de error
        }
      }
    };
    run();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlayWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={styles.overlay} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[styles.card, { width: cardWidth, backgroundColor: stylesheet.bg, borderColor: stylesheet.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: stylesheet.bg }]}>
              <Ionicons name={stylesheet.iconName} size={32} color={stylesheet.icon} />
            </View>
            <Text className="text-lg font-display font-bold text-neutral-800 text-center mt-2">
              {title}
            </Text>
            <Text className="text-sm text-neutral-600 text-center mt-2 px-1">
              {message}
            </Text>
            <View style={styles.buttonsRow}>
              {list.map((btn, i) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive";
                const bg = isDestructive
                  ? "#DC3545"
                  : isCancel
                    ? "#E9ECEF"
                    : stylesheet.primaryBg;
                const textColor = isCancel ? "#495057" : "#FFFFFF";
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handlePress(btn)}
                    style={[styles.button, { backgroundColor: bg }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.buttonText, { color: textColor }]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
