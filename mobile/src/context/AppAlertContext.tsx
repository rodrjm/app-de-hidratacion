import React, { createContext, useContext, useState, useCallback } from "react";
import AppAlertModal, {
  type AppAlertVariant,
  type AppAlertButton,
} from "../components/AppAlertModal";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  variant: AppAlertVariant;
  buttons: AppAlertButton[] | undefined;
}

const initialState: AlertState = {
  visible: false,
  title: "",
  message: "",
  variant: "success",
  buttons: undefined,
};

type ShowAlertOptions = {
  title: string;
  message: string;
  variant?: AppAlertVariant;
};

type ShowConfirmOptions = {
  title: string;
  message: string;
  variant?: AppAlertVariant;
  buttons: AppAlertButton[];
};

interface AppAlertContextValue {
  showAlert: (opts: ShowAlertOptions) => void;
  showConfirm: (opts: ShowConfirmOptions) => void;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState>(initialState);

  const close = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const showAlert = useCallback((opts: ShowAlertOptions) => {
    setState({
      visible: true,
      title: opts.title,
      message: opts.message,
      variant: opts.variant ?? "success",
      buttons: undefined,
    });
  }, []);

  const showConfirm = useCallback((opts: ShowConfirmOptions) => {
    setState({
      visible: true,
      title: opts.title,
      message: opts.message,
      variant: opts.variant ?? "success",
      buttons: opts.buttons,
    });
  }, []);

  return (
    <AppAlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AppAlertModal
        visible={state.visible}
        onClose={close}
        title={state.title}
        message={state.message}
        variant={state.variant}
        buttons={state.buttons}
      />
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextValue {
  const ctx = useContext(AppAlertContext);
  if (!ctx) {
    throw new Error("useAppAlert must be used within AppAlertProvider");
  }
  return ctx;
}
