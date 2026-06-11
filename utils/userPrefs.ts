/**
 * Player preferences that survive game save clears / progress resets.
 */
import { GAME_SAVE_STORAGE_KEY } from './gameSave';

export const USER_PREFS_STORAGE_KEY = 'pocket-garden-user-prefs-v1';

export type UserPrefs = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  fakeNotchPreviewEnabled: boolean;
};

const DEFAULT_USER_PREFS: UserPrefs = {
  musicEnabled: true,
  sfxEnabled: true,
  fakeNotchPreviewEnabled: false,
};

function normalizeUserPrefs(raw: unknown): UserPrefs {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    musicEnabled: typeof o.musicEnabled === 'boolean' ? o.musicEnabled : DEFAULT_USER_PREFS.musicEnabled,
    sfxEnabled: typeof o.sfxEnabled === 'boolean' ? o.sfxEnabled : DEFAULT_USER_PREFS.sfxEnabled,
    fakeNotchPreviewEnabled:
      typeof o.fakeNotchPreviewEnabled === 'boolean'
        ? o.fakeNotchPreviewEnabled
        : DEFAULT_USER_PREFS.fakeNotchPreviewEnabled,
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
