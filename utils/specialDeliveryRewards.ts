/**
 * Special Delivery door reward dealing + copy.
 */
import { STORE_DURATION_FREE_OFFER_IDS, getOfferById } from '../offers';
import type { GardenId } from '../constants/gardens';
import { DEFAULT_GARDEN_ID, getCollectionGardenDisplayName } from '../constants/gardens';
import {
  SPECIAL_DELIVERY_DEAL_TROPHIES_ONLY_DEBUG,
  SPECIAL_DELIVERY_KEY_REWARD_AMOUNT,
  SPECIAL_DELIVERY_KEY_REWARD_ICON,
  SPECIAL_DELIVERY_LOOKALIKE_ICON_PAIRS,
  SPECIAL_DELIVERY_REWARD_COPIES_EACH,
  SPECIAL_DELIVERY_REWARD_ICON_POOL,
  SPECIAL_DELIVERY_REWARD_TYPE_COUNT,
  SPECIAL_DELIVERY_REWARD_TYPE_WEIGHTS,
  SPECIAL_DELIVERY_REWARD_COPY,
  SPECIAL_DELIVERY_UPGRADE_ID_BY_ICON,
} from '../constants/specialDeliveries';
import { getPlantData } from '../constants/plantData';
import {
  gardenHasTrophyArt,
  getTrophyDoorIconSrc,
  getTrophyIconSrc,
} from '../constants/trophies';
import { getDailyTaskSlotRewardCoins } from './dailyTaskRewards';
import {
  isUpgradeMaxedForDailyTasks,
  isUpgradeUnlockedForPlayer,
  type UpgradeGateContext,
} from './dailyTaskUpgradeGates';
import { formatCompactNumber } from './formatCompactNumber';

export type SpecialDeliveryReward =
  | { kind: 'upgrade'; gardenId: GardenId; upgradeId: string; iconSrc: string }
  | { kind: 'booster'; offerId: string; iconSrc: string }
  | { kind: 'coins'; gardenId: GardenId; iconSrc: string; amount: number }
  | { kind: 'keys'; iconSrc: string; amount: number }
  /**
   * `iconSrc` is the garden's generic trophy icon (shown on all 3 matching doors);
   * `revealIconSrc` is the real trophy that appears when they collide.
   */
  | {
      kind: 'trophy';
      gardenId: GardenId;
      plantLevel: number;
      iconSrc: string;
      revealIconSrc: string;
    };

/** Per-garden inputs used when dealing upgrades / coins across started gardens. */
export type SpecialDeliveryGardenRewardContext = {
  gardenId: GardenId;
  playerLevel: number;
  upgradeGateCtx?: UpgradeGateContext;
};

/** Distinct reward categories — at most one of each per 9-door deal. */
export type SpecialDeliveryRewardType =
  | SpecialDeliveryReward['kind'];

export type SpecialDeliveryRewardCopy = {
  headline: string;
  title: string;
  description: string;
  amountLabel: string;
};

/**
 * Returned by the claim handler when a reward runs its own presentation before the match-3
 * overlay may leave (trophies scroll the collection, then fly the trophy onto its shelf).
 */
export type SpecialDeliveryClaimPresentation = {
  /** Keep the revealed icon fully visible this long — a flying icon takes over after. */
  iconHoldMs: number;
  /** Keep the black overlay at full opacity this long. */
  overlayHoldMs: number;
  /** Overlay fade duration once the hold ends. */
  overlayFadeMs: number;
  /**
   * When true, keep the black overlay fully opaque until {@link attachOverlayRelease}'s
   * callback is invoked (then fade over {@link overlayFadeMs}). Ignores {@link overlayHoldMs}
   * for the fade start.
   */
  holdOverlayUntilReleased?: boolean;
  /** Match-3 calls this with a `release()` fn; call it on reward impact to start the fade. */
  attachOverlayRelease?: (release: () => void) => void;
};

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function gardenCoinIconRaw(gardenId: GardenId): string {
  const n =
    gardenId === 'garden_2' ? 2 : gardenId === 'garden_3' ? 3 : 1;
  return `/assets/icons/coins/icon_coin_garden_${n}.png`;
}

