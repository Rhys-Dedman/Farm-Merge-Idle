/**
 * Subtle device haptics for Pocket Garden.
 * Chill / casual — Light impact + selection ticks only; never Heavy/Medium spam.
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { loadUserPrefs } from './userPrefs';

export type HapticKind = 'tap' | 'soft' | 'success';

let hapticsEnabled = true;

const MIN_GAP_MS: Record<HapticKind, number> = {
  tap: 50,
  soft: 90,
  success: 220,
};

const lastFiredAt: Record<HapticKind, number> = {
  tap: 0,
  soft: 0,
  success: 0,
};

export function getHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

/** Hydrate from prefs before first interaction (splash / early boot). */
export function applySavedHapticsSettingsEarly(): boolean {
  const prefs = loadUserPrefs();
  hapticsEnabled = prefs.hapticsEnabled;
  return hapticsEnabled;
}

function canFire(kind: HapticKind): boolean {
  if (!hapticsEnabled) return false;
  const now = Date.now();
  if (now - lastFiredAt[kind] < MIN_GAP_MS[kind]) return false;
  lastFiredAt[kind] = now;
  return true;
}

function runSafe(fn: () => Promise<void>): void {
  try {
    void fn().catch(() => {});
  } catch {
    /* web / unsupported */
  }
}

/** Softest tick — UI taps, seed plant, harvest, soft declines. */
export function hapticTap(): void {
  if (!canFire('tap')) return;
  runSafe(async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.selectionChanged();
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(8);
    }
  });
}

/** Gentle bump — merges, unlocks, door open, goal complete tick. */
export function hapticSoft(): void {
  if (!canFire('soft')) return;
  runSafe(async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(12);
    }
  });
}

/** Soft celebration — claims, level-up, discovery, trophy (still Light-only). */
export function hapticSuccess(): void {
  if (!canFire('success')) return;
  runSafe(async () => {
    if (Capacitor.isNativePlatform()) {
      // Prefer Light over Notification Success — quieter for a chill farm feel.
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([8, 30, 8]);
    }
  });
}

export function haptic(kind: HapticKind): void {
  if (kind === 'tap') hapticTap();
  else if (kind === 'soft') hapticSoft();
  else hapticSuccess();
}
