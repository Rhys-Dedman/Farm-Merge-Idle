/**
 * External store for farm-screen burst VFX so spawning particles does not re-render App / HexBoard.
 * Consumers: FarmVfxLayer (subscribe + render); App call sites (spawn / append helpers).
 * All spawn helpers no-op when Performance Mode is on.
 */

import { getPerformanceMode, subscribePerformanceMode } from './performanceMode';

export type FarmLeafBurst = { id: string; x: number; y: number; startTime: number };

export type FarmLeafBurstSmall = FarmLeafBurst & {
  particleCount?: number;
  useCircle?: boolean;
  burstScale?: number;
};

export type FarmButtonLeafBurst = FarmLeafBurst & {
  radiusScale?: number;
  speedScale?: number;
};

export type FarmGoalCoinLeafBurst = FarmLeafBurst & {
  spriteVariant?: 'default' | 'gold';
};

export type FarmUnlockBurst = FarmLeafBurst;
export type FarmConeBurst = FarmLeafBurst & {
  spriteVariant?: 'default' | 'gold';
};

export interface FarmVfxSnapshot {
  leafBursts: FarmLeafBurst[];
  leafBurstsSmall: FarmLeafBurstSmall[];
  unlockBursts: FarmUnlockBurst[];
  masteryPurchaseConeBursts: FarmConeBurst[];
  buttonLeafBursts: FarmButtonLeafBurst[];
  goalCoinLeafBursts: FarmGoalCoinLeafBurst[];
}

const EMPTY_SNAPSHOT: FarmVfxSnapshot = {
  leafBursts: [],
  leafBurstsSmall: [],
  unlockBursts: [],
  masteryPurchaseConeBursts: [],
  buttonLeafBursts: [],
  goalCoinLeafBursts: [],
};

let snapshot: FarmVfxSnapshot = { ...EMPTY_SNAPSHOT };

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function patch(partial: Partial<FarmVfxSnapshot>): void {
  snapshot = { ...snapshot, ...partial };
  emit();
}

export function getFarmVfxSnapshot(): FarmVfxSnapshot {
  return snapshot;
}

export function subscribeFarmVfx(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Drop any in-flight farm bursts (e.g. when Performance Mode turns on). */
export function clearFarmVfx(): void {
  snapshot = { ...EMPTY_SNAPSHOT };
  emit();
}

export function spawnLeafBurst(item: FarmLeafBurst): void {
  if (getPerformanceMode()) return;
  patch({ leafBursts: [...snapshot.leafBursts, item] });
}

export function removeLeafBurst(id: string): void {
  patch({ leafBursts: snapshot.leafBursts.filter((x) => x.id !== id) });
}

export function spawnLeafBurstSmall(item: FarmLeafBurstSmall): void {
  if (getPerformanceMode()) return;
  patch({ leafBurstsSmall: [...snapshot.leafBurstsSmall, item] });
}

export function spawnLeafBurstsSmallMany(items: FarmLeafBurstSmall[]): void {
  if (getPerformanceMode() || items.length === 0) return;
  patch({ leafBurstsSmall: [...snapshot.leafBurstsSmall, ...items] });
}

export function removeLeafBurstSmall(id: string): void {
  patch({ leafBurstsSmall: snapshot.leafBurstsSmall.filter((x) => x.id !== id) });
}

export function spawnUnlockBurst(item: FarmUnlockBurst): void {
  if (getPerformanceMode()) return;
  patch({ unlockBursts: [...snapshot.unlockBursts, item] });
}

export function removeUnlockBurst(id: string): void {
  patch({ unlockBursts: snapshot.unlockBursts.filter((x) => x.id !== id) });
}

export function spawnMasteryConeBurst(item: FarmConeBurst): void {
  if (getPerformanceMode()) return;
  patch({ masteryPurchaseConeBursts: [...snapshot.masteryPurchaseConeBursts, item] });
}

export function removeMasteryConeBurst(id: string): void {
  patch({
    masteryPurchaseConeBursts: snapshot.masteryPurchaseConeBursts.filter((x) => x.id !== id),
  });
}

export function spawnButtonLeafBurst(item: FarmButtonLeafBurst): void {
  if (getPerformanceMode()) return;
  patch({ buttonLeafBursts: [...snapshot.buttonLeafBursts, item] });
}

export function removeButtonLeafBurst(id: string): void {
  patch({ buttonLeafBursts: snapshot.buttonLeafBursts.filter((x) => x.id !== id) });
}

export function spawnGoalCoinLeafBurst(item: FarmGoalCoinLeafBurst): void {
  if (getPerformanceMode()) return;
  patch({ goalCoinLeafBursts: [...snapshot.goalCoinLeafBursts, item] });
}

export function removeGoalCoinLeafBurst(id: string): void {
  patch({ goalCoinLeafBursts: snapshot.goalCoinLeafBursts.filter((x) => x.id !== id) });
}

// Clear in-flight bursts when Performance Mode turns on.
subscribePerformanceMode((on) => {
  if (on) clearFarmVfx();
});