export function specialDeliveryRewardKey(r: SpecialDeliveryReward): string {
  if (r.kind === 'upgrade') return `upgrade:${r.gardenId}:${r.upgradeId}`;
  if (r.kind === 'booster') return `booster:${r.offerId}`;
  if (r.kind === 'trophy') return `trophy:${r.gardenId}:${r.plantLevel}`;
  if (r.kind === 'keys') return `keys:${r.amount}`;
  return `coins:${r.gardenId}:${r.amount}`;
}

/** Icon shown by the match-3 reveal — trophies swap the generic door icon for the real one. */
export function specialDeliveryRewardRevealIconSrc(r: SpecialDeliveryReward): string {
  return r.kind === 'trophy' ? r.revealIconSrc : r.iconSrc;
}

/** Front layer paired 1:1 with every free-upgrade reward icon. */
export const SPECIAL_DELIVERY_FREE_UPGRADE_OVERLAY_SRC =
  '/assets/icons/upgrades/icon_freeupgrade.png';

export function specialDeliveryRewardOverlayIconSrc(
  r: SpecialDeliveryReward,
): string | null {
  return r.kind === 'upgrade' ? SPECIAL_DELIVERY_FREE_UPGRADE_OVERLAY_SRC : null;
}

export function specialDeliveryRewardsEqual(
  a: SpecialDeliveryReward | null | undefined,
  b: SpecialDeliveryReward | null | undefined,
): boolean {
  if (!a || !b) return false;
  return specialDeliveryRewardKey(a) === specialDeliveryRewardKey(b);
}

export function formatSpecialDeliveryBoosterDuration(offerId: string): string {
  const offer = getOfferById(offerId);
  if (!offer) return '';
  if (offer.durationSeconds != null && offer.durationSeconds > 0) {
    return `${offer.durationSeconds}s`;
  }
  if (offer.durationMinutes != null && offer.durationMinutes > 0) {
    return `${offer.durationMinutes}m`;
  }
  return '';
}

export function getSpecialDeliveryRewardCopy(
  reward: SpecialDeliveryReward,
): SpecialDeliveryRewardCopy {
  if (reward.kind === 'upgrade') {
    return (
      SPECIAL_DELIVERY_REWARD_COPY[reward.iconSrc] ?? {
        headline: 'Garden Upgrade',
        title: 'Reward',
        description: 'Match 3 to win this prize',
        amountLabel: '+1 FREE',
      }
    );
  }
  if (reward.kind === 'booster') {
    const offer = getOfferById(reward.offerId);
    return {
      headline: 'Free Booster',
      title: offer?.title ?? 'Booster',
      description: offer?.description ?? 'A timed garden booster',
      amountLabel: formatSpecialDeliveryBoosterDuration(reward.offerId) || 'BOOST',
    };
  }
  if (reward.kind === 'trophy') {
    return {
      headline: 'Collection Trophy',
      title: getPlantData(reward.plantLevel, reward.gardenId).name,
      description: 'Display this trophy in your collection',
      amountLabel: 'TROPHY',
    };
  }
  if (reward.kind === 'keys') {
    return {
      headline: 'Free Keys',
      title: 'Keys',
      description: 'Open more Special Delivery doors',
      amountLabel: `+${formatCompactNumber(reward.amount)}`,
    };
  }
  return {
    headline: 'Free Coins',
    title: 'Coins',
    description: `Add coins to your ${getCollectionGardenDisplayName(reward.gardenId)} wallet`,
    amountLabel: `+${formatCompactNumber(reward.amount)}`,
  };
}

type NonTrophyRewardType = Exclude<SpecialDeliveryRewardType, 'trophy'>;

function iconFileName(src: string): string {
  const cleaned = src.split('?')[0]!.replace(/\\/g, '/');
  return cleaned.slice(cleaned.lastIndexOf('/') + 1).toLowerCase();
}

function specialDeliveryIconsLookAlike(aSrc: string, bSrc: string): boolean {
  const a = iconFileName(aSrc);
  const b = iconFileName(bSrc);
  if (a === b) return true;
  for (const [left, right] of SPECIAL_DELIVERY_LOOKALIKE_ICON_PAIRS) {
    const l = left.toLowerCase();
    const r = right.toLowerCase();
    if ((a === l && b === r) || (a === r && b === l)) return true;
  }
  return false;
}

