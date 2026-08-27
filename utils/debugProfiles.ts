/**
 * Named QA save snapshots for Debug Menu → Profiles.
 */
import { GAME_SAVE_STORAGE_KEY, loadGameSaveV2, persistGameSaveV2 } from './gameSave';

const PROFILES_KEY = 'pocket-garden-debug-profiles-v1';

export type DebugProfile = {
  name: string;
  savedAt: number;
  saveJson: string;
};

function readAll(): DebugProfile[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is DebugProfile =>
        !!p &&
        typeof p === 'object' &&
        typeof (p as DebugProfile).name === 'string' &&
        typeof (p as DebugProfile).saveJson === 'string',
    );
  } catch {
    return [];
  }
}

function writeAll(profiles: DebugProfile[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.slice(0, 20)));
  } catch {
    /* quota */
  }
}

export function listDebugProfiles(): DebugProfile[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveDebugProfile(name: string): boolean {
  const save = loadGameSaveV2();
  if (!save) return false;
  const trimmed = name.trim() || `Snapshot ${new Date().toLocaleString()}`;
  const next = readAll().filter((p) => p.name !== trimmed);
  next.push({ name: trimmed, savedAt: Date.now(), saveJson: JSON.stringify(save) });
  writeAll(next);
  return true;
}

export function loadDebugProfile(name: string): boolean {
  const hit = readAll().find((p) => p.name === name);
  if (!hit) return false;
  try {
    const data = JSON.parse(hit.saveJson) as NonNullable<ReturnType<typeof loadGameSaveV2>>;
    persistGameSaveV2(data);
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export function deleteDebugProfile(name: string): void {
  writeAll(readAll().filter((p) => p.name !== name));
}

export function exportCurrentSaveJson(): string {
  const save = loadGameSaveV2();
  if (save) return JSON.stringify(save, null, 2);
  try {
    return localStorage.getItem(GAME_SAVE_STORAGE_KEY) ?? '{}';
  } catch {
    return '{}';
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function importSaveJsonAndReload(json: string): boolean {
  try {
    const data = JSON.parse(json) as NonNullable<ReturnType<typeof loadGameSaveV2>>;
    if (!data || typeof data !== 'object') return false;
    persistGameSaveV2(data);
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}
