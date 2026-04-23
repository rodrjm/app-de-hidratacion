import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ActividadForm, ConsumoForm } from "../types";

/** Consumo en cola offline: payload de API + dueño del registro. */
export type PendingConsumoForm = ConsumoForm & { userId: number | string };

/** Actividad en cola offline: payload de sync + dueño del registro. */
export type PendingActivityForm = ActividadForm & {
  userId: number | string;
  latitude?: number;
  longitude?: number;
  tz?: string;
};

interface OfflineStoreState {
  pendingConsumos: PendingConsumoForm[];
  pendingActivities: PendingActivityForm[];
  addPendingConsumo: (item: PendingConsumoForm) => void;
  addPendingActivity: (item: PendingActivityForm) => void;
  clearPendingConsumos: () => void;
  clearPendingActivities: () => void;
  /** Quita exactamente los ítems enviados en un bulk exitoso (mismas referencias o igualdad por contenido). */
  removePendingConsumosBatch: (items: PendingConsumoForm[]) => void;
  removePendingActivitiesBatch: (items: PendingActivityForm[]) => void;
}

function toStableComparable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toStableComparable);
  }
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return Object.keys(rec)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = toStableComparable(rec[key]);
        return acc;
      }, {});
  }
  return value;
}

function fingerprintItem<T extends object>(item: T): string {
  return JSON.stringify(toStableComparable(item));
}

export const useOfflineStore = create<OfflineStoreState>()(
  persist(
    (set) => ({
      pendingConsumos: [],
      pendingActivities: [],
      addPendingConsumo: (item) =>
        set((s) => ({ pendingConsumos: [...s.pendingConsumos, item] })),
      addPendingActivity: (item) =>
        set((s) => ({ pendingActivities: [...s.pendingActivities, item] })),
      clearPendingConsumos: () => set({ pendingConsumos: [] }),
      clearPendingActivities: () => set({ pendingActivities: [] }),
      removePendingConsumosBatch: (items) => {
        if (items.length === 0) return;
        const refs = new Set(items);
        const hashes = new Set(items.map((item) => fingerprintItem(item)));
        set((s) => ({
          pendingConsumos: s.pendingConsumos.filter(
            (c) => !refs.has(c) && !hashes.has(fingerprintItem(c)),
          ),
        }));
      },
      removePendingActivitiesBatch: (items) => {
        if (items.length === 0) return;
        const refs = new Set(items);
        const hashes = new Set(items.map((item) => fingerprintItem(item)));
        set((s) => ({
          pendingActivities: s.pendingActivities.filter(
            (a) => !refs.has(a) && !hashes.has(fingerprintItem(a)),
          ),
        }));
      },
    }),
    {
      name: "dosisvital-offline-queue",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pendingConsumos: state.pendingConsumos,
        pendingActivities: state.pendingActivities,
      }),
    },
  ),
);

/** Filtra ítems válidos (con userId) y del usuario actual. */
export function filterPendingForUser<T extends { userId?: number | string }>(
  items: T[],
  currentUserId: number | string,
): T[] {
  return items.filter(
    (x) =>
      x.userId != null &&
      String(x.userId).length > 0 &&
      String(x.userId) === String(currentUserId),
  );
}