function buildUpgradesForGarden(
  gardenId: GardenId,
  playerLevel: number,
  upgradeGateCtx?: UpgradeGateContext,
): SpecialDeliveryReward[] {
  const upgrades: SpecialDeliveryReward[] = [];
  for (const iconSrc of SPECIAL_DELIVERY_REWARD_ICON_POOL) {
    const upgradeId = SPECIAL_DELIVERY_UPGRADE_ID_BY_ICON[iconSrc];
    if (!upgradeId) continue;
    if (!isUpgradeUnlockedForPlayer(upgradeId, playerLevel, gardenId)) continue;
    if (upgradeGateCtx && isUpgradeMaxedForDailyTasks(upgradeId, upgradeGateCtx)) continue;
    upgrades.push({ kind: 'upgrade', gardenId, upgradeId, iconSrc });
  }
  return upgrades;
}

function buildCoinRewardForGarden(
  gardenId: GardenId,
  playerLevel: number,
): SpecialDeliveryReward {
  return {
    kind: 'coins',
    gardenId,
    iconSrc: gardenCoinIconRaw(gardenId),
    amount: Math.max(1, getDailyTaskSlotRewardCoins(2, Math.max(1, playerLevel))),
  };
}

function buildTypedRewardCandidates(
  gardenContexts: readonly SpecialDeliveryGardenRewardContext[],
): Record<NonTrophyRewardType, SpecialDeliveryReward[]> {
  const upgrades: SpecialDeliveryReward[] = [];
  const coins: SpecialDeliveryReward[] = [];
  for (const ctx of gardenContexts) {
    upgrades.push(
      ...buildUpgradesForGarden(ctx.gardenId, ctx.playerLevel, ctx.upgradeGateCtx),
    );
    coins.push(buildCoinRewardForGarden(ctx.gardenId, ctx.playerLevel));
  }
  const boosters: SpecialDeliveryReward[] = [];
  for (const offerId of STORE_DURATION_FREE_OFFER_IDS) {
    const offer = getOfferById(offerId);
    if (!offer) continue;
    if (
      (offer.durationSeconds == null || offer.durationSeconds <= 0) &&
      (offer.durationMinutes == null || offer.durationMinutes <= 0)
    ) {
      continue;
    }
    boosters.push({
      kind: 'booster',
      offerId,
      iconSrc: offer.headerIcon,
    });
  }
  const keys: SpecialDeliveryReward = {
    kind: 'keys',
    iconSrc: SPECIAL_DELIVERY_KEY_REWARD_ICON,
    amount: SPECIAL_DELIVERY_KEY_REWARD_AMOUNT,
  };
  return {
    upgrade: upgrades,
    booster: boosters,
    coins,
    keys: [keys],
  };
}

/**
 * Up to `count` distinct trophies the player can still win. Gardens are sampled evenly first
 * so a garden with more missing trophies isn't over-represented.
 */
function pickTrophyRewards(
  winnableTrophies: readonly { gardenId: GardenId; plantLevel: number }[],
  count: number,
): SpecialDeliveryReward[] {
  if (count <= 0) return [];
  const byGarden = new Map<GardenId, { gardenId: GardenId; plantLevel: number }[]>();
  for (const target of winnableTrophies) {
    if (!Number.isFinite(target.plantLevel) || target.plantLevel < 1) continue;
    if (!gardenHasTrophyArt(target.gardenId)) continue;
    if (!getTrophyDoorIconSrc(target.gardenId)) continue;
    const key = `${target.gardenId}:${target.plantLevel}`;
    const list = byGarden.get(target.gardenId) ?? [];
    if (list.some((t) => `${t.gardenId}:${t.plantLevel}` === key)) continue;
    list.push({ gardenId: target.gardenId, plantLevel: target.plantLevel });
    byGarden.set(target.gardenId, list);
  }
  const picked: { gardenId: GardenId; plantLevel: number }[] = [];
  const gardenBags = [...byGarden.entries()].map(([, targets]) => ({
    targets: shuffleInPlace([...targets]),
  }));
  while (picked.length < count && gardenBags.length > 0) {
    const bagIndex = Math.floor(Math.random() * gardenBags.length);
    const bag = gardenBags[bagIndex]!;
    const next = bag.targets.shift();
    if (next) picked.push(next);
    if (bag.targets.length === 0) gardenBags.splice(bagIndex, 1);
  }
  return picked.flatMap((target) => {
    const doorIconSrc = getTrophyDoorIconSrc(target.gardenId);
    if (!doorIconSrc) return [];
    return [
      {
        kind: 'trophy' as const,
        gardenId: target.gardenId,
        plantLevel: target.plantLevel,
        iconSrc: doorIconSrc,
        revealIconSrc: getTrophyIconSrc(target.gardenId, target.plantLevel),
      },
    ];
  });
}

