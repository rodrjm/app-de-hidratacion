import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Error capturado:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-primary-50">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          >
            <View className="flex-1 items-center justify-center">
              <View className="w-16 h-16 bg-error-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="warning-outline" size={32} color="#DC2626" />
              </View>
              <Text className="text-2xl font-display font-bold text-neutral-800 text-center mb-2">
                ¡Ups! Algo salió mal
              </Text>
              <Text className="text-sm text-neutral-600 text-center mb-6">
                La aplicación encontró un error inesperado.
              </Text>

              <TouchableOpacity
                onPress={this.handleReset}
                className="bg-secondary-600 rounded-xl py-3 px-6 mb-4"
              >
                <Text className="text-white font-display font-bold text-base">
                  Intentar de nuevo
                </Text>
              </TouchableOpacity>

              {/* Mostrar siempre el error para debugging - TODO: quitar en producción final */}
              {this.state.error && (
                <View className="bg-neutral-100 rounded-lg p-4 w-full mt-4">
                  <Text className="text-xs font-bold text-error mb-2">
                    Error:
                  </Text>
                  <Text className="text-xs font-mono text-error mb-2" selectable>
                    {this.state.error.toString()}
                  </Text>
                  <Text className="text-xs font-mono text-neutral-700 mb-2" selectable>
                    {this.state.error.message}
                  </Text>
                  {this.state.errorInfo && (
                    <>
                      <Text className="text-xs font-bold text-neutral-700 mt-2 mb-1">
                        Component Stack:
                      </Text>
                      <Text className="text-xs font-mono text-neutral-600" selectable>
                        {this.state.errorInfo.componentStack?.slice(0, 800)}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
