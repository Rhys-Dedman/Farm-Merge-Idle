/**
 * Player preferences that survive game save clears / progress resets.
 */
import { GAME_SAVE_STORAGE_KEY } from './gameSave';
import type { ReminderCopyCategory } from '../constants/localNotificationSettings';
import { REMINDER_COPY_POOLS } from '../constants/localNotificationSettings';

export const USER_PREFS_STORAGE_KEY = 'pocket-garden-user-prefs-v1';

export type UserPrefs = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  fakeNotchPreviewEnabled: boolean;
  /** Player wants OS return reminders (local notifications). */
  returnRemindersEnabled: boolean;
  /** We already showed the OS permission prompt (or skipped on web). */
  returnRemindersPermissionAsked: boolean;
  /** Epoch ms when return reminders were delivered (for max-per-day). */
  returnReminderDeliveryAts: number[];
  /** Last delivered copy category (avoid same type twice in a row). */
  returnReminderLastCategory: ReminderCopyCategory | null;
  /** Recently used bodies (avoid repeats). */
  returnReminderRecentBodies: string[];
  /** When the app last went to background (for ad-break return policy). */
  adBreakLastBackgroundAt: number;
};

const DEFAULT_USER_PREFS: UserPrefs = {
  musicEnabled: true,
  sfxEnabled: true,
  fakeNotchPreviewEnabled: false,
  returnRemindersEnabled: true,
  returnRemindersPermissionAsked: false,
  returnReminderDeliveryAts: [],
  returnReminderLastCategory: null,
  returnReminderRecentBodies: [],
  adBreakLastBackgroundAt: 0,
};

function normalizeCategory(raw: unknown): ReminderCopyCategory | null {
  if (typeof raw !== 'string') return null;
  return raw in REMINDER_COPY_POOLS ? (raw as ReminderCopyCategory) : null;
}

function normalizeUserPrefs(raw: unknown): UserPrefs {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const deliveriesRaw = o.returnReminderDeliveryAts;
  const returnReminderDeliveryAts = Array.isArray(deliveriesRaw)
    ? deliveriesRaw.filter((t): t is number => typeof t === 'number' && Number.isFinite(t))
    : DEFAULT_USER_PREFS.returnReminderDeliveryAts;
  const recentRaw = o.returnReminderRecentBodies;
  const returnReminderRecentBodies = Array.isArray(recentRaw)
    ? recentRaw.filter((t): t is string => typeof t === 'string' && t.length > 0)
    : DEFAULT_USER_PREFS.returnReminderRecentBodies;
  return {
    musicEnabled: typeof o.musicEnabled === 'boolean' ? o.musicEnabled : DEFAULT_USER_PREFS.musicEnabled,
    sfxEnabled: typeof o.sfxEnabled === 'boolean' ? o.sfxEnabled : DEFAULT_USER_PREFS.sfxEnabled,
    fakeNotchPreviewEnabled:
      typeof o.fakeNotchPreviewEnabled === 'boolean'
        ? o.fakeNotchPreviewEnabled
        : DEFAULT_USER_PREFS.fakeNotchPreviewEnabled,
    returnRemindersEnabled:
      typeof o.returnRemindersEnabled === 'boolean'
        ? o.returnRemindersEnabled
        : DEFAULT_USER_PREFS.returnRemindersEnabled,
    returnRemindersPermissionAsked:
      typeof o.returnRemindersPermissionAsked === 'boolean'
        ? o.returnRemindersPermissionAsked
        : DEFAULT_USER_PREFS.returnRemindersPermissionAsked,
    returnReminderDeliveryAts,
    returnReminderLastCategory: normalizeCategory(o.returnReminderLastCategory),
    returnReminderRecentBodies,
    adBreakLastBackgroundAt:
      typeof o.adBreakLastBackgroundAt === 'number' && Number.isFinite(o.adBreakLastBackgroundAt)
        ? o.adBreakLastBackgroundAt
        : DEFAULT_USER_PREFS.adBreakLastBackgroundAt,
  };
}

/** One-time migration from game save audio flags when prefs file does not exist yet. */
function migrateAudioFromGameSave(): Pick<UserPrefs, 'musicEnabled' | 'sfxEnabled'> | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GAME_SAVE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      musicEnabled:
        typeof data.musicEnabled === 'boolean' ? data.musicEnabled : DEFAULT_USER_PREFS.musicEnabled,
      sfxEnabled: typeof data.sfxEnabled === 'boolean' ? data.sfxEnabled : DEFAULT_USER_PREFS.sfxEnabled,
    };
  } catch {
    return null;
  }
}

export function loadUserPrefs(): UserPrefs {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_USER_PREFS };
  try {
    const raw = localStorage.getItem(USER_PREFS_STORAGE_KEY);
    if (raw) return normalizeUserPrefs(JSON.parse(raw));
  } catch {
    /* corrupt — fall through to migration / defaults */
  }
  const migrated = migrateAudioFromGameSave();
  if (migrated) {
    const prefs: UserPrefs = { ...DEFAULT_USER_PREFS, ...migrated };
    persistUserPrefs(prefs);
    return prefs;
  }
  return { ...DEFAULT_USER_PREFS };
}

export function persistUserPrefs(patch: Partial<UserPrefs>): void {
  if (typeof localStorage === 'undefined') return;
  const next = { ...loadUserPrefs(), ...patch };
  try {
    localStorage.setItem(USER_PREFS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

/**
 * Soft “Reset Game”: restore player toggles to defaults (music/SFX/notifications ON).
 * Does not touch Rate Us dismiss keys (those live in rateUsDismiss storage).
 */
export function resetUserPrefsTogglesToDefaults(): void {
  persistUserPrefs({
    musicEnabled: DEFAULT_USER_PREFS.musicEnabled,
    sfxEnabled: DEFAULT_USER_PREFS.sfxEnabled,
    returnRemindersEnabled: DEFAULT_USER_PREFS.returnRemindersEnabled,
  });
}
