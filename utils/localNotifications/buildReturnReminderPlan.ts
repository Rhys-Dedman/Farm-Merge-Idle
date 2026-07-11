/**
 * Pure scheduling helpers for return reminders (local timezone).
 */
import {
  EVENING_SLOT_HOUR,
  MAX_RETURN_REMINDERS_PER_DAY,
  MORNING_SLOT_HOUR,
  QUIET_HOURS_END_HOUR,
  QUIET_HOURS_START_HOUR,
  RETURN_REMINDER_FIRST_DELAY_MS,
  RETURN_REMINDER_NOTIFICATION_IDS,
  type ReminderCopyCategory,
  type ReminderCopySlot,
} from '../../constants/localNotificationSettings';
import { pickReturnReminderCopy } from './pickReturnReminderCopy';

export type ReturnReminderKind = 'soft_4h' | 'morning' | 'evening';

export interface PlannedReturnReminder {
  notificationId: number;
  atMs: number;
  kind: ReturnReminderKind;
  category: ReminderCopyCategory;
  title: string;
  body: string;
}

export interface ReturnReminderCopyState {
  lastCategory: ReminderCopyCategory | null;
  recentBodies: readonly string[];
}

function localParts(ms: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const d = new Date(ms);
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

/** Local calendar day key `YYYY-MM-DD`. */
export function localDayKey(ms: number): string {
  const { year, month, day } = localParts(ms);
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function isInQuietHours(ms: number): boolean {
  const { hour } = localParts(ms);
  return hour >= QUIET_HOURS_START_HOUR || hour < QUIET_HOURS_END_HOUR;
}

function atLocalHourOnOffsetDay(fromMs: number, dayOffset: number, hour: number): number {
  const base = new Date(fromMs);
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, hour, 0, 0, 0);
  return d.getTime();
}

/** Next morning or evening slot strictly after `afterMs`. */
export function nextEngagementSlotAfter(afterMs: number): number {
  const slots: number[] = [];
  for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
    slots.push(atLocalHourOnOffsetDay(afterMs, dayOffset, MORNING_SLOT_HOUR));
    slots.push(atLocalHourOnOffsetDay(afterMs, dayOffset, EVENING_SLOT_HOUR));
  }
  slots.sort((a, b) => a - b);
  const next = slots.find((t) => t > afterMs);
  return next ?? slots[slots.length - 1]!;
}

/** If `ms` is in quiet hours, move to the next morning/evening slot. */
export function bumpOutOfQuietHours(ms: number): number {
  if (!isInQuietHours(ms)) return ms;
  return nextEngagementSlotAfter(ms);
}

function kindForTime(atMs: number, preferred: ReturnReminderKind): ReturnReminderKind {
  const { hour } = localParts(atMs);
  if (hour === MORNING_SLOT_HOUR) return 'morning';
  if (hour === EVENING_SLOT_HOUR) return 'evening';
  return preferred;
}

function slotForKind(kind: ReturnReminderKind): ReminderCopySlot {
  if (kind === 'morning') return 'morning';
  if (kind === 'evening') return 'evening';
  return 'soft';
}

function deliveriesOnDay(dayKey: string, deliveryAts: readonly number[]): number {
  return deliveryAts.filter((t) => localDayKey(t) === dayKey).length;
}

function canPlaceOnDay(
  atMs: number,
  deliveryAts: readonly number[],
  pendingAts: readonly number[],
): boolean {
  const day = localDayKey(atMs);
  const used = deliveriesOnDay(day, deliveryAts) + pendingAts.filter((t) => localDayKey(t) === day).length;
  return used < MAX_RETURN_REMINDERS_PER_DAY;
}

/**
 * Place `atMs` on a day that still has quota, walking forward via engagement slots if needed.
 */
function placeWithDayCap(
  atMs: number,
  deliveryAts: readonly number[],
  pendingAts: readonly number[],
): number | null {
  let t = atMs;
  for (let i = 0; i < 8; i++) {
    if (canPlaceOnDay(t, deliveryAts, pendingAts)) return t;
    t = nextEngagementSlotAfter(t);
  }
  return null;
}

/**
 * Build up to 2 return reminders from leave time `now`:
 * 1) ~4h soft (quiet-hours adjusted)
 * 2) next morning/evening slot after that
 * Respects max 2/day and avoids same copy category twice in a row.
 */
export function buildReturnReminderPlan(
  now: number,
  deliveryAts: readonly number[] = [],
  copyState: ReturnReminderCopyState = { lastCategory: null, recentBodies: [] },
): PlannedReturnReminder[] {
  const pending: number[] = [];
  const plan: PlannedReturnReminder[] = [];
  let lastCategory = copyState.lastCategory;
  const recentBodies = [...copyState.recentBodies];

  const pushPlanned = (notificationId: number, atMs: number, kind: ReturnReminderKind) => {
    const slot = slotForKind(kind);
    const picked = pickReturnReminderCopy({
      slot,
      lastCategory,
      recentBodies,
    });
    plan.push({
      notificationId,
      atMs,
      kind,
      category: picked.category,
      title: picked.title,
      body: picked.body,
    });
    lastCategory = picked.category;
    recentBodies.push(picked.body);
    pending.push(atMs);
  };

  const firstRaw = bumpOutOfQuietHours(now + RETURN_REMINDER_FIRST_DELAY_MS);
  const firstAt = placeWithDayCap(firstRaw, deliveryAts, pending);
  if (firstAt != null) {
    const kind = kindForTime(firstAt, 'soft_4h');
    pushPlanned(RETURN_REMINDER_NOTIFICATION_IDS[0], firstAt, kind);
  }

  if (plan.length === 0) return plan;

  const secondRaw = nextEngagementSlotAfter(plan[0]!.atMs);
  const secondAt = placeWithDayCap(secondRaw, deliveryAts, pending);
  if (secondAt != null) {
    const kind = kindForTime(secondAt, 'evening');
    const windowKind: ReturnReminderKind = kind === 'morning' ? 'morning' : 'evening';
    pushPlanned(RETURN_REMINDER_NOTIFICATION_IDS[1], secondAt, windowKind);
  }

  return plan.slice(0, MAX_RETURN_REMINDERS_PER_DAY);
}

/** Keep recent delivery timestamps (for per-day caps). */
export function pruneReturnReminderDeliveries(
  deliveryAts: readonly number[],
  now: number,
  retainMs: number = 3 * 24 * 60 * 60 * 1000,
): number[] {
  const cutoff = now - retainMs;
  return deliveryAts.filter((t) => t >= cutoff);
}