function pickOneFrom<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

/** Pick a garden evenly, then a reward from that garden (keeps gardens fair when pools differ in size). */
function pickOneEvenAcrossGardens(
  rewards: readonly SpecialDeliveryReward[],
): SpecialDeliveryReward | null {
  const byGarden = new Map<GardenId, SpecialDeliveryReward[]>();
  for (const reward of rewards) {
    const gardenId =
      reward.kind === 'upgrade' || reward.kind === 'coins' || reward.kind === 'trophy'
        ? reward.gardenId
        : null;
    if (gardenId == null) continue;
    const list = byGarden.get(gardenId) ?? [];
    list.push(reward);
    byGarden.set(gardenId, list);
  }
  const gardens = [...byGarden.keys()];
  if (gardens.length === 0) {
    // Boosters / keys have no garden — fall back to a flat pick.
    return pickOneFrom(rewards);
  }
  const gardenId = gardens[Math.floor(Math.random() * gardens.length)]!;
  return pickOneFrom(byGarden.get(gardenId) ?? []);
}

function pickWeightedType(
  types: readonly SpecialDeliveryRewardType[],
  weights: Readonly<Partial<Record<SpecialDeliveryRewardType, number>>>,
): SpecialDeliveryRewardType | null {
  let total = 0;
  for (const type of types) {
    total += Math.max(0, weights[type] ?? 0);
  }
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const type of types) {
    roll -= Math.max(0, weights[type] ?? 0);
    if (roll < 0) return type;
  }
  return types[types.length - 1] ?? null;
}

/**
 * If a board has both an upgrade and a booster whose icons look too similar, replace one
 * so the three reward visuals stay distinct.
 */
function resolveLookalikeUpgradeBooster(
  picked: SpecialDeliveryReward[],
  candidates: Record<NonTrophyRewardType, SpecialDeliveryReward[]>,
): SpecialDeliveryReward[] {
  const upgradeIndex = picked.findIndex((r) => r.kind === 'upgrade');
  const boosterIndex = picked.findIndex((r) => r.kind === 'booster');
  if (upgradeIndex < 0 || boosterIndex < 0) return picked;
  const upgrade = picked[upgradeIndex]!;
  const booster = picked[boosterIndex]!;
  if (upgrade.kind !== 'upgrade' || booster.kind !== 'booster') return picked;
  if (!specialDeliveryIconsLookAlike(upgrade.iconSrc, booster.iconSrc)) return picked;

  const next = picked.slice();
  // Prefer swapping the booster — there are usually more non-conflicting options.
  const safeBoosters = candidates.booster.filter(
    (b) => b.kind === 'booster' && !specialDeliveryIconsLookAlike(upgrade.iconSrc, b.iconSrc),
  );
  const replacementBooster = pickOneFrom(safeBoosters);
  if (replacementBooster) {
    next[boosterIndex] = replacementBooster;
    return next;
  }

  const safeUpgrades = candidates.upgrade.filter(
    (u) =>
      u.kind === 'upgrade' &&
      !(
        u.gardenId === upgrade.gardenId &&
        u.upgradeId === upgrade.upgradeId
      ) &&
      !specialDeliveryIconsLookAlike(u.iconSrc, booster.iconSrc),
  );
  const replacementUpgrade = pickOneEvenAcrossGardens(safeUpgrades);
  if (replacementUpgrade) {
    next[upgradeIndex] = replacementUpgrade;
  }
  return next;
}

