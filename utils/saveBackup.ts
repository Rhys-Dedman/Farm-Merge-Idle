/**
 * Level-up checkpoint backups (local only).
 *
 * Main save updates continuously. On each player level-up (any garden), we store
 * a rolling set of full V2 snapshots. If the primary save is corrupt/unreadable,
 * we try the newest checkpoint first, then older ones, before wiping to a fresh start.
 */

import {
  GAME_SAVE_V2_VERSION,
  type GameSaveV2,
} from './gardenSave';
import { DEFAULT_GARDEN_ID } from '../constants/gardens';

export const LEVEL_UP_BACKUP_STORAGE_KEY = 'pocket-garden-save-level-backups-v1';
/** Keep the last N level-up checkpoints (newest first). */
export const LEVEL_UP_BACKUP_MAX_SLOTS = 3;

export type LevelUpBackupSlot = {
  savedAt: number;
  /** e.g. garden_1@12 — debug / support only */
  label: string;
  save: GameSaveV2;
};

type LevelUpBackupStore = {
  v: 1;
  slots: LevelUpBackupSlot[];
};

function coerceBackupSave(data: unknown): GameSaveV2 | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as GameSaveV2;
  if (d.v !== GAME_SAVE_V2_VERSION) return null;
  const gardens = d.gardens && typeof d.gardens === 'object' ? d.gardens : null;
  if (!gardens?.[DEFAULT_GARDEN_ID]?.grid) return null;
  return d;
}

function readBackupStore(): LevelUpBackupStore {
  if (typeof localStorage === 'undefined') return { v: 1, slots: [] };
  try {
    const raw = localStorage.getItem(LEVEL_UP_BACKUP_STORAGE_KEY);
    if (!raw) return { v: 1, slots: [] };
    const parsed = JSON.parse(raw) as LevelUpBackupStore;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.slots)) {
      return { v: 1, slots: [] };
    }
    const slots = parsed.slots
      .map((slot): LevelUpBackupSlot | null => {
        if (!slot || typeof slot !== 'object') return null;
        const save = coerceBackupSave(slot.save);
        if (!save) return null;
        return {
          savedAt: typeof slot.savedAt === 'number' ? slot.savedAt : 0,
          label: typeof slot.label === 'string' ? slot.label : 'checkpoint',
          save,
        };
      })
      .filter((s): s is LevelUpBackupSlot => s != null);
    return { v: 1, slots };
  } catch {
    return { v: 1, slots: [] };
  }
}

function writeBackupStore(store: LevelUpBackupStore): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LEVEL_UP_BACKUP_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

/** Push a full multi-garden V2 snapshot after a level-up. Newest is index 0. */
export function writeLevelUpBackupSave(save: GameSaveV2, label: string): void {
  const coerced = coerceBackupSave(save);
  if (!coerced) return;
  const store = readBackupStore();
  const nextSlot: LevelUpBackupSlot = {
    savedAt: Date.now(),
    label,
    save: coerced,
  };
  const slots = [nextSlot, ...store.slots].slice(0, LEVEL_UP_BACKUP_MAX_SLOTS);
  writeBackupStore({ v: 1, slots });
}

/**
 * Try checkpoints newest → oldest. Returns the first valid save, or null.
 * Does not write to the main save key — caller should persist if restoring.
 */
export function tryLoadLevelUpBackupSaves(): GameSaveV2 | null {
  const { slots } = readBackupStore();
  for (const slot of slots) {
    const save = coerceBackupSave(slot.save);
    if (save) return save;
  }
  return null;
}

export function clearLevelUpBackupSaves(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(LEVEL_UP_BACKUP_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
