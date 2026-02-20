import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Recordatorio } from "../types";

/**
 * NOTA SOBRE EL WARNING DE NOTIFICACIONES:
 * 
 * Si ves un warning sobre "Android Push notifications (remote notifications) functionality 
 * provided by expo-notifications was removed from Expo Go with the release of SDK 53", 
 * esto es NORMAL y NO afecta las notificaciones locales que estamos usando.
 * 
 * Este servicio utiliza SOLO notificaciones locales programadas (local scheduled notifications)
 * para los recordatorios de hidratación, que SÍ funcionan en Expo Go.
 * 
 * El warning se refiere únicamente a notificaciones push remotas (remote push notifications),
 * que requieren un development build. Nuestras notificaciones locales funcionan correctamente.
 */

// Configurar el comportamiento de las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Servicio para manejar notificaciones locales de recordatorios
 */
class NotificationService {
  /**
   * Solicita permisos de notificaciones al usuario
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("[Notifications] Permisos denegados");
        return false;
      }

      // En Android, también necesitamos solicitar el canal de notificaciones
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Recordatorios de hidratación",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#10b981",
        });
      }

      return true;
    } catch (error) {
      console.error("[Notifications] Error solicitando permisos:", error);
      return false;
    }
  }

  /**
   * Cancela todas las notificaciones programadas para un recordatorio específico
   */
  async cancelReminderNotifications(recordatorioId: number): Promise<void> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const toCancel = allNotifications.filter(
        (n) => n.identifier.startsWith(`reminder_${recordatorioId}_`),
      );

