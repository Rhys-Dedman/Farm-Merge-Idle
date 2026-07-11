/**
 * Local “come back” notification tuning — edit copy / timing here.
 * Fires only on Capacitor native (Android / iOS); no-op on web.
 *
 * Rules:
 * - Soft ping ~4h after leave (pushed out of quiet hours if needed)
 * - Follow-up at next morning (09:00) or evening (19:00) local slot
 * - Quiet hours: 22:00–08:00 local (no fires)
 * - Max 2 delivered notifications per local calendar day
 * - Copy pools: never same category twice in a row; morning/evening lines only in those slots
 */

/** Delay before the first soft “come back” reminder. */
export const RETURN_REMINDER_FIRST_DELAY_MS = 4 * 60 * 60 * 1000;

/** Local hour when quiet hours begin (inclusive), 24h clock. */
export const QUIET_HOURS_START_HOUR = 22;

/** Local hour when quiet hours end (exclusive), 24h clock. */
export const QUIET_HOURS_END_HOUR = 8;

/** Preferred morning engagement hour (local). */
export const MORNING_SLOT_HOUR = 9;

/** Preferred evening engagement hour (local). */
export const EVENING_SLOT_HOUR = 19;

/** Hard cap on delivered return reminders per local calendar day. */
export const MAX_RETURN_REMINDERS_PER_DAY = 2;

/** How many recent bodies to remember (avoid repeats). */
export const RETURN_REMINDER_RECENT_BODY_LIMIT = 12;

/** Stable Capacitor notification ids (cancel/schedule). */
export const RETURN_REMINDER_NOTIFICATION_IDS = [41001, 41002] as const;

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

/** Android notification channel (created once). */
export const LOCAL_NOTIFICATION_CHANNEL = {
  id: 'pocket_garden_return',
  name: 'Garden reminders',
  description: 'Reminders to come back to your garden',
  importance: 4, // IMPORTANCE_HIGH
  visibility: 1, // PUBLIC
} as const;
