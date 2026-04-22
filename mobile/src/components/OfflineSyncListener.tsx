import React from "react";
import { useAuth } from "../context/AuthContext";
import { useSyncOffline } from "../hooks/useSyncOffline";

/**
 * Monta el listener de red + sync offline solo con sesión activa.
 * No renderiza UI.
 */
export default function OfflineSyncListener(): null {
  const { token, user } = useAuth();
  const enabled = Boolean(token && user);
  useSyncOffline(enabled, user?.id ?? null);
  return null;
}
