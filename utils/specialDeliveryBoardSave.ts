/**
 * Special Delivery board persistence: the dealt rewards + which doors are already open.
 * Opened doors must survive reloads until their reward is claimed.
 */
import { GARDEN_IDS, isGardenId, type GardenId } from '../constants/gardens';
import type { SpecialDeliveryReward } from './specialDeliveryRewards';

const BOARD_STORAGE_PREFIX = 'special-delivery-board-v1';

export interface SpecialDeliveryBoardSave {
  v: 1;
  rewards: SpecialDeliveryReward[];
  openedDoorIndices: number[];
}

export function getSpecialDeliveryBoardStorageKey(gardenId: GardenId): string {
  return `${BOARD_STORAGE_PREFIX}-${gardenId}`;
}

function isReward(value: unknown, fallbackGardenId: GardenId): value is SpecialDeliveryReward {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<SpecialDeliveryReward> & {
    upgradeId?: unknown;
    offerId?: unknown;
    amount?: unknown;
    plantLevel?: unknown;
    revealIconSrc?: unknown;
    gardenId?: unknown;
  };
  if (typeof r.iconSrc !== 'string') return false;
  switch (r.kind) {
    case 'upgrade':
      return typeof r.upgradeId === 'string';
    case 'booster':
      return typeof r.offerId === 'string';
    case 'coins':
      return typeof r.amount === 'number';
    case 'keys':
      return typeof r.amount === 'number';
    case 'trophy':
      return (
        typeof r.plantLevel === 'number' &&
        typeof r.revealIconSrc === 'string' &&
        (r.gardenId == null || isGardenId(r.gardenId))
      );
    default:
      return false;
  }
}

/** Stamp missing gardenId on legacy upgrade/coin doors so claim routing still works. */
function normalizeReward(
  reward: SpecialDeliveryReward,
  fallbackGardenId: GardenId,
): SpecialDeliveryReward {
  if (reward.kind === 'upgrade' && !isGardenId((reward as { gardenId?: unknown }).gardenId)) {
    return { ...reward, gardenId: fallbackGardenId };
  }
  if (reward.kind === 'coins' && !isGardenId((reward as { gardenId?: unknown }).gardenId)) {
    return { ...reward, gardenId: fallbackGardenId };
  }
  if (reward.kind === 'trophy' && !isGardenId(reward.gardenId)) {
    return { ...reward, gardenId: fallbackGardenId };
  }
  return reward;
}

export function readSpecialDeliveryBoard(
  gardenId: GardenId,
  expectedDoorCount: number,
): SpecialDeliveryBoardSave | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getSpecialDeliveryBoardStorageKey(gardenId));
    if (!raw) return null;
    const data = JSON.parse(raw) as SpecialDeliveryBoardSave;
    if (data?.v !== 1 || !Array.isArray(data.rewards) || !Array.isArray(data.openedDoorIndices)) {
      return null;
    }
    if (data.rewards.length !== expectedDoorCount) return null;
    if (!data.rewards.every((r) => isReward(r, gardenId))) return null;
    const rewards = data.rewards.map((r) => normalizeReward(r, gardenId));
    const openedDoorIndices = data.openedDoorIndices.filter(
      (i) => Number.isInteger(i) && i >= 0 && i < expectedDoorCount,
    );
    return { v: 1, rewards, openedDoorIndices };
  } catch {
    return null;
  }
}

export function writeSpecialDeliveryBoard(
  gardenId: GardenId,
  save: SpecialDeliveryBoardSave,
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(getSpecialDeliveryBoardStorageKey(gardenId), JSON.stringify(save));
  } catch {
    /* ignore */
  }
}

export function clearSpecialDeliveryBoard(gardenId: GardenId): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(getSpecialDeliveryBoardStorageKey(gardenId));
  } catch {
    /* ignore */
  }
}

export function clearAllSpecialDeliveryBoardStorage(): void {
  if (typeof localStorage === 'undefined') return;
  for (const id of GARDEN_IDS) {
    clearSpecialDeliveryBoard(id);
  }
}
