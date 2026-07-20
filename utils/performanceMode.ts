/**
 * Performance mode: when ON, caps FPS at 30 and disables cosmetic particles/VFX for low-end devices.
 * Default is OFF. Persisted in localStorage when user toggles in settings.
 *
 * Gameplay (money, goals, unlocks, boosts) must still apply — particle components
 * short-circuit to onImpact/onComplete immediately when VFX is off.
 */

const STORAGE_KEY = 'farm-merge-performance-mode';

let performanceMode = false; // default OFF

type PerfListener = (on: boolean) => void;
const listeners = new Set<PerfListener>();

function readFromStorage(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener(performanceMode);
  }
}

/** Current value (read by animation code and harvest logic). */
export function getPerformanceMode(): boolean {
  return performanceMode;
}

/** Subscribe to Performance Mode toggles. Returns unsubscribe. */
export function subscribePerformanceMode(listener: PerfListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Cosmetic VFX (leaf bursts, flyers, beams, trails). Off in Performance Mode.
 * Prefer this over reading getPerformanceMode() at spawn sites.
 */
export function shouldPlayVfx(): boolean {
  return !performanceMode;
}

/** Popup open leaf bursts (rect perimeter / inline 40-leaf VFX). Off in performance mode. */
export function shouldPlayPopupLeafBurst(): boolean {
  return shouldPlayVfx();
}

/** Set and persist. Call when user toggles in settings. */
export function setPerformanceMode(on: boolean): void {
  performanceMode = on;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, on ? 'true' : 'false');
    }
  } catch {
    // ignore
  }
  notifyListeners();
}

/** Call once at app init. Default is OFF; only ON if user previously saved 'true' in localStorage. */
export function initPerformanceMode(): void {
  performanceMode = readFromStorage();
}