/**
 * Deal 9 door rewards: pick 3 distinct reward *types* using
 * {@link SPECIAL_DELIVERY_REWARD_TYPE_WEIGHTS}, one concrete reward each, 3 copies each,
 * then shuffle. Upgrades and coins may target any started garden (unlocked + not maxed),
 * sampled evenly across gardens. Avoids lookalike booster/upgrade icon pairs on the same board.
 */
export function dealSpecialDeliveryRewards(
  gardenId: GardenId = DEFAULT_GARDEN_ID,
  playerLevel = 1,
  options?: {
    /**
     * Discovered plants (any started garden) that don't have their trophy yet.
     * Prefer this over {@link winnableTrophyLevels}.
     */
    winnableTrophies?: readonly { gardenId: GardenId; plantLevel: number }[];
    /** @deprecated Prefer {@link winnableTrophyLevels}; treated as active-garden levels only. */
    winnableTrophyLevels?: readonly number[];
    /**
     * Started gardens that can receive upgrades / coins. When omitted, falls back to the
     * single `gardenId` / `playerLevel` / `upgradeGateCtx` arguments.
     */
    gardenContexts?: readonly SpecialDeliveryGardenRewardContext[];
    /** Used when {@link gardenContexts} is omitted — exclude maxed upgrades for `gardenId`. */
    upgradeGateCtx?: UpgradeGateContext;
  },
): SpecialDeliveryReward[] {
  const winnableTrophies =
    options?.winnableTrophies ??
    (options?.winnableTrophyLevels ?? []).map((plantLevel) => ({
      gardenId,
      plantLevel,
    }));
  const gardenContexts =
    options?.gardenContexts && options.gardenContexts.length > 0
      ? options.gardenContexts
      : [
          {
            gardenId,
            playerLevel,
            upgradeGateCtx: options?.upgradeGateCtx,
          },
        ];
  const candidates = buildTypedRewardCandidates(gardenContexts);

  if (SPECIAL_DELIVERY_DEAL_TROPHIES_ONLY_DEBUG) {
    const trophies = pickTrophyRewards(
      winnableTrophies,
      SPECIAL_DELIVERY_REWARD_TYPE_COUNT,
    );
    const deal: SpecialDeliveryReward[] = [];
    for (const reward of trophies) {
      for (let c = 0; c < SPECIAL_DELIVERY_REWARD_COPIES_EACH; c++) {
        deal.push(reward);
      }
    }
    return shuffleInPlace(deal);
  }

  const trophyOptions = pickTrophyRewards(winnableTrophies, 1);
  const availableTypes: SpecialDeliveryRewardType[] = (
    Object.keys(candidates) as NonTrophyRewardType[]
  ).filter((type) => candidates[type].length > 0);
  if (trophyOptions.length > 0) availableTypes.push('trophy');

  let picked: SpecialDeliveryReward[] = [];
  const remaining = [...availableTypes];
  while (picked.length < SPECIAL_DELIVERY_REWARD_TYPE_COUNT && remaining.length > 0) {
    const type = pickWeightedType(remaining, SPECIAL_DELIVERY_REWARD_TYPE_WEIGHTS);
    if (!type) break;
    const typeIndex = remaining.indexOf(type);
    if (typeIndex >= 0) remaining.splice(typeIndex, 1);

    const reward =
      type === 'trophy'
        ? trophyOptions[0] ?? null
        : type === 'upgrade' || type === 'coins'
          ? pickOneEvenAcrossGardens(candidates[type])
          : pickOneFrom(candidates[type]);
    if (reward) picked.push(reward);
  }

  picked = resolveLookalikeUpgradeBooster(picked, candidates);

  const deal: SpecialDeliveryReward[] = [];
  for (const reward of picked) {
    for (let c = 0; c < SPECIAL_DELIVERY_REWARD_COPIES_EACH; c++) {
      deal.push(reward);
    }
  }
  return shuffleInPlace(deal);
}

