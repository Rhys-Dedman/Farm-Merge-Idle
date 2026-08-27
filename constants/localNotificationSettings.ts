/**
 * Local “come back” notification tuning — edit copy / timing here.
 * Fires only on Capacitor native (Android / iOS); no-op on web.
 *
 * Rules:
 * - Day 0 soft ping ~4h after leave (pushed out of quiet hours if needed)
 * - Days 1–15 weighted drip (more early, lighter later) at morning/evening slots
 * - Quiet hours: 22:00–08:00 local (no fires)
 * - Max 2 delivered notifications per local calendar day
 * - Channel is silent / low importance (Notion)
 * - Copy pools: never same category twice in a row; morning/evening lines preferred in those slots
 */

/** Delay before the day-0 soft “come back” reminder. */
export const RETURN_REMINDER_FIRST_DELAY_MS = 4 * 60 * 60 * 1000;

/** Local hour when quiet hours begin (inclusive), 24h clock. */
export const QUIET_HOURS_START_HOUR = 22;

/** Local hour when quiet hours end (exclusive), 24h clock. */
export const QUIET_HOURS_END_HOUR = 8;

/** Preferred morning engagement hour (local). */
export const MORNING_SLOT_HOUR = 9;

/** Preferred evening engagement hour (local). */
export const EVENING_SLOT_HOUR = 19;

/** Hard cap on delivered / scheduled return reminders per local calendar day. */
export const MAX_RETURN_REMINDERS_PER_DAY = 2;

/** How many recent bodies to remember (avoid repeats). */
export const RETURN_REMINDER_RECENT_BODY_LIMIT = 12;

/**
 * Weighted drip: calendar day offset from leave day (0 = leave day).
 * Slots: `soft` = ~4h after leave; `morning` / `evening` = fixed local hours.
 * Heavier early (days 1–5), taper through day 15.
 */
export type ReminderPlanSlot = 'soft' | 'morning' | 'evening';

export const RETURN_REMINDER_DRIP_PLAN: readonly {
  day: number;
  slots: readonly ReminderPlanSlot[];
}[] = [
  { day: 0, slots: ['soft'] },
  { day: 1, slots: ['morning', 'evening'] },
  { day: 2, slots: ['morning', 'evening'] },
  { day: 3, slots: ['morning', 'evening'] },
  { day: 4, slots: ['morning', 'evening'] },
  { day: 5, slots: ['morning'] },
  { day: 6, slots: ['morning', 'evening'] },
  { day: 7, slots: ['evening'] },
  { day: 8, slots: ['morning'] },
  { day: 9, slots: ['morning'] },
  { day: 10, slots: ['evening'] },
  { day: 11, slots: ['morning'] },
  { day: 12, slots: ['morning'] },
  { day: 13, slots: ['evening'] },
  { day: 14, slots: ['morning'] },
  { day: 15, slots: ['morning'] },
];

/** Stable Capacitor notification id base (cancel/schedule range). */
export const RETURN_REMINDER_NOTIFICATION_ID_BASE = 41001;

/** Max concurrent scheduled return reminders (must cover full drip). */
export const RETURN_REMINDER_MAX_SCHEDULED = 28;

/** All ids used for cancel / delivery tracking. */
export const RETURN_REMINDER_NOTIFICATION_IDS: readonly number[] = Array.from(
  { length: RETURN_REMINDER_MAX_SCHEDULED },
  (_, i) => RETURN_REMINDER_NOTIFICATION_ID_BASE + i,
);

export function isReturnReminderNotificationId(id: number): boolean {
  return (
    id >= RETURN_REMINDER_NOTIFICATION_ID_BASE &&
    id < RETURN_REMINDER_NOTIFICATION_ID_BASE + RETURN_REMINDER_MAX_SCHEDULED
  );
}

export const RETURN_REMINDER_TITLE = 'Pocket Garden';

export type ReminderCopyCategory =
  | 'offline'
  | 'daily_tasks'
  | 'anytime'
  | 'morning'
  | 'evening';

/** Slot used when choosing which pools are allowed. */
export type ReminderCopySlot = 'soft' | 'morning' | 'evening';

/**
 * Category order = preference within the slot.
 * - morning: daily tasks first (reset vibe), then morning-only, then flexible pools
 * - evening / soft: no daily-task lines (those read as "reset/new" and can be wrong later in the day)
 */
export const REMINDER_COPY_POOLS_BY_SLOT: Record<ReminderCopySlot, readonly ReminderCopyCategory[]> = {
  soft: ['anytime', 'offline'],
  morning: ['daily_tasks', 'morning', 'anytime', 'offline'],
  evening: ['evening', 'anytime', 'offline'],
};

export const REMINDER_COPY_POOLS: Record<ReminderCopyCategory, readonly string[]> = {
  offline: [
    'Your garden kept busy for you. Coins are ready to collect!',
    'Your garden has been happily hustling up some coins for you.',
    'Your plants saved up a sunny little surprise for you.',
    'These plants are growing strong. Come collect the profits.',
    'Coins are ready to be collected!',
  ],
  daily_tasks: [
    "These daily tasks aren't going to complete themselves!",
    'These daily tasks are too complex for the plants to do themselves.',
    "Fresh daily tasks just arrived. Let's keep the garden in order.",
    'New daily tasks are blooming. Come pick a fun one!',
    'Daily tasks available! Your green thumb is invited.',
  ],
  anytime: [
    'Your garden saved you a sunny spot. Ready when you are.',
    'Long time no leaf! Your garden misses you.',
    "The sprouts held a tiny reunion. You're their honored guest.",
    'Come stretch those gardening muscles! The plants are all warmed up.',
    'These pots would love a little upgrade magic from you.',
    'The garden is missing your green thumb!',
    "Your garden's ready for a bit of merge madness!",
    'Your plants have been practicing their best leaves for you.',
  ],
  morning: [
    'Good Morning! The garden woke up sunny and ready for you.',
    'Rise and shine. The sprouts are ready for their morning trim.',
    'Upsy Daisy! The plants are already waiting for you.',
    'Your sunflowers are blooming bright this morning.',
    "Everyone's awake and ready! Except the cactus.",
  ],
  evening: [
    'Evening check-in! Your garden could use a cozy visit.',
    "It's time to tuck the plants in for bed.",
    'The sunflowers are getting sleepy. Time to wake them up.',
    'Your garden is getting sleepy. Come sing a lullaby.',
    "Your plants are ready for the night shift. Let's get started!",
  ],
};

/**
 * Android notification channel (silent / low importance — Notion).
 * New channel id so existing installs pick up silence (Android won’t downgrade an old HIGH channel).
 */
export const LOCAL_NOTIFICATION_CHANNEL = {
  id: 'pocket_garden_return_v2_silent',
  name: 'Garden reminders',
  description: 'Quiet reminders to come back to your garden',
  /** IMPORTANCE_LOW — shows in shade, no sound */
  importance: 2,
  visibility: 1, // PUBLIC
  vibration: false,
} as const;
