/**
 * Multi-coin reward burst: explode from a point, settle, then stagger-suck to the wallet.
 * Particle flight is handled by `GoalCoinParticle` when `burst` is set on the data.
 */
import type { GoalCoinBurstSuckPath, GoalCoinParticleData } from '../components/GoalCoinParticle';

export const COIN_BURST_COUNT_LOW = 5;
export const COIN_BURST_COUNT_MID = 9;
export const COIN_BURST_COUNT_HIGH = 15;
/** Below this payout → `COIN_BURST_COUNT_LOW` particles. */
export const COIN_BURST_COUNT_REWARD_LOW = 100;
/** At/above this payout → `COIN_BURST_COUNT_HIGH` particles. */
export const COIN_BURST_COUNT_REWARD_HIGH = 1000;

/** Radial explode travel (viewport / FX-layer px). */
export const COIN_BURST_EXPLODE_DIST_MIN_PX = 28;
export const COIN_BURST_EXPLODE_DIST_MAX_PX = 118;
/** Per-coin explode duration range — wider = more velocity variety. */
export const COIN_BURST_EXPLODE_MS_MIN = 200;
export const COIN_BURST_EXPLODE_MS_MAX = 480;
/** Keep crawling outward after explode before suck stagger (still moving, very slow). */
export const COIN_BURST_DRIFT_MS = 120;
/** Tiny delay between each coin starting its wallet suck. */
export const COIN_BURST_SUCK_STAGGER_MS = 25;

/**
 * Discrete particle counts by payout tier:
 * <100 → 5, 100–999 → 9, ≥1000 → 15.
 */
export function coinBurstParticleCount(rewardValue: number): number {
  const v = Math.max(0, rewardValue);
  if (v < COIN_BURST_COUNT_REWARD_LOW) return COIN_BURST_COUNT_LOW;
  if (v < COIN_BURST_COUNT_REWARD_HIGH) return COIN_BURST_COUNT_MID;
  return COIN_BURST_COUNT_HIGH;
}

function splitRewardValues(total: number, count: number): number[] {
  if (count <= 0) return [];
  if (total <= 0) return Array.from({ length: count }, () => 0);
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

export interface BuildCoinBurstParticlesArgs {
  startX: number;
  startY: number;
  rewardValue: number;
  idPrefix?: string;
  /** Wallet flight path after explode. Default popup left→up. */
  suckPath?: GoalCoinBurstSuckPath;
  /** Extra fields copied onto every particle (e.g. skipHappyCustomerRoll). */
  particleExtras?: Partial<
    Pick<GoalCoinParticleData, 'skipHappyCustomerRoll' | 'skipDoubleCoinsMultiplier'>
  >;
}

/** Build N burst particles that sum to `rewardValue`, exploding around (startX, startY). */
export function buildCoinBurstParticles({
  startX,
  startY,
  rewardValue,
  idPrefix = 'coin-burst',
  suckPath = 'popup',
  particleExtras,
}: BuildCoinBurstParticlesArgs): GoalCoinParticleData[] {
  const count = coinBurstParticleCount(rewardValue);
  const values = splitRewardValues(rewardValue, count);
  const stamp = Date.now();
  const angleOffset = Math.random() * Math.PI * 2;

  return values.map((value, i) => {
    const angle = angleOffset + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
    const dist =
      COIN_BURST_EXPLODE_DIST_MIN_PX +
      Math.random() * (COIN_BURST_EXPLODE_DIST_MAX_PX - COIN_BURST_EXPLODE_DIST_MIN_PX);
    const explodeMs =
      COIN_BURST_EXPLODE_MS_MIN +
      Math.random() * (COIN_BURST_EXPLODE_MS_MAX - COIN_BURST_EXPLODE_MS_MIN);
    return {
      id: `${idPrefix}-${stamp}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      startX,
      startY,
      value,
      /** Odd coins 1-indexed (1st, 3rd, 5th…) — covers every listed SFX pattern. */
      burstImpactSfx: i % 2 === 0,
      ...particleExtras,
      burst: {
        endX: startX + Math.cos(angle) * dist,
        endY: startY + Math.sin(angle) * dist,
        explodeMs,
        driftMs: COIN_BURST_DRIFT_MS,
        suckDelayMs: i * COIN_BURST_SUCK_STAGGER_MS,
        suckPath,
      },
    };
  });
}
