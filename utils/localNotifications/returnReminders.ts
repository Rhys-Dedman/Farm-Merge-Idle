/**
 * Capacitor local-notification bridge for return reminders.
 * Safe no-op on web / when the plugin is unavailable.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  LOCAL_NOTIFICATION_CHANNEL,
  RETURN_REMINDER_NOTIFICATION_IDS,
  isReturnReminderNotificationId,
} from '../../constants/localNotificationSettings';
import { loadUserPrefs, persistUserPrefs } from '../userPrefs';
import {
  buildReturnReminderPlan,
  pruneReturnReminderDeliveries,
} from './buildReturnReminderPlan';
import {
  appendRecentReminderBody,
  parseReminderCopyCategory,
} from './pickReturnReminderCopy';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

let channelReady = false;
let deliveryListenerReady = false;

export function isLocalNotificationsSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!isLocalNotificationsSupported()) return 'unsupported';
  try {
    const result = await LocalNotifications.checkPermissions();
    const display = result.display;
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unsupported';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isLocalNotificationsSupported()) return 'unsupported';
  try {
    const result = await LocalNotifications.requestPermissions();
    const display = result.display;
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unsupported';
  }
}

export async function ensureLocalNotificationChannel(): Promise<void> {
  if (!isLocalNotificationsSupported() || channelReady) return;
  if (Capacitor.getPlatform() !== 'android') {
    channelReady = true;
    return;
  }
  try {
    await LocalNotifications.createChannel({
      id: LOCAL_NOTIFICATION_CHANNEL.id,
      name: LOCAL_NOTIFICATION_CHANNEL.name,
      description: LOCAL_NOTIFICATION_CHANNEL.description,
      importance: LOCAL_NOTIFICATION_CHANNEL.importance,
      visibility: LOCAL_NOTIFICATION_CHANNEL.visibility,
      vibration: LOCAL_NOTIFICATION_CHANNEL.vibration,
    });
    channelReady = true;
  } catch {
    /* channel may already exist */
    channelReady = true;
  }
}

function recordReturnReminderDelivery(notification: {
  id: number;
  body?: string;
  extra?: Record<string, unknown>;
}): void {
  const now = Date.now();
  const prefs = loadUserPrefs();
  const nextDeliveries = pruneReturnReminderDeliveries(
    [...prefs.returnReminderDeliveryAts, now],
    now,
  );
  const category = parseReminderCopyCategory(notification.extra?.category);
  const body =
    typeof notification.body === 'string' && notification.body.length > 0
      ? notification.body
      : typeof notification.extra?.body === 'string'
        ? notification.extra.body
        : null;

  persistUserPrefs({
    returnReminderDeliveryAts: nextDeliveries,
    ...(category ? { returnReminderLastCategory: category } : {}),
    ...(body
      ? { returnReminderRecentBodies: appendRecentReminderBody(prefs.returnReminderRecentBodies, body) }
      : {}),
  });
}

/** Listen for delivered return reminders so the per-day cap stays accurate. */
export async function ensureReturnReminderDeliveryListener(): Promise<void> {
  if (!isLocalNotificationsSupported() || deliveryListenerReady) return;
  deliveryListenerReady = true;
  try {
    await LocalNotifications.addListener('localNotificationReceived', (notification) => {
      const id = notification.id;
      if (isReturnReminderNotificationId(id)) {
        recordReturnReminderDelivery({
          id,
          body: notification.body,
          extra: (notification.extra ?? undefined) as Record<string, unknown> | undefined,
        });
      }
    });
  } catch {
    deliveryListenerReady = false;
  }
}

export async function cancelReturnReminders(): Promise<void> {
  if (!isLocalNotificationsSupported()) return;
  try {
    const notifications = RETURN_REMINDER_NOTIFICATION_IDS.map((id) => ({ id }));
    await LocalNotifications.cancel({ notifications });
  } catch {
    /* ignore */
  }
}

/**
 * Cancel pending return reminders, then schedule the day 0–15 weighted drip
 * (quiet hours, max 2/day, pooled copy, silent channel).
 */
export async function scheduleReturnReminders(now: number = Date.now()): Promise<void> {
  if (!isLocalNotificationsSupported()) return;
  const prefs = loadUserPrefs();
  if (!prefs.returnRemindersEnabled) {
    await cancelReturnReminders();
    return;
  }
  const status = await getNotificationPermissionStatus();
  if (status !== 'granted') return;

  await ensureLocalNotificationChannel();
  await ensureReturnReminderDeliveryListener();
  await cancelReturnReminders();

  const deliveries = pruneReturnReminderDeliveries(prefs.returnReminderDeliveryAts, now);
  if (deliveries.length !== prefs.returnReminderDeliveryAts.length) {
    persistUserPrefs({ returnReminderDeliveryAts: deliveries });
  }

  const plan = buildReturnReminderPlan(now, deliveries, {
    lastCategory: prefs.returnReminderLastCategory,
    recentBodies: prefs.returnReminderRecentBodies,
  });
  if (plan.length === 0) return;

  try {
    await LocalNotifications.schedule({
      notifications: plan.map((item) => ({
        id: item.notificationId,
        title: item.title,
        body: item.body,
        schedule: {
          at: new Date(item.atMs),
          allowWhileIdle: true,
        },
        channelId: LOCAL_NOTIFICATION_CHANNEL.id,
        smallIcon: 'ic_stat_pocket_garden',
        iconColor: '#92c14c',
        extra: {
          reminderKind: item.kind,
          category: item.category,
          body: item.body,
          dayOffset: item.dayOffset,
        },
      })),
    });
  } catch {
    /* ignore schedule failures (exact-alarm restrictions, etc.) */
  }
}

/**
 * After main FTUE: ask once for notification permission (if reminders enabled).
 * Persists `returnRemindersPermissionAsked` so we don't re-prompt.
 */
export async function tryRequestPermissionOnceAfterFtue(): Promise<void> {
  if (!isLocalNotificationsSupported()) return;
  const prefs = loadUserPrefs();
  if (!prefs.returnRemindersEnabled) return;
  if (prefs.returnRemindersPermissionAsked) return;

  persistUserPrefs({ returnRemindersPermissionAsked: true });
  await ensureLocalNotificationChannel();
  await ensureReturnReminderDeliveryListener();
  await requestNotificationPermission();
}
