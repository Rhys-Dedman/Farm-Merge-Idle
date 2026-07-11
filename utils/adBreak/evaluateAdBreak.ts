import type { FtueStageId } from '../../ftue/ftueConfig';
import { AD_BREAK_SETTINGS } from '../../constants/adBreakSettings';
import type { AdBreakTriggerId } from '../../constants/adBreakSettings';

export interface AdBreakRuntimeState {
  lastAdBreakAt: number;
  lastRewardedAdAt: number;
  activePlaytimeMs: number;
  fallbackPending: boolean;
  /** Epoch ms until which all ad breaks are blocked (session return grace). Not persisted. */
  graceUntil: number;
}

export interface AdBreakBlockerContext {
  now: number;
  playerLevel: number;
  activePlaytimeMs: number;
  hasNoAds: boolean;
  isDragging: boolean;
  isLoading: boolean;
  activeFtueStage: FtueStageId | null;
  ftue11StartQueued: boolean;
  collectionFtueActive: boolean;
  tasksFtueActive: boolean;
  gardensFtueActive: boolean;
  newGardenFtueActive: boolean;
  adPresentationActive: boolean;
  gardenSwitchActive: boolean;
  offlineEarningsOpen: boolean;
  /** From `AdBreakRuntimeState.graceUntil` - session return buffer. */
  returnGraceUntil: number;
  /** Player is on the Store screen - never show interstitial ads here. */
  inStore: boolean;
  pauseMenuOpen: boolean;
  devToolsOpen: boolean;
  blockingPopupOpen: boolean;
  discoveryPopupOpen: boolean;
  levelUpPopupOpen: boolean;
  goldenPotBonusesPopupOpen: boolean;
}

/** Start / extend the post-return grace window (load finish, offline earnings close). */
export function bumpAdBreakReturnGrace(state: AdBreakRuntimeState, now: number): void {
  state.graceUntil = Math.max(state.graceUntil, now + AD_BREAK_SETTINGS.returnGraceMs);
  state.fallbackPending = false;
}

export function isAdBreakUnlockGateOpen(ctx: AdBreakBlockerContext): boolean {
  return (
    ctx.playerLevel >= AD_BREAK_SETTINGS.minPlayerLevel ||
    ctx.activePlaytimeMs >= AD_BREAK_SETTINGS.minActivePlaytimeMs
  );
}

export function getAdBreakBlockers(
  ctx: AdBreakBlockerContext,
  trigger?: AdBreakTriggerId,
): string[] {
  const blockers: string[] = [];
  if (ctx.hasNoAds) blockers.push('no_ads_active');
  if (!isAdBreakUnlockGateOpen(ctx)) blockers.push('unlock_gate');
  if (ctx.isLoading) blockers.push('loading');
  if (ctx.activeFtueStage != null) blockers.push('main_ftue');
  if (ctx.ftue11StartQueued) blockers.push('ftue11_queued');
  if (ctx.collectionFtueActive) blockers.push('collection_ftue');
  if (ctx.tasksFtueActive) blockers.push('tasks_ftue');
  if (ctx.gardensFtueActive) blockers.push('gardens_ftue');
  if (ctx.newGardenFtueActive) blockers.push('new_garden_ftue');
  if (ctx.isDragging) blockers.push('dragging_plant');
  if (ctx.adPresentationActive) blockers.push('ad_presentation');
  if (ctx.gardenSwitchActive) blockers.push('garden_switch');
  if (ctx.offlineEarningsOpen) blockers.push('offline_earnings');
  if (ctx.now < ctx.returnGraceUntil) blockers.push('return_grace');
  if (ctx.inStore) blockers.push('in_store');
  if (ctx.pauseMenuOpen) blockers.push('pause_menu');
  if (ctx.devToolsOpen) blockers.push('dev_tools');
  if (ctx.blockingPopupOpen) blockers.push('blocking_popup');
  if (ctx.discoveryPopupOpen && trigger !== 'discovery_add') blockers.push('discovery_popup');
  if (ctx.levelUpPopupOpen && trigger !== 'level_up_continue') blockers.push('level_up_popup');
  if (ctx.goldenPotBonusesPopupOpen && trigger !== 'collection_bonus_close') {
    blockers.push('golden_pot_bonuses_popup');
  }
  return blockers;
}

export function areAdBreakBlockersClear(
  ctx: AdBreakBlockerContext,
  trigger?: AdBreakTriggerId,
): boolean {
  return getAdBreakBlockers(ctx, trigger).length === 0;
}

export function isAdBreakCooldownReady(
  state: AdBreakRuntimeState,
  now: number,
): boolean {
  if (state.lastAdBreakAt > 0 && now - state.lastAdBreakAt < AD_BREAK_SETTINGS.cooldownMs) {
    return false;
  }
  if (
    state.lastRewardedAdAt > 0 &&
    now - state.lastRewardedAdAt < AD_BREAK_SETTINGS.rewardedBufferMs
  ) {
    return false;
  }
  return true;
}

export function shouldFlagAdBreakFallback(
  state: AdBreakRuntimeState,
  now: number,
): boolean {
  if (state.lastAdBreakAt <= 0) return false;
  const maxIntervalMs =
    AD_BREAK_SETTINGS.maxIntervalMs ??
    AD_BREAK_SETTINGS.cooldownMs * AD_BREAK_SETTINGS.maxIntervalCooldownMultiplier;
  return now - state.lastAdBreakAt >= maxIntervalMs;
}

export function canShowAdBreakNow(
  state: AdBreakRuntimeState,
  ctx: AdBreakBlockerContext,
  trigger: AdBreakTriggerId,
): boolean {
  if (!areAdBreakBlockersClear(ctx, trigger)) return false;
  return isAdBreakCooldownReady(state, ctx.now);
}
