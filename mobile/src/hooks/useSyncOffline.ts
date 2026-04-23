import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef } from "react";
import { DeviceEventEmitter } from "react-native";
import { activitiesService } from "../services/activities";
import { consumosService } from "../services/consumos";
import type { ConsumoForm } from "../types";
import {
  filterPendingForUser,
  useOfflineStore,
  type PendingActivityForm,
  type PendingConsumoForm,
} from "../store/useOfflineStore";

function stripConsumoForApi(row: PendingConsumoForm): ConsumoForm {
  const { userId: _u, ...rest } = row;
  return rest;
}

function stripActivityForApi(row: PendingActivityForm) {
  const { userId: _u, ...rest } = row;
  return rest;
}

/**
 * Escucha la red y, al volver la conexión, intenta subir las colas offline del usuario actual.
 * Solo quita de la cola los ítems enviados con éxito (mismo userId que la sesión).
 */
export function useSyncOffline(enabled: boolean, currentUserId: number | string | null): void {
  const syncingRef = useRef(false);
  const userIdRef = useRef(currentUserId);
  userIdRef.current = currentUserId;

  useEffect(() => {
    if (!enabled || currentUserId == null) return;

    const runSync = async () => {
      const uid = userIdRef.current;
      if (!enabled || uid == null || syncingRef.current) return;

      syncingRef.current = true;
      let didSync = false;
      try {
        console.log("[useSyncOffline] Iniciando sync offline. userId=", String(uid));
        // Descartar entradas antiguas sin userId (migración suave)
        useOfflineStore.setState((s) => ({
          pendingConsumos: s.pendingConsumos.filter(
            (c) => c.userId != null && String(c.userId).length > 0,
          ),
          pendingActivities: s.pendingActivities.filter(
            (a) => a.userId != null && String(a.userId).length > 0,
          ),
        }));

        const snapConsumos = [...useOfflineStore.getState().pendingConsumos];
        const snapActivities = [...useOfflineStore.getState().pendingActivities];
        const toSendConsumos = filterPendingForUser(snapConsumos, uid);
        const toSendActivities = filterPendingForUser(snapActivities, uid);
        console.log(
          "[useSyncOffline] Registros detectados para usuario actual:",
          `consumos=${toSendConsumos.length}`,
          `activities=${toSendActivities.length}`,
        );

        if (toSendConsumos.length === 0 && toSendActivities.length === 0) return;

        if (toSendConsumos.length > 0) {
          try {
            const body = toSendConsumos.map(stripConsumoForApi);
            await consumosService.syncOfflineConsumos(body);
            console.log(
              "[useSyncOffline] Sync consumos OK (2xx). Eliminando de cola:",
              toSendConsumos.length,
            );
            useOfflineStore.getState().removePendingConsumosBatch(toSendConsumos);
            didSync = true;
          } catch (e) {
            console.log("[useSyncOffline] Sync consumos error:", e);
            console.warn("[useSyncOffline] Falló sync de consumos (la cola no se modifica):", e);
          }
        }

        if (toSendActivities.length > 0) {
          try {
            const body = toSendActivities.map(stripActivityForApi);
            await activitiesService.syncOfflineActivities(body);
            console.log(
              "[useSyncOffline] Sync activities OK (2xx). Eliminando de cola:",
              toSendActivities.length,
            );
            useOfflineStore.getState().removePendingActivitiesBatch(toSendActivities);
            didSync = true;
          } catch (e) {
            console.log("[useSyncOffline] Sync activities error:", e);
            console.warn("[useSyncOffline] Falló sync de actividades (la cola no se modifica):", e);
          }
        }

      } finally {
        if (didSync) {
          console.log("[useSyncOffline] Emitiendo offlineSyncComplete");
        } else {
          console.log("[useSyncOffline] Emitiendo offlineSyncComplete (sin cambios enviados)");
        }
        DeviceEventEmitter.emit("offlineSyncComplete");
        syncingRef.current = false;
      }
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === true) {
        console.log("[useSyncOffline] NetInfo: ONLINE detectado por listener.");
        void runSync();
      }
    });

    void NetInfo.fetch().then((state) => {
      if (state.isConnected === true) {
        console.log("[useSyncOffline] NetInfo.fetch inicial: ONLINE.");
        void runSync();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, currentUserId]);
}
