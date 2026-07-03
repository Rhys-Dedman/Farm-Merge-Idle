/**
 * Sanity cap for offline surplus bank — prevents runaway totals from bugs or stacked saves.
 * Tuned generously above realistic 3h rapid-boost surplus sim at the same progression.
 */
import type { SeedsState } from '../components/UpgradeList';
import { getSeedSurplusValue } from '../components/UpgradeList';
import { MAX_OFFLINE_ACCUMULATION_MS } from './offlineSimulate';

/** Generous surplus events per recharge bar per 3h (rapid boost ≈ 27; headroom for double-seed overflow). */
const OFFLINE_MAX_SURPLUS_EVENTS_PER_BAR_PER_3H = 40;
/** Headroom for Double Coins covering the whole offline window. */
const OFFLINE_DOUBLE_COINS_HEADROOM = 2;
/** Uncollected bank may stack up to this many 3h windows. */
const OFFLINE_BANK_SESSIONS_MAX = 2;

export type OfflineEarningsCapContext = {
  highestPlantEver: number;
  seedsState: SeedsState;
  ftueSeedSurplusActivated: boolean;
  ftueHarvestSurplusActivated: boolean;
};

function surplusSeedsStateForCap(
  seedsState: SeedsState,
  ftueSeedSurplusActivated: boolean,
): SeedsState {
  if (!ftueSeedSurplusActivated) return seedsState;
  return {
    ...seedsState,
    seed_surplus: {
      level: Math.max(1, seedsState?.seed_surplus?.level ?? 0),
      progress: 0,
    },
  };
}

/** Max raw coins allowed in `pendingOfflineEarnings` for this garden progression. */
export function getMaxOfflineEarningsBank(ctx: OfflineEarningsCapContext): number {
  if (!ctx.ftueSeedSurplusActivated && !ctx.ftueHarvestSurplusActivated) return 0;

  const surplusPerEvent = getSeedSurplusValue(
    surplusSeedsStateForCap(ctx.seedsState, ctx.ftueSeedSurplusActivated),
    Math.max(1, ctx.highestPlantEver),
  );
  if (surplusPerEvent <= 0) return 0;

  const activeBars =
    (ctx.ftueSeedSurplusActivated ? 1 : 0) + (ctx.ftueHarvestSurplusActivated ? 1 : 0);
  const perThreeHours =
    surplusPerEvent *
    OFFLINE_MAX_SURPLUS_EVENTS_PER_BAR_PER_3H *
    activeBars *
    OFFLINE_DOUBLE_COINS_HEADROOM;

  return Math.max(0, Math.round(perThreeHours * OFFLINE_BANK_SESSIONS_MAX));
}

/** Cap a single offline sim slice for the elapsed window (≤ 3h). */
export function capOfflineSimSurplusCoins(
  simCoins: number,
  ctx: OfflineEarningsCapContext,
  simulatedMs: number,
): number {
  if (simCoins <= 0) return 0;
  const bankCap = getMaxOfflineEarningsBank(ctx);
  if (bankCap <= 0) return 0;

  const timeFrac = Math.min(1, Math.max(0, simulatedMs) / MAX_OFFLINE_ACCUMULATION_MS);
  const sessionCap = Math.max(1, Math.round(bankCap * 0.5 * timeFrac));
  return Math.min(simCoins, sessionCap);
}

/** Clamp total pending bank (existing + new sim) and log in dev when trimmed. */
export function clampOfflineEarningsBank(
  rawTotal: number,
  ctx: OfflineEarningsCapContext,
  debugLabel?: string,
): number {
  if (rawTotal <= 0) return 0;
  const cap = getMaxOfflineEarningsBank(ctx);
  if (cap <= 0) return 0;
  if (rawTotal <= cap) return rawTotal;

  if (import.meta.env.DEV) {
    console.warn('[offline earnings] clamped pending bank', {
      label: debugLabel ?? 'unknown',
      rawTotal,
      cap,
      highestPlantEver: ctx.highestPlantEver,
      surplusLevel: ctx.seedsState?.seed_surplus?.level ?? 0,
    });
  }
  return cap;
}
