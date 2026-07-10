import { GARDEN_PICKER_PURCHASE_COIN_PRICE } from '../constants/gardenPicker';
import {
  DEFAULT_GARDEN_ID,
  GARDEN_IDS,
  isShippedGardenId,
  type GardenId,
} from '../constants/gardens';
import { assetPath } from './assetPath';
import type { GardenState } from '../types/gardenState';

export type GardensFloatingButtonVisual = 'locked' | 'normal' | 'claim';

const GARDENS_FB_ICON_PATHS: Record<GardensFloatingButtonVisual, string> = {
  locked: '/assets/icons/floating_buttons/icon_fb_gardens_locked.png',
  normal: '/assets/icons/floating_buttons/icon_fb_gardens.png',
  claim: '/assets/icons/floating_buttons/icon_fb_gardens_claim.png',
};

function getPreviousGardenId(gardenId: GardenId): GardenId {
  const index = GARDEN_IDS.indexOf(gardenId);
  if (index <= 0) return DEFAULT_GARDEN_ID;
  return GARDEN_IDS[index - 1] ?? DEFAULT_GARDEN_ID;
}

/** Next garden the player can purchase (not started, previous garden owned, shipped). */
export function getNextPurchasableGardenId(gardensStarted: readonly GardenId[]): GardenId | null {
  for (const gardenId of GARDEN_IDS) {
    if (!isShippedGardenId(gardenId)) continue;
    if (gardensStarted.includes(gardenId)) continue;
    const index = GARDEN_IDS.indexOf(gardenId);
    if (index > 0 && !gardensStarted.includes(GARDEN_IDS[index - 1]!)) continue;
    return gardenId;
  }
  return null;
}

export function getGardenPurchasePayerGardenId(nextGardenId: GardenId): GardenId {
  return getPreviousGardenId(nextGardenId);
}

function getPayerMoney(
  payerGardenId: GardenId,
  activeGardenId: GardenId,
  activeMoney: number,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): number {
  if (payerGardenId === activeGardenId) return activeMoney;
  return gardens?.[payerGardenId]?.money ?? 0;
}

export function canAffordNextGardenPurchase(
  gardensStarted: readonly GardenId[],
  activeGardenId: GardenId,
  activeMoney: number,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): boolean {
  const nextGardenId = getNextPurchasableGardenId(gardensStarted);
  if (nextGardenId == null) return false;
  const payerGardenId = getGardenPurchasePayerGardenId(nextGardenId);
  const payerMoney = getPayerMoney(payerGardenId, activeGardenId, activeMoney, gardens);
  return payerMoney >= GARDEN_PICKER_PURCHASE_COIN_PRICE;
}

export function getGardensFloatingButtonIconSrc(visual: GardensFloatingButtonVisual): string {
  return assetPath(GARDENS_FB_ICON_PATHS[visual]);
}

/** True when the gardens picker may be opened (level gate, or already on / owns another garden). */
export function isGardensFloatingButtonUnlocked(
  garden1PlayerLevel: number,
  unlockLevel: number,
  gardensStarted: readonly GardenId[],
  activeGardenId: GardenId,
): boolean {
  if (activeGardenId !== DEFAULT_GARDEN_ID) return true;
  if (gardensStarted.length > 1) return true;
  return garden1PlayerLevel >= unlockLevel;
}

export function getGardensFloatingButtonVisual(
  garden1PlayerLevel: number,
  unlockLevel: number,
  gardensStarted: readonly GardenId[],
  activeGardenId: GardenId,
  activeMoney: number,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  forceLockedVisual = false,
): GardensFloatingButtonVisual {
  if (
    forceLockedVisual &&
    activeGardenId === DEFAULT_GARDEN_ID &&
    isGardensFloatingButtonUnlocked(garden1PlayerLevel, unlockLevel, gardensStarted, activeGardenId)
  ) {
    return 'locked';
  }
  if (!isGardensFloatingButtonUnlocked(garden1PlayerLevel, unlockLevel, gardensStarted, activeGardenId)) {
    return 'locked';
  }
  if (canAffordNextGardenPurchase(gardensStarted, activeGardenId, activeMoney, gardens)) {
    return 'claim';
  }
  return 'normal';
}