/** Unique placeholders so FTUE doors never false-match before pick-order assignment. */
export function createSpecialDeliveryFtuePlaceholderDeal(
  gardenId: GardenId = DEFAULT_GARDEN_ID,
): SpecialDeliveryReward[] {
  return Array.from({ length: 9 }, (_, i) => ({
    kind: 'coins' as const,
    gardenId,
    iconSrc: gardenCoinIconRaw(gardenId),
    amount: 1000 + i,
  }));
}

/**
 * Pick-order rewards for the first FTUE match (coins guaranteed).
 * Open order — not door position:
 * 1 coins · 2 reward2 · 3 coins · 4 reward3 · 5 coins
 */
export function buildSpecialDeliveryFtueCoinPickSequence(
  gardenId: GardenId,
  playerLevel: number,
  options?: {
    gardenContexts?: readonly SpecialDeliveryGardenRewardContext[];
    upgradeGateCtx?: UpgradeGateContext;
  },
): SpecialDeliveryReward[] {
  const gardenContexts =
    options?.gardenContexts && options.gardenContexts.length > 0
      ? options.gardenContexts
      : [{ gardenId, playerLevel, upgradeGateCtx: options?.upgradeGateCtx }];
  const candidates = buildTypedRewardCandidates(gardenContexts);
  const coins = buildCoinRewardForGarden(gardenId, playerLevel);
  const reward2 =
    pickOneFrom(candidates.booster) ??
    pickOneEvenAcrossGardens(candidates.upgrade) ??
    candidates.keys[0]!;
  const reward3 =
    pickOneEvenAcrossGardens(
      candidates.upgrade.filter((u) => !specialDeliveryRewardsEqual(u, reward2)),
    ) ??
    pickOneFrom(candidates.booster.filter((b) => !specialDeliveryRewardsEqual(b, reward2))) ??
    candidates.keys[0]!;
  return [coins, reward2, coins, reward3, coins];
}

/**
 * Pick-order rewards for the second FTUE match (plant-1 garden-1 trophy guaranteed).
 * Open order:
 * 1 reward1 · 2 trophy · 3 reward2 · 4 reward1 · 5 trophy · 6 trophy
 */
export function buildSpecialDeliveryFtueTrophyPickSequence(
  gardenId: GardenId,
  playerLevel: number,
  trophy: { gardenId: GardenId; plantLevel: number },
  options?: {
    gardenContexts?: readonly SpecialDeliveryGardenRewardContext[];
    upgradeGateCtx?: UpgradeGateContext;
  },
): SpecialDeliveryReward[] {
  const gardenContexts =
    options?.gardenContexts && options.gardenContexts.length > 0
      ? options.gardenContexts
      : [{ gardenId, playerLevel, upgradeGateCtx: options?.upgradeGateCtx }];
  const candidates = buildTypedRewardCandidates(gardenContexts);
  const doorIcon = getTrophyDoorIconSrc(trophy.gardenId);
  const revealIcon = getTrophyIconSrc(trophy.gardenId, trophy.plantLevel);
  if (!doorIcon || !revealIcon) {
    // Fallback — still return a coins sequence so FTUE never hard-crashes.
    const coins = buildCoinRewardForGarden(gardenId, playerLevel);
    return [coins, coins, coins];
  }
  const trophyReward: SpecialDeliveryReward = {
    kind: 'trophy',
    gardenId: trophy.gardenId,
    plantLevel: trophy.plantLevel,
    iconSrc: doorIcon,
    revealIconSrc: revealIcon,
  };
  const reward1 =
    pickOneEvenAcrossGardens(candidates.upgrade) ??
    pickOneFrom(candidates.booster) ??
    candidates.keys[0]!;
  const reward2 =
    pickOneFrom(candidates.booster.filter((b) => !specialDeliveryRewardsEqual(b, reward1))) ??
    pickOneEvenAcrossGardens(
      candidates.upgrade.filter((u) => !specialDeliveryRewardsEqual(u, reward1)),
    ) ??
    candidates.keys[0]!;
  return [reward1, trophyReward, reward2, reward1, trophyReward, trophyReward];
}