      for (const notification of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log(
        `[Notifications] Canceladas ${toCancel.length} notificaciones para recordatorio ${recordatorioId}`,
      );
    } catch (error) {
      console.error("[Notifications] Error cancelando notificaciones:", error);
    }
  }

  /**
   * Programa notificaciones para un recordatorio
   */
  async scheduleReminderNotifications(recordatorio: Recordatorio): Promise<void> {
    try {
      // Primero cancelamos las notificaciones existentes si las hay
      await this.cancelReminderNotifications(recordatorio.id);

      // Verificar permisos
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn("[Notifications] Sin permisos para programar notificaciones");
        return;
      }

      // Parsear la hora (formato HH:MM)
      const [hours, minutes] = recordatorio.hora.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.error(`[Notifications] Hora inválida: ${recordatorio.hora}`);
        return;
      }

      // Determinar días de la semana según frecuencia
      let diasProgramar: number[] = [];

      if (recordatorio.frecuencia === "diario") {
        // Todos los días de la semana (1-7, donde 1=Lunes, 7=Domingo)
        diasProgramar = [1, 2, 3, 4, 5, 6, 7];
      } else if (recordatorio.frecuencia === "dias_laborales") {
        // Lunes a Viernes
        diasProgramar = [1, 2, 3, 4, 5];
      } else if (recordatorio.frecuencia === "fines_semana") {
        // Sábado y Domingo
        diasProgramar = [6, 7];
      } else if (recordatorio.frecuencia === "personalizado") {
        // Usar los días específicos del recordatorio
        diasProgramar = recordatorio.dias_semana || [];
      }

      // Si no hay días seleccionados, no programamos nada
      if (diasProgramar.length === 0) {
        console.warn("[Notifications] No hay días seleccionados para programar");
        return;
      }

      // Programar una notificación para cada día seleccionado
      // Expo Notifications usa días de la semana donde 1=Lunes, 7=Domingo (igual que el backend)
      // Así que podemos usar directamente los valores del backend
      const notifications: string[] = [];

      for (const diaExpo of diasProgramar) {
        // Crear el contenido de la notificación
        const mensaje = recordatorio.mensaje || "¡Es hora de hidratarte! 💧";
        const titulo = this.getNotificationTitle(recordatorio.tipo_recordatorio);

        // Configurar el trigger recurrente (semanal)
        // Expo usa 1=Lunes, 7=Domingo (igual que el backend)
        const trigger: Notifications.NotificationTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: diaExpo,
          hour: hours,
          minute: minutes,
        };

        const identifier = `reminder_${recordatorio.id}_${diaExpo}`;

        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: titulo,
            body: mensaje,
            sound: recordatorio.sonido === "default" ? true : recordatorio.sonido,
            data: {
              recordatorioId: recordatorio.id,
              tipo: recordatorio.tipo_recordatorio,
            },
          },
          trigger,
        });

        notifications.push(identifier);
      }

      console.log(
        `[Notifications] Programadas ${notifications.length} notificaciones para recordatorio ${recordatorio.id}`,
      );
    } catch (error) {
      console.error("[Notifications] Error programando notificaciones:", error);
    }
  }

  /**
   * Obtiene el título de la notificación según el tipo de recordatorio
   */
  private getNotificationTitle(tipo: string): string {
    switch (tipo) {
      case "agua":
        return "💧 Recordatorio de agua";
      case "meta":
        return "🎯 Recordatorio de meta";
      case "personalizado":
        return "⏰ Recordatorio personalizado";
      default:
        return "💧 Recordatorio de hidratación";
    }
  }

  /**
   * Cancela todas las notificaciones programadas
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("[Notifications] Todas las notificaciones canceladas");
    } catch (error) {
      console.error("[Notifications] Error cancelando todas las notificaciones:", error);
    }
  }

  /**
   * Obtiene todas las notificaciones programadas
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("[Notifications] Error obteniendo notificaciones programadas:", error);
      return [];
    }
  }

  /**
   * Sincroniza las notificaciones con los recordatorios del usuario (CRUD recordatorios)
   * Útil cuando se usan recordatorios por entidad.
   */
  async syncReminders(recordatorios: Recordatorio[]): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;
      await this.cancelAllNotifications();
      for (const recordatorio of recordatorios) {
        if (recordatorio.activo !== false) {
          await this.scheduleReminderNotifications(recordatorio);
        }
      }
      console.log(`[Notifications] Sincronizadas ${recordatorios.length} recordatorios`);
    } catch (error) {
      console.error("[Notifications] Error sincronizando recordatorios:", error);
    }
  }

  /**
   * Cancela solo las notificaciones de intervalo de hidratación (perfil usuario)
   */
  async cancelIntervalReminders(): Promise<void> {
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      const toCancel = all.filter((n) => n.identifier.startsWith("hydration_interval_"));
      for (const n of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
      if (toCancel.length > 0) {
        console.log(`[Notifications] Canceladas ${toCancel.length} notificaciones de intervalo`);
      }
    } catch (error) {
      console.error("[Notifications] Error cancelando notificaciones de intervalo:", error);
    }
  }

  /**
   * Programa recordatorios según preferencias del perfil: hora_inicio, hora_fin, intervalo (min).
   * El usuario no crea recordatorios; solo activa/desactiva y elige horario e intervalo.
   */
  async syncFromUserProfile(options: {
    recordar_notificaciones: boolean;
    hora_inicio: string;
    hora_fin: string;
    intervalo_notificaciones: number;
  }): Promise<void> {
    try {
      await this.cancelIntervalReminders();
      if (!options.recordar_notificaciones) {
        console.log("[Notifications] Recordatorios desactivados en perfil");
        return;
      }
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn("[Notifications] Sin permisos para programar notificaciones");
        return;
      }
      const parseTime = (t: string) => {
        const parts = t.trim().split(":");
        const h = parseInt(parts[0], 10) || 8;
        const m = parseInt(parts[1], 10) || 0;
        return h * 60 + m;
      };
      const minInicio = parseTime(options.hora_inicio);
      const minFinRaw = parseTime(options.hora_fin);
      let endMinutes = minFinRaw;
      if (endMinutes <= minInicio) endMinutes += 24 * 60;
      const startMinutes = minInicio;
      const interval = Math.max(15, Math.min(480, options.intervalo_notificaciones || 60));
      const slots: { hour: number; minute: number }[] = [];
      for (let t = startMinutes; t < endMinutes; t += interval) {
        const total = t % (24 * 60);
        slots.push({ hour: Math.floor(total / 60), minute: total % 60 });
      }
      const channelId = Platform.OS === "android" ? "default" : undefined;
      for (let i = 0; i < slots.length; i++) {
        const { hour, minute } = slots[i];
        await Notifications.scheduleNotificationAsync({
          identifier: `hydration_interval_${i}`,
          content: {
            title: "💧 Recordatorio de hidratación",
            body: "Es un buen momento para tomar agua.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            ...(channelId ? { channelId } : {}),
          },
        });
      }
      console.log(`[Notifications] Programadas ${slots.length} notificaciones de intervalo`);
    } catch (error) {
      console.error("[Notifications] Error sincronizando desde perfil:", error);
    }
  }
}

export const notificationService = new NotificationService();
