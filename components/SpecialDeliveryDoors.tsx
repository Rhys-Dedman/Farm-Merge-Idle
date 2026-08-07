import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SPECIAL_DELIVERY_DOOR_ART_SIZE_PX,
  SPECIAL_DELIVERY_DOOR_CELL_CENTERS_ART_PX,
  SPECIAL_DELIVERY_DOOR_CLOSED_SQUASH_MS,
  SPECIAL_DELIVERY_DOOR_CLOSING_MID_MS,
  SPECIAL_DELIVERY_DOOR_HIT_HEIGHT_ART_PX,
  SPECIAL_DELIVERY_DOOR_HIT_WIDTH_ART_PX,
  SPECIAL_DELIVERY_DOOR_OPENED_CLOSE_SCALE_X_MS,
  SPECIAL_DELIVERY_DOOR_OPENED_SCALE_X_MS,
  SPECIAL_DELIVERY_DOOR_OPENED_SRC,
  SPECIAL_DELIVERY_DOOR_OPENING_HOLD_MS,
  SPECIAL_DELIVERY_DOOR_OPENING_SRC,
  SPECIAL_DELIVERY_DOOR_PIVOT_Y,
  SPECIAL_DELIVERY_KEY_HIT_BELOW_LOCK_CENTER_PX,
  SPECIAL_DELIVERY_LOCK_ART_SIZE_PX,
  SPECIAL_DELIVERY_LOCK_PIVOT_X,
  SPECIAL_DELIVERY_LOCK_PIVOT_Y,
  SPECIAL_DELIVERY_LOCK_SRC,
  SPECIAL_DELIVERY_LOCK_SWING_MS,
  SPECIAL_DELIVERY_MATCH3_PUNCH_MS,
  SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX,
  SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX,
  SPECIAL_DELIVERY_REWARD_ART_SIZE_PX,
  SPECIAL_DELIVERY_REWARD_OFFSET_Y_PX,
  SPECIAL_DELIVERY_REWARD_PIVOT_X,
  SPECIAL_DELIVERY_REWARD_PIVOT_Y,
  SPECIAL_DELIVERY_REWARD_SHADOW_OFFSET_Y_PX,
  SPECIAL_DELIVERY_REWARD_SHADOW_SRC,
  SPECIAL_DELIVERY_SHOW_DOOR_HITBOXES,
  SPECIAL_DELIVERY_SHOW_REWARD_PIVOTS,
  SPECIAL_DELIVERY_UNLOCK_SRC,
  specialDeliveryDoorPivotX,
  specialDeliveryDoorSrcForPhase,
  type SpecialDeliveryDoorPhase,
} from '../constants/specialDeliveries';
import { assetPath } from '../utils/assetPath';
import type { GardenId } from '../constants/gardens';
import { DEFAULT_GARDEN_ID } from '../constants/gardens';
import {
  dealSpecialDeliveryRewards,
  createSpecialDeliveryFtuePlaceholderDeal,
  specialDeliveryRewardOverlayIconSrc,
  specialDeliveryRewardRevealIconSrc,
  specialDeliveryRewardsEqual,
  type SpecialDeliveryClaimPresentation,
  type SpecialDeliveryGardenRewardContext,
  type SpecialDeliveryReward,
} from '../utils/specialDeliveryRewards';
import type { UpgradeGateContext } from '../utils/dailyTaskUpgradeGates';
import { SPECIAL_DELIVERY_FTUE_DOOR_HIT_ID_PREFIX } from '../constants/specialDeliveryFtue';
import {
  SpecialDeliveryKeyParticle,
  type SpecialDeliveryKeyParticleData,
} from './SpecialDeliveryKeyParticle';
import { SpecialDeliveryUnlockKnockoff } from './SpecialDeliveryUnlockKnockoff';
import {
  SpecialDeliveryMatch3,
  type SpecialDeliveryMatch3Item,
} from './SpecialDeliveryMatch3';
import { LeafBurst, LEAF_BURST_BASELINE_COUNT } from './LeafBurst';
import { getPerformanceMode } from '../utils/performanceMode';
import {
  clearSpecialDeliveryBoard,
  readSpecialDeliveryBoard,
  writeSpecialDeliveryBoard,
} from '../utils/specialDeliveryBoardSave';

const DOOR_COUNT = SPECIAL_DELIVERY_DOOR_CELL_CENTERS_ART_PX.length;

type DoorMotion = 'idle' | 'unlocking' | 'opening' | 'closing';

type DoorAnim =
  | 'none'
  | 'closed-squash-open'
  | 'opening-squash-open'
  | 'opened-settle'
  | 'opened-settle-close'
  | 'opening-squash-close';

type LockVisual = 'lock' | 'gone';

interface DoorState {
  phase: SpecialDeliveryDoorPhase;
  motion: DoorMotion;
  anim: DoorAnim;
  /** Remount key so CSS animations restart cleanly. */
  gen: number;
  /** >0 after a close completes — remounts lock with swing-in. */
  lockSwingGen: number;
  lockVisual: LockVisual;
}

interface FlyingUnlock {
  id: string;
  x: number;
  y: number;
  sizePx: number;
}

interface LockLeafBurst {
  id: string;
  x: number;
  y: number;
  startTime: number;
  particleCount: number;
  burstScale: number;
  /** Default true for lock knocks; coin-order leftovers use false (ellipse). */
  useCircle?: boolean;
}

interface Match3Flight {
  items: SpecialDeliveryMatch3Item[];
  reward: SpecialDeliveryReward;
  centerX: number;
  centerY: number;
}

interface SpecialDeliveryDoorsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Golden-pot / key wallet icon — key particle spawn. */
  keySourceIconRef: React.RefObject<HTMLElement | null>;
  appScale?: number;
  /** Active garden — coin icon + wallet reward amount. */
  gardenId?: GardenId;
  playerLevel?: number;
  /** Discovered plants (any started garden) without a trophy — the only trophies this board can deal. */
  winnableTrophies?: readonly { gardenId: GardenId; plantLevel: number }[];
  /** @deprecated Prefer {@link winnableTrophies}. */
  winnableTrophyLevels?: readonly number[];
  /**
   * Started gardens that can receive upgrades / coins (unlocked + not maxed).
   * Prefer this over a single {@link upgradeGateCtx}.
   */
  gardenContexts?: readonly SpecialDeliveryGardenRewardContext[];
  /** @deprecated Prefer {@link gardenContexts}. */
  upgradeGateCtx?: UpgradeGateContext;
  /** Spend 1 key for a door unlock. Return false if the wallet is empty. */
  onTrySpendKey?: () => boolean;
  /** Refund 1 key when an in-flight unlock is cancelled by tapping another door. */
  onRefundKey?: () => void;
  /** Empty wallet — bounce key icon + toast at the attempted door (viewport coordinates). */
  onOutOfKeys?: (point: { x: number; y: number }) => void;
  /** Grant + FX when the player claims the match-3 reward. */
  onClaimReward?: (
    reward: SpecialDeliveryReward,
    startPoint: { x: number; y: number },
    meta?: { sizePx: number },
  ) => SpecialDeliveryClaimPresentation | void;
  /**
   * FTUE pick-order rewards (open ordinal → reward). When set, each successful door tap
   * assigns the next entry regardless of door position. Board save is skipped.
   */
  ftuePickSequence?: readonly SpecialDeliveryReward[] | null;
  /** Fired once a closed door tap is accepted (key will spend / is spending). */
  onFtueDoorTap?: (doorIndex: number) => void;
  /** Fired when the match-3 reveal settles and Claim Reward becomes tappable. */
  onMatch3ClaimReady?: () => void;
  /** When true, skip localStorage board persistence (FTUE ephemeral boards). */
  suppressBoardSave?: boolean;
}

function createInitialDoors(): DoorState[] {
  return Array.from({ length: DOOR_COUNT }, () => ({
    phase: 'closed' as const,
    motion: 'idle' as const,
    anim: 'none' as const,
    gen: 0,
    lockSwingGen: 0,
    lockVisual: 'lock' as const,
  }));
}

interface LoadedBoard {
  doors: DoorState[];
  rewards: SpecialDeliveryReward[];
}

/**
 * Restore the saved board (same rewards, same doors already open) or deal a fresh one.
 * Doors opened in an earlier session stay open until their reward is claimed.
 */
function loadBoard(
  gardenId: GardenId,
  playerLevel: number,
  winnableTrophies: readonly { gardenId: GardenId; plantLevel: number }[] | undefined,
  gardenContexts: readonly SpecialDeliveryGardenRewardContext[] | undefined,
  upgradeGateCtx: UpgradeGateContext | undefined,
): LoadedBoard {
  const saved = readSpecialDeliveryBoard(gardenId, DOOR_COUNT);
  if (saved && saved.openedDoorIndices.length < DOOR_COUNT) {
    const opened = new Set(saved.openedDoorIndices);
    return {
      rewards: saved.rewards,
      doors: createInitialDoors().map((door, i) =>
        opened.has(i)
          ? {
              ...door,
              phase: 'opened' as const,
              motion: 'idle' as const,
              anim: 'none' as const,
              lockVisual: 'gone' as const,
            }
          : door,
      ),
    };
  }
  return {
    doors: createInitialDoors(),
    rewards: dealSpecialDeliveryRewards(gardenId, playerLevel, {
      winnableTrophies,
      gardenContexts,
      upgradeGateCtx,
    }),
  };
}

function artPercentX(artX: number): string {
  return `${(artX / SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX) * 100}%`;
}

function artPercentY(artY: number): string {
  return `${(artY / SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX) * 100}%`;
}

function animClassName(anim: DoorAnim): string {
  switch (anim) {
    case 'closed-squash-open':
      return 'special-delivery-door-closed-squash-open';
    case 'opening-squash-open':
      return 'special-delivery-door-opening-squash-open';
    case 'opened-settle':
      return 'special-delivery-door-opened-scale-x';
    case 'opened-settle-close':
      return 'special-delivery-door-opened-scale-x-close';
    case 'opening-squash-close':
      return 'special-delivery-door-opening-squash-close';
    default:
      return '';
  }
}

function animDurationMs(anim: DoorAnim): number | undefined {
  switch (anim) {
    case 'closed-squash-open':
      return SPECIAL_DELIVERY_DOOR_CLOSED_SQUASH_MS;
    case 'opening-squash-open':
      return SPECIAL_DELIVERY_DOOR_OPENING_HOLD_MS;
    case 'opening-squash-close':
      return SPECIAL_DELIVERY_DOOR_CLOSING_MID_MS;
    case 'opened-settle':
      return SPECIAL_DELIVERY_DOOR_OPENED_SCALE_X_MS;
    case 'opened-settle-close':
      return SPECIAL_DELIVERY_DOOR_OPENED_CLOSE_SCALE_X_MS;
    default:
      return undefined;
  }
}

/**
 * 3×3 special-delivery doors: key unlock, hidden rewards, match-3 win.
 */
export function SpecialDeliveryDoors({
  containerRef,
  keySourceIconRef,
  appScale = 1,
  gardenId = DEFAULT_GARDEN_ID,
  playerLevel = 1,
  winnableTrophyLevels,
  winnableTrophies,
  gardenContexts,
  upgradeGateCtx,
  onTrySpendKey,
  onRefundKey,
  onOutOfKeys,
  onClaimReward,
  ftuePickSequence = null,
  onFtueDoorTap,
  onMatch3ClaimReady,
  suppressBoardSave = false,
}: SpecialDeliveryDoorsProps) {
  const gardenIdRef = useRef(gardenId);
  gardenIdRef.current = gardenId;
  const playerLevelRef = useRef(playerLevel);
  playerLevelRef.current = playerLevel;
  const winnableTrophiesRef = useRef(winnableTrophies);
  winnableTrophiesRef.current = winnableTrophies;
  const winnableTrophyLevelsRef = useRef(winnableTrophyLevels);
  winnableTrophyLevelsRef.current = winnableTrophyLevels;
  const gardenContextsRef = useRef(gardenContexts);
  gardenContextsRef.current = gardenContexts;
  const upgradeGateCtxRef = useRef(upgradeGateCtx);
  upgradeGateCtxRef.current = upgradeGateCtx;
  const ftuePickSequenceRef = useRef(ftuePickSequence);
  ftuePickSequenceRef.current = ftuePickSequence;
  const ftuePickIndexRef = useRef(0);
  const onFtueDoorTapRef = useRef(onFtueDoorTap);
  onFtueDoorTapRef.current = onFtueDoorTap;
  const suppressBoardSaveRef = useRef(suppressBoardSave);
  suppressBoardSaveRef.current = suppressBoardSave;
  const dealRewards = useCallback(() => {
    // Non-null (including empty) = FTUE mode — never shuffle a real post-FTUE board yet.
    if (ftuePickSequenceRef.current != null) {
      ftuePickIndexRef.current = 0;
      return createSpecialDeliveryFtuePlaceholderDeal(gardenIdRef.current);
    }
    return dealSpecialDeliveryRewards(gardenIdRef.current, playerLevelRef.current, {
      winnableTrophies: winnableTrophiesRef.current,
      winnableTrophyLevels: winnableTrophyLevelsRef.current,
      gardenContexts: gardenContextsRef.current,
      upgradeGateCtx: upgradeGateCtxRef.current,
    });
  }, []);
  const initialBoardRef = useRef<LoadedBoard | null>(null);
  if (initialBoardRef.current == null) {
    initialBoardRef.current = loadBoard(
      gardenId,
      playerLevel,
      winnableTrophies,
      gardenContexts,
      upgradeGateCtx,
    );
  }
  const [doors, setDoors] = useState<DoorState[]>(() => initialBoardRef.current!.doors);
  const doorsRef = useRef(doors);
  doorsRef.current = doors;
  const [rewardDeal, setRewardDeal] = useState<SpecialDeliveryReward[]>(
    () => initialBoardRef.current!.rewards,
  );
  const rewardDealRef = useRef(rewardDeal);
  rewardDealRef.current = rewardDeal;
  /** Set when the 3rd matching door is tapped — blocks other unlocks from completing. */
  const pendingMatchRewardRef = useRef<SpecialDeliveryReward | null>(null);
  const lockAnchorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rewardAnchorRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** Door closed/open sprite box — geometric center for open leaf bursts. */
  const doorSpriteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [keyParticle, setKeyParticle] = useState<SpecialDeliveryKeyParticleData | null>(null);
  const [flyingUnlock, setFlyingUnlock] = useState<FlyingUnlock | null>(null);
  const [doorLeafBursts, setDoorLeafBursts] = useState<LockLeafBurst[]>([]);
  const nextDoorLeafBurstIdRef = useRef(0);
  /** Prevents double open-burst if key impact fires more than once. */
  const keyImpactHandledRef = useRef<Set<number>>(new Set());
  /** One open-door leaf burst per door until that door fully closes again. */
  const openDoorBurstSpawnedRef = useRef<Set<number>>(new Set());
  const [rewardPunchGen, setRewardPunchGen] = useState<Record<number, number>>({});
  /** Doors currently playing an open punch (class removed when anim ends). */
  const [rewardPunchAnimating, setRewardPunchAnimating] = useState<Set<number>>(() => new Set());
  /** Blocks further unlocks once a 3-of-a-kind is found. */
  const [boardLocked, setBoardLocked] = useState(false);
  const boardLockedRef = useRef(false);
  boardLockedRef.current = boardLocked;
  const [matchHideDoors, setMatchHideDoors] = useState<Set<number>>(() => new Set());
  const matchHideDoorsRef = useRef(matchHideDoors);
  matchHideDoorsRef.current = matchHideDoors;
  /** Prevents gather from starting twice (open + settle). */
  const match3GatherStartedRef = useRef(false);
  const rewardPunchTimeoutsRef = useRef<Map<number, number>>(new Map());
  const [match3Flight, setMatch3Flight] = useState<Match3Flight | null>(null);

  useEffect(() => {
    for (const src of [
      SPECIAL_DELIVERY_DOOR_OPENING_SRC,
      SPECIAL_DELIVERY_DOOR_OPENED_SRC,
      SPECIAL_DELIVERY_LOCK_SRC,
      SPECIAL_DELIVERY_UNLOCK_SRC,
      ...rewardDeal.map((r) => r.iconSrc),
      ...rewardDeal
        .map((r) => specialDeliveryRewardOverlayIconSrc(r))
        .filter((src): src is string => src != null),
      ...rewardDeal.map((r) => specialDeliveryRewardRevealIconSrc(r)),
    ]) {
      const img = new Image();
      img.src = assetPath(src);
    }
  }, [rewardDeal]);

  const patchDoor = useCallback((doorIndex: number, patch: Partial<DoorState>) => {
    setDoors((prev) => {
      const next = prev.slice();
      const cur = next[doorIndex] ?? createInitialDoors()[0]!;
      next[doorIndex] = { ...cur, ...patch };
      return next;
    });
  }, []);

  /** After match-3 dismiss, wait for door close anims then redeal. */
  const pendingBoardResetRef = useRef(false);
  const [boardResetClosing, setBoardResetClosing] = useState(false);

  /** Boards are saved per garden — switching gardens loads that garden's own board. */
  const loadedGardenRef = useRef(gardenId);
  useEffect(() => {
    if (loadedGardenRef.current === gardenId) return;
    loadedGardenRef.current = gardenId;
    const board = loadBoard(
      gardenId,
      playerLevelRef.current,
      winnableTrophiesRef.current,
      gardenContextsRef.current,
      upgradeGateCtxRef.current,
    );
    doorsRef.current = board.doors;
    setDoors(board.doors);
    setRewardDeal(board.rewards);
    keyImpactHandledRef.current.clear();
    openDoorBurstSpawnedRef.current.clear();
    setKeyParticle(null);
    setDoorLeafBursts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gardenId]);

  /** Persist the deal + opened doors so a reload keeps unclaimed doors open. */
  useEffect(() => {
    if (suppressBoardSaveRef.current) return;
    if (boardLocked || boardResetClosing) {
      // Match found / board resetting — the next session deals a fresh board instead.
      clearSpecialDeliveryBoard(gardenId);
      return;
    }
    const openedDoorIndices: number[] = [];
    doors.forEach((door, i) => {
      if (door.motion === 'closing') return;
      // Unlocking / opening already spent the key, so they count as open.
      if (door.phase === 'opened' || door.motion === 'opening' || door.motion === 'unlocking') {
        openedDoorIndices.push(i);
      }
    });
    writeSpecialDeliveryBoard(gardenId, { v: 1, rewards: rewardDeal, openedDoorIndices });
  }, [boardLocked, boardResetClosing, doors, gardenId, rewardDeal]);

  /** Entering / switching FTUE pick rounds: fresh closed board + placeholder rewards. */
  useEffect(() => {
    if (ftuePickSequence == null) return;
    ftuePickIndexRef.current = 0;
    // Empty sequence = mid-FTUE await (e.g. coins landing) — don't wipe the closing board.
    if (ftuePickSequence.length === 0) return;
    clearSpecialDeliveryBoard(gardenId);
    const placeholders = createSpecialDeliveryFtuePlaceholderDeal(gardenId);
    rewardDealRef.current = placeholders;
    setRewardDeal(placeholders);
    const closed = createInitialDoors();
    doorsRef.current = closed;
    setDoors(closed);
    setBoardLocked(false);
    boardLockedRef.current = false;
    setBoardResetClosing(false);
    pendingBoardResetRef.current = false;
    match3GatherStartedRef.current = false;
    pendingMatchRewardRef.current = null;
    setMatch3Flight(null);
    setMatchHideDoors(new Set());
    setKeyParticle(null);
    setFlyingUnlock(null);
    keyImpactHandledRef.current.clear();
    openDoorBurstSpawnedRef.current.clear();
    // Intentionally keyed on sequence identity from the parent (new array per FTUE round).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ftuePickSequence]);

  const clearRewardPunches = useCallback(() => {
    setRewardPunchAnimating(new Set());
    for (const t of rewardPunchTimeoutsRef.current.values()) {
      window.clearTimeout(t);
    }
    rewardPunchTimeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      for (const t of rewardPunchTimeoutsRef.current.values()) {
        window.clearTimeout(t);
      }
      rewardPunchTimeoutsRef.current.clear();
    };
  }, []);

  const endRewardPunchAnimating = useCallback((indices: number[]) => {
    setRewardPunchAnimating((prev) => {
      const next = new Set(prev);
      for (const i of indices) next.delete(i);
      return next;
    });
    for (const i of indices) {
      const t = rewardPunchTimeoutsRef.current.get(i);
      if (t != null) {
        window.clearTimeout(t);
        rewardPunchTimeoutsRef.current.delete(i);
      }
    }
  }, []);

  /** Start punch anim class for doors; removes class after duration so it can't re-fire. */
  const triggerRewardPunch = useCallback(
    (indices: number[]) => {
      setRewardPunchGen((prev) => {
        const next = { ...prev };
        for (const i of indices) {
          next[i] = (next[i] ?? 0) + 1;
        }
        return next;
      });
      setRewardPunchAnimating((prev) => {
        const next = new Set(prev);
        for (const i of indices) next.add(i);
        return next;
      });
      for (const i of indices) {
        const existing = rewardPunchTimeoutsRef.current.get(i);
        if (existing != null) window.clearTimeout(existing);
        const t = window.setTimeout(() => {
          rewardPunchTimeoutsRef.current.delete(i);
          endRewardPunchAnimating([i]);
        }, SPECIAL_DELIVERY_MATCH3_PUNCH_MS);
        rewardPunchTimeoutsRef.current.set(i, t);
      }
    },
    [endRewardPunchAnimating],
  );

  const finishBoardReset = useCallback(() => {
    pendingBoardResetRef.current = false;
    setBoardResetClosing(false);
    // Keep match-3 mounted until it finishes its overlay fade (onMatch3Complete).
    setMatchHideDoors(new Set());
    clearRewardPunches();
    pendingMatchRewardRef.current = null;
    match3GatherStartedRef.current = false;
    boardLockedRef.current = false;
    setBoardLocked(false);
    setKeyParticle(null);
    setDoorLeafBursts([]);
    keyImpactHandledRef.current.clear();
    openDoorBurstSpawnedRef.current.clear();
    setRewardPunchGen({});
    setRewardPunchAnimating(new Set());
    // Full reshuffle for every door — keep closed door state so lock swings already played stay intact.
    setRewardDeal(dealRewards());
    setDoors((prev) =>
      prev.map((d) => ({
        ...d,
        phase: 'closed' as const,
        motion: 'idle' as const,
        anim: 'none' as const,
        lockVisual: 'lock' as const,
      })),
    );
  }, [clearRewardPunches, dealRewards]);

  const resetBoardAfterMatch = useCallback(() => {
    pendingBoardResetRef.current = false;
    setBoardResetClosing(false);
    setMatch3Flight(null);
    setMatchHideDoors(new Set());
    clearRewardPunches();
    pendingMatchRewardRef.current = null;
    match3GatherStartedRef.current = false;
    boardLockedRef.current = false;
    setBoardLocked(false);
    setKeyParticle(null);
    setDoorLeafBursts([]);
    keyImpactHandledRef.current.clear();
    openDoorBurstSpawnedRef.current.clear();
    setRewardPunchGen({});
    setRewardPunchAnimating(new Set());
    setRewardDeal(dealRewards());
    setDoors(createInitialDoors());
  }, [clearRewardPunches, dealRewards]);

  /** Close every open / opening door with the normal close sequence. */
  const beginCloseAllOpenDoors = useCallback(() => {
    setDoors((prev) =>
      prev.map((d) => {
        if (d.motion === 'unlocking') {
          return {
            ...d,
            motion: 'idle' as const,
            phase: 'closed' as const,
            anim: 'none' as const,
            lockVisual: 'lock' as const,
            lockSwingGen: d.lockSwingGen + 1,
          };
        }
        if (
          d.phase === 'opened' ||
          d.phase === 'opening' ||
          d.motion === 'opening' ||
          d.motion === 'closing'
        ) {
          if (d.motion === 'closing') return d;
          return {
            ...d,
            motion: 'closing' as const,
            phase: 'opened' as const,
            anim: 'opened-settle-close' as const,
            gen: d.gen + 1,
            lockVisual: 'gone' as const,
          };
        }
        return d;
      }),
    );
  }, []);

  const tryFinishBoardResetIfReady = useCallback(() => {
    if (!pendingBoardResetRef.current) return;
    const allClosedIdle = doorsRef.current.every(
      (d) => d.phase === 'closed' && d.motion === 'idle',
    );
    if (allClosedIdle) {
      finishBoardReset();
    }
  }, [finishBoardReset]);

  /** Sync lock so spam taps in the same frame can't open more doors. */
  const lockBoard = useCallback(() => {
    boardLockedRef.current = true;
    setBoardLocked(true);
  }, []);

  /**
   * Count doors already committed to showing this reward (opened / unlocking / opening),
   * plus `openingIndex` if we're about to start opening it.
   */
  const countCommittedMatches = useCallback(
    (reward: SpecialDeliveryReward, openingIndex: number): number => {
      let count = 0;
      for (let i = 0; i < DOOR_COUNT; i++) {
        if (!specialDeliveryRewardsEqual(rewardDealRef.current[i], reward)) continue;
        if (i === openingIndex) {
          count++;
          continue;
        }
        const d = doorsRef.current[i];
        if (!d) continue;
        if (d.motion === 'unlocking' || d.motion === 'opening') {
          count++;
          continue;
        }
        if (d.phase === 'opened' && d.motion !== 'closing') {
          count++;
        }
      }
      return count;
    },
    [],
  );

  /** Lock immediately when the 3rd matching door is tapped (before open finishes). */
  const lockIfThirdMatchTap = useCallback(
    (doorIndex: number) => {
      const reward = rewardDealRef.current[doorIndex];
      if (!reward) return;
      if (countCommittedMatches(reward, doorIndex) >= 3) {
        pendingMatchRewardRef.current = reward;
        lockBoard();
        setKeyParticle(null);
      }
    },
    [countCommittedMatches, lockBoard],
  );

  /** Only one key flies at a time — reset any other door left mid-unlock. */
  const cancelOtherUnlocking = useCallback((exceptIndex: number) => {
    const refundCount = doorsRef.current.filter(
      (d, i) => i !== exceptIndex && d.motion === 'unlocking',
    ).length;
    if (refundCount === 0) return;
    setDoors((prev) => {
      const next = prev.map((d, i) => {
        if (i === exceptIndex || d.motion !== 'unlocking') return d;
        keyImpactHandledRef.current.delete(i);
        openDoorBurstSpawnedRef.current.delete(i);
        return {
          ...d,
          motion: 'idle' as const,
          phase: 'closed' as const,
          anim: 'none' as const,
          lockVisual: 'lock' as const,
        };
      });
      doorsRef.current = next;
      return next;
    });
    for (let i = 0; i < refundCount; i++) onRefundKey?.();
  }, [onRefundKey]);

  const beginMatch3Animation = useCallback(
    (matchIndices: number[], reward: SpecialDeliveryReward) => {
      if (match3GatherStartedRef.current) return;
      match3GatherStartedRef.current = true;
      const panel = containerRef.current;
      const gameEl = document.getElementById('game-container');
      const coordRoot = gameEl ?? panel;
      if (!coordRoot) {
        resetBoardAfterMatch();
        return;
      }
      const cr = coordRoot.getBoundingClientRect();
      const items: SpecialDeliveryMatch3Item[] = [];
      for (const doorIndex of matchIndices) {
        const el = rewardAnchorRefs.current[doorIndex];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        items.push({
          doorIndex,
          iconSrc: reward.iconSrc,
          overlayIconSrc: specialDeliveryRewardOverlayIconSrc(reward) ?? undefined,
          startX: (r.left + r.width * SPECIAL_DELIVERY_REWARD_PIVOT_X - cr.left) / appScale,
          startY: (r.top + r.height * SPECIAL_DELIVERY_REWARD_PIVOT_Y - cr.top) / appScale,
          sizePx: Math.max(r.width, r.height) / appScale,
        });
      }
      // Meet / reveal at game-container center (same as popup centering).
      const centerX = cr.width / (2 * appScale);
      const centerY = cr.height / (2 * appScale);
      setMatchHideDoors(new Set(matchIndices));
      setMatch3Flight({ items, reward, centerX, centerY });
    },
    [appScale, containerRef, resetBoardAfterMatch],
  );

  const clearLeftoverRewardsOnClaim = useCallback(() => {
    pendingBoardResetRef.current = true;
    setBoardResetClosing(true);
    // Kill any in-flight key so a late impact can't burst after doors shut.
    setKeyParticle(null);

    const panel = containerRef.current;
    const matchSet = matchHideDoorsRef.current;
    const leftoverHide = new Set<number>(matchSet);
    const bursts: LockLeafBurst[] = [];

    // Hide every non-winning hole reward immediately (open or still closed).
    for (let i = 0; i < DOOR_COUNT; i++) {
      if (matchSet.has(i)) continue;
      leftoverHide.add(i);
    }

    if (panel && !getPerformanceMode()) {
      const cr = panel.getBoundingClientRect();
      for (let i = 0; i < DOOR_COUNT; i++) {
        if (matchSet.has(i)) continue;
        const d = doorsRef.current[i];
        if (!d) continue;
        const isOpenHole =
          d.phase === 'opened' ||
          d.phase === 'opening' ||
          d.motion === 'opening' ||
          d.motion === 'closing';
        if (!isOpenHole) continue;

        const doorEl = doorSpriteRefs.current[i];
        if (!doorEl) continue;
        const dr = doorEl.getBoundingClientRect();
        bursts.push({
          // Leftover reward explode — door-sprite center (0.5 / 0.5).
          id: `sd-leftover-lb-${i}-${Date.now()}`,
          x: (dr.left + dr.width * 0.5 - cr.left) / appScale,
          y: (dr.top + dr.height * 0.5 - cr.top) / appScale,
          startTime: Date.now(),
          particleCount: Math.max(1, Math.round(LEAF_BURST_BASELINE_COUNT * 0.5)),
          burstScale: 1,
          useCircle: true,
        });
      }
    }

    setMatchHideDoors(leftoverHide);
    if (bursts.length > 0) {
      setDoorLeafBursts((prev) => [...prev, ...bursts]);
    }
  }, [appScale, containerRef]);

  const onMatch3DismissStart = useCallback(() => {
    // Leftovers already cleared on claim — now close the open doors.
    pendingBoardResetRef.current = true;
    setBoardResetClosing(true);
    setKeyParticle(null);
    beginCloseAllOpenDoors();
  }, [beginCloseAllOpenDoors]);

  const onMatch3Complete = useCallback(() => {
    setMatch3Flight(null);
    // Doors may still be closing — redeal when all are closed.
    tryFinishBoardResetIfReady();
  }, [tryFinishBoardResetIfReady]);

  const spawnOpenDoorLeafBurst = useCallback(
    (doorIndex: number) => {
      if (getPerformanceMode()) return;
      // Hard lock: only one open burst per door until it fully closes again.
      if (openDoorBurstSpawnedRef.current.has(doorIndex)) return;
      openDoorBurstSpawnedRef.current.add(doorIndex);

      const container = containerRef.current;
      const doorEl = doorSpriteRefs.current[doorIndex];
      if (!container || !doorEl) return;
      const cr = container.getBoundingClientRect();
      const dr = doorEl.getBoundingClientRect();
      // Exact center of the door sprite box (0.5 / 0.5), game-container design space.
      const x = (dr.left + dr.width * 0.5 - cr.left) / appScale;
      const y = (dr.top + dr.height * 0.5 - cr.top) / appScale;
      const id = `sd-open-lb-${doorIndex}-${nextDoorLeafBurstIdRef.current++}`;
      setDoorLeafBursts((prev) => [
        ...prev.filter((b) => !b.id.startsWith(`sd-open-lb-${doorIndex}-`)),
        {
          id,
          x,
          y,
          startTime: Date.now(),
          particleCount: Math.max(1, Math.round(LEAF_BURST_BASELINE_COUNT * 0.5)),
          burstScale: 1,
          useCircle: true,
        },
      ]);
    },
    [appScale, containerRef],
  );

  const beginDoorOpenAnim = useCallback(
    (doorIndex: number) => {
      const cur = doorsRef.current[doorIndex];
      if (!cur) return;
      // Already opening / open — don't re-run open VFX (fast multi-unlock race).
      if (cur.motion === 'opening' || cur.phase === 'opened') {
        return;
      }

      const nextDoor: DoorState = {
        ...cur,
        motion: 'opening',
        phase: 'opening',
        anim: 'opening-squash-open',
        gen: cur.gen + 1,
        lockVisual: 'gone',
      };
      // Sync ref immediately so a second rapid open can't pass the guard above.
      doorsRef.current[doorIndex] = nextDoor;
      setDoors((prev) => {
        const next = prev.slice();
        next[doorIndex] = nextDoor;
        return next;
      });

      const reward = rewardDealRef.current[doorIndex];
      const completesMatch =
        Boolean(reward) && countCommittedMatches(reward!, doorIndex) >= 3;

      if (completesMatch && reward) {
        const matchIndices: number[] = [];
        for (let i = 0; i < DOOR_COUNT; i++) {
          if (!specialDeliveryRewardsEqual(rewardDealRef.current[i], reward)) continue;
          if (i === doorIndex) {
            matchIndices.push(i);
            continue;
          }
          const d = doorsRef.current[i];
          if (!d) continue;
          if (
            d.motion === 'unlocking' ||
            d.motion === 'opening' ||
            (d.phase === 'opened' && d.motion !== 'closing')
          ) {
            matchIndices.push(i);
          }
        }
        if (matchIndices.length >= 3) {
          pendingMatchRewardRef.current = reward;
          lockBoard();
          beginMatch3Animation(matchIndices, reward);
        }
      } else {
        triggerRewardPunch([doorIndex]);
      }
      spawnOpenDoorLeafBurst(doorIndex);
    },
    [
      beginMatch3Animation,
      countCommittedMatches,
      lockBoard,
      spawnOpenDoorLeafBurst,
      triggerRewardPunch,
    ],
  );

  const onKeyImpact = useCallback(
    (doorIndex: number) => {
      // Ignore stale keys after claim / reset, or if this door is no longer unlocking.
      const cur = doorsRef.current[doorIndex];
      if (
        pendingBoardResetRef.current ||
        !cur ||
        cur.motion !== 'unlocking'
      ) {
        if (cur && cur.motion === 'unlocking') {
          patchDoor(doorIndex, {
            motion: 'idle',
            phase: 'closed',
            anim: 'none',
            lockVisual: 'lock',
          });
        }
        return;
      }

      if (keyImpactHandledRef.current.has(doorIndex)) {
        return;
      }
      keyImpactHandledRef.current.add(doorIndex);

      const pendingReward = pendingMatchRewardRef.current;
      if (
        boardLockedRef.current &&
        pendingReward != null &&
        !specialDeliveryRewardsEqual(rewardDealRef.current[doorIndex], pendingReward)
      ) {
        // Board already locked on a match-3 — don't open a non-matching door.
        patchDoor(doorIndex, {
          motion: 'idle',
          phase: 'closed',
          anim: 'none',
          lockVisual: 'lock',
        });
        return;
      }

      const container = containerRef.current;
      const lockEl = lockAnchorRefs.current[doorIndex];
      if (container && lockEl) {
        const cr = container.getBoundingClientRect();
        const lr = lockEl.getBoundingClientRect();
        const cx = (lr.left + lr.width / 2 - cr.left) / appScale;
        const cy = (lr.top + lr.height / 2 - cr.top) / appScale;
        const sizePx = Math.max(lr.width, lr.height) / appScale;
        setFlyingUnlock({
          id: `sd-unlock-${doorIndex}-${Date.now()}`,
          x: cx,
          y: cy,
          sizePx,
        });
      }

      patchDoor(doorIndex, { lockVisual: 'gone' });
      beginDoorOpenAnim(doorIndex);
    },
    [appScale, beginDoorOpenAnim, containerRef, patchDoor],
  );

  const onToggleDoor = useCallback(
    (doorIndex: number) => {
      if (boardLockedRef.current) return;
      const cur = doorsRef.current[doorIndex];
      if (!cur || cur.motion !== 'idle') return;

      if (cur.phase === 'closed') {
        cancelOtherUnlocking(doorIndex);

        if (onTrySpendKey && !onTrySpendKey()) {
          const toastAnchor =
            doorSpriteRefs.current[doorIndex] ?? lockAnchorRefs.current[doorIndex];
          const rect = toastAnchor?.getBoundingClientRect();
          onOutOfKeys?.(
            rect
              ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
              : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          );
          patchDoor(doorIndex, { lockSwingGen: cur.lockSwingGen + 1 });
          return;
        }

        // FTUE: assign the next pick-order reward before match detection.
        const seq = ftuePickSequenceRef.current;
        if (seq && seq.length > 0) {
          const pick = seq[Math.min(ftuePickIndexRef.current, seq.length - 1)];
          if (pick) {
            const nextDeal = rewardDealRef.current.slice();
            nextDeal[doorIndex] = pick;
            rewardDealRef.current = nextDeal;
            setRewardDeal(nextDeal);
            ftuePickIndexRef.current += 1;
          }
        }

        // Know the reward under this door immediately — lock on 3rd match tap
        // so spam-tapping can't spend keys on other doors while it opens.
        lockIfThirdMatchTap(doorIndex);

        onFtueDoorTapRef.current?.(doorIndex);

        const container = containerRef.current;
        const potEl = keySourceIconRef.current;
        const lockEl = lockAnchorRefs.current[doorIndex];
        if (!container || !potEl || !lockEl) {
          beginDoorOpenAnim(doorIndex);
          return;
        }

        const cr = container.getBoundingClientRect();
        const pr = potEl.getBoundingClientRect();
        const lr = lockEl.getBoundingClientRect();
        const startX = (pr.left + pr.width / 2 - cr.left) / appScale;
        const startY = (pr.top + pr.height / 2 - cr.top) / appScale;
        const endX = (lr.left + lr.width / 2 - cr.left) / appScale;
        const endY =
          (lr.top + lr.height / 2 - cr.top) / appScale + SPECIAL_DELIVERY_KEY_HIT_BELOW_LOCK_CENTER_PX;

        patchDoor(doorIndex, { motion: 'unlocking' });
        keyImpactHandledRef.current.delete(doorIndex);
        setKeyParticle({
          id: `sd-key-${doorIndex}-${Date.now()}`,
          doorIndex,
          startX,
          startY,
          endX,
          endY,
        });
        return;
      }

      if (cur.phase === 'opened') {
        // Open doors stay open — closing only happens after claiming a match-3.
        return;
      }
    },
    [
      appScale,
      beginDoorOpenAnim,
      cancelOtherUnlocking,
      containerRef,
      keySourceIconRef,
      lockIfThirdMatchTap,
      onOutOfKeys,
      onTrySpendKey,
      patchDoor,
    ],
  );

  const tryStartMatch3 = useCallback(
    (doorIndex: number, nextDoors: DoorState[]) => {
      const reward = rewardDealRef.current[doorIndex];
      if (!reward) return false;

      // Gather already kicked off when the 3rd door began opening — just block auto-close.
      if (match3GatherStartedRef.current) {
        return specialDeliveryRewardsEqual(pendingMatchRewardRef.current, reward);
      }

      const matchIndices: number[] = [];
      for (let i = 0; i < DOOR_COUNT; i++) {
        const d = nextDoors[i];
        if (
          d &&
          d.phase === 'opened' &&
          d.motion === 'idle' &&
          specialDeliveryRewardsEqual(rewardDealRef.current[i], reward)
        ) {
          matchIndices.push(i);
        }
      }
      if (matchIndices.length < 3) return false;

      lockBoard();
      beginMatch3Animation(matchIndices, reward);
      return true;
    },
    [beginMatch3Animation, lockBoard],
  );

  const onAnimEnd = useCallback(
    (doorIndex: number) => {
      const cur = doorsRef.current[doorIndex];
      if (!cur) return;

      if (cur.motion === 'opening') {
        if (cur.anim === 'closed-squash-open') {
          patchDoor(doorIndex, {
            phase: 'opening',
            anim: 'opening-squash-open',
            gen: cur.gen + 1,
          });
          return;
        }
        if (cur.anim === 'opening-squash-open') {
          patchDoor(doorIndex, {
            phase: 'opened',
            anim: 'opened-settle',
            gen: cur.gen + 1,
          });
          return;
        }
        if (cur.anim === 'opened-settle') {
          setDoors((prev) => {
            const next = prev.slice();
            const door = next[doorIndex] ?? createInitialDoors()[0]!;
            next[doorIndex] = {
              ...door,
              motion: 'idle',
              phase: 'opened',
              anim: 'none',
            };
            // Match-3 win takes priority over “all 9 open” auto-close.
            if (tryStartMatch3(doorIndex, next)) {
              return next;
            }
            const allOpenIdle = next.every((d) => d.phase === 'opened' && d.motion === 'idle');
            if (!allOpenIdle) return next;
            return next.map((d) => ({
              ...d,
              motion: 'closing' as const,
              phase: 'opened' as const,
              anim: 'opened-settle-close' as const,
              gen: d.gen + 1,
            }));
          });
        }
        return;
      }

      if (cur.motion === 'closing') {
        if (cur.anim === 'opened-settle-close') {
          patchDoor(doorIndex, {
            phase: 'opening',
            anim: 'opening-squash-close',
            gen: cur.gen + 1,
          });
          return;
        }
        if (cur.anim === 'opening-squash-close') {
          setDoors((prev) => {
            const next = prev.slice();
            const door = next[doorIndex] ?? createInitialDoors()[0]!;
            next[doorIndex] = {
              ...door,
              motion: 'idle',
              phase: 'closed',
              anim: 'none',
              gen: door.gen + 1,
              lockSwingGen: door.lockSwingGen + 1,
              lockVisual: 'lock',
            };
            doorsRef.current = next;
            openDoorBurstSpawnedRef.current.delete(doorIndex);
            keyImpactHandledRef.current.delete(doorIndex);
            if (
              pendingBoardResetRef.current &&
              next.every((d) => d.phase === 'closed' && d.motion === 'idle')
            ) {
              queueMicrotask(() => {
                finishBoardReset();
              });
            }
            return next;
          });
          return;
        }
      }
    },
    [finishBoardReset, patchDoor, tryStartMatch3],
  );

  const lockPivotOrigin = `${SPECIAL_DELIVERY_LOCK_PIVOT_X * 100}% ${SPECIAL_DELIVERY_LOCK_PIVOT_Y * 100}%`;
  const portalTarget = containerRef.current;
  const match3PortalTarget =
    typeof document !== 'undefined' ? document.getElementById('game-container') : null;

  return (
    <>
      {SPECIAL_DELIVERY_DOOR_CELL_CENTERS_ART_PX.map(([cx, cy], doorIndex) => {
        const door = doors[doorIndex] ?? createInitialDoors()[0]!;
        const pivotX = specialDeliveryDoorPivotX(door.phase);
        const pivotOrigin = `${pivotX * 100}% ${SPECIAL_DELIVERY_DOOR_PIVOT_Y * 100}%`;
        const cls = animClassName(door.anim);
        const durationMs = animDurationMs(door.anim);
        const showLock = door.phase === 'closed' && door.lockVisual === 'lock';
        const playLockSwing =
          showLock && door.lockSwingGen > 0 && door.motion !== 'opening' && door.motion !== 'unlocking';
        const reward = rewardDeal[doorIndex];
        const hideRewardForMatch = matchHideDoors.has(doorIndex);
        const doorFullyClosed = door.phase === 'closed' && door.motion === 'idle';
        const isDoorClosing =
          door.motion === 'closing' ||
          door.anim === 'opened-settle-close' ||
          door.anim === 'opening-squash-close';
        // During post-match close: keep holes empty until fully shut, then reshuffle all 9.
        const hideRewardForResetClose =
          boardResetClosing && (!doorFullyClosed || isDoorClosing);
        const showReward =
          Boolean(reward) && !hideRewardForMatch && !hideRewardForResetClose && !isDoorClosing;
        const punchGen = rewardPunchGen[doorIndex] ?? 0;
        const playRewardPunch = showReward && rewardPunchAnimating.has(doorIndex);
        const rewardIconSrc = reward?.iconSrc;
        const rewardOverlayIconSrc = reward
          ? specialDeliveryRewardOverlayIconSrc(reward)
          : null;

        return (
          <div
            key={`sd-door-${doorIndex}`}
            ref={(el) => {
              doorSpriteRefs.current[doorIndex] = el;
            }}
            className="absolute pointer-events-none"
            style={{
              left: artPercentX(cx - SPECIAL_DELIVERY_DOOR_ART_SIZE_PX / 2),
              top: artPercentY(cy - SPECIAL_DELIVERY_DOOR_ART_SIZE_PX / 2),
              width: artPercentX(SPECIAL_DELIVERY_DOOR_ART_SIZE_PX),
              aspectRatio: '1 / 1',
              zIndex: 1,
            }}
          >
            {/* Shadow below reward; both hide when match-3 gather starts. */}
            {showReward && (
              <div
                key={`sd-reward-shadow-${doorIndex}-${punchGen}`}
                className={`absolute pointer-events-none${
                  playRewardPunch ? ' special-delivery-reward-punch' : ''
                }`}
                style={{
                  left: '50%',
                  top: `calc(50% + ${SPECIAL_DELIVERY_REWARD_OFFSET_Y_PX + SPECIAL_DELIVERY_REWARD_SHADOW_OFFSET_Y_PX}px)`,
                  width: `${(SPECIAL_DELIVERY_REWARD_ART_SIZE_PX / SPECIAL_DELIVERY_DOOR_ART_SIZE_PX) * 100}%`,
                  aspectRatio: '1 / 1',
                  transform: `translate(-${SPECIAL_DELIVERY_REWARD_PIVOT_X * 100}%, -${SPECIAL_DELIVERY_REWARD_PIVOT_Y * 100}%)`,
                  transformOrigin: `${SPECIAL_DELIVERY_REWARD_PIVOT_X * 100}% ${SPECIAL_DELIVERY_REWARD_PIVOT_Y * 100}%`,
                  zIndex: 0,
                }}
              >
                <img
                  src={assetPath(SPECIAL_DELIVERY_REWARD_SHADOW_SRC)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            )}
            {/* Reward sits above the panel art but behind the door sprite. */}
            {showReward && (
              <div
                key={`sd-reward-${doorIndex}-${punchGen}`}
                ref={(el) => {
                  rewardAnchorRefs.current[doorIndex] = el;
                }}
                className={`absolute pointer-events-none${
                  playRewardPunch ? ' special-delivery-reward-punch' : ''
                }`}
                style={{
                  left: '50%',
                  top: `calc(50% + ${SPECIAL_DELIVERY_REWARD_OFFSET_Y_PX}px)`,
                  width: `${(SPECIAL_DELIVERY_REWARD_ART_SIZE_PX / SPECIAL_DELIVERY_DOOR_ART_SIZE_PX) * 100}%`,
                  aspectRatio: '1 / 1',
                  transform: `translate(-${SPECIAL_DELIVERY_REWARD_PIVOT_X * 100}%, -${SPECIAL_DELIVERY_REWARD_PIVOT_Y * 100}%)`,
                  transformOrigin: `${SPECIAL_DELIVERY_REWARD_PIVOT_X * 100}% ${SPECIAL_DELIVERY_REWARD_PIVOT_Y * 100}%`,
                  zIndex: 0,
                }}
              >
                <img
                  src={assetPath(rewardIconSrc!)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
                {rewardOverlayIconSrc && (
                  <img
                    src={assetPath(rewardOverlayIconSrc)}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                )}
                {playRewardPunch && (
                  <>
                    <img
                      src={assetPath(rewardIconSrc!)}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none special-delivery-reward-punch-white"
                      style={{
                        mixBlendMode: 'plus-lighter',
                        filter: 'brightness(0) invert(1)',
                      }}
                      draggable={false}
                    />
                    {rewardOverlayIconSrc && (
                      <img
                        src={assetPath(rewardOverlayIconSrc)}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none special-delivery-reward-punch-white"
                        style={{
                          mixBlendMode: 'plus-lighter',
                          filter: 'brightness(0) invert(1)',
                        }}
                        draggable={false}
                      />
                    )}
                  </>
                )}
                {SPECIAL_DELIVERY_SHOW_REWARD_PIVOTS && (
                  <div
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                      left: `${SPECIAL_DELIVERY_REWARD_PIVOT_X * 100}%`,
                      top: `${SPECIAL_DELIVERY_REWARD_PIVOT_Y * 100}%`,
                      width: 12,
                      height: 12,
                      marginLeft: -6,
                      marginTop: -6,
                      borderRadius: '50%',
                      background: '#ff00aa',
                      border: '2px solid #ffffff',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.65)',
                      zIndex: 6,
                    }}
                  />
                )}
              </div>
            )}
            <div
              key={`sd-door-anim-${doorIndex}-${door.gen}`}
              className={`absolute inset-0${cls ? ` ${cls}` : ''}`}
              style={{
                transformOrigin: pivotOrigin,
                zIndex: 1,
                ...(durationMs != null ? { animationDuration: `${durationMs}ms` } : {}),
              }}
              onAnimationEnd={() => onAnimEnd(doorIndex)}
            >
              <img
                src={assetPath(specialDeliveryDoorSrcForPhase(door.phase))}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            </div>
            <div
              ref={(el) => {
                lockAnchorRefs.current[doorIndex] = el;
              }}
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: `${(SPECIAL_DELIVERY_LOCK_ART_SIZE_PX / SPECIAL_DELIVERY_DOOR_ART_SIZE_PX) * 100}%`,
                aspectRatio: '1 / 1',
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
              }}
            >
              {showLock && (
                <img
                  key={`sd-lock-${doorIndex}-${door.lockSwingGen}`}
                  src={assetPath(SPECIAL_DELIVERY_LOCK_SRC)}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-contain${
                    playLockSwing ? ' special-delivery-lock-swing' : ''
                  }`}
                  style={{
                    transformOrigin: lockPivotOrigin,
                    ...(playLockSwing
                      ? { animationDuration: `${SPECIAL_DELIVERY_LOCK_SWING_MS}ms` }
                      : {}),
                  }}
                  draggable={false}
                />
              )}
            </div>
          </div>
        );
      })}
      {SPECIAL_DELIVERY_DOOR_CELL_CENTERS_ART_PX.map(([cx, cy], doorIndex) => (
        <button
          id={`${SPECIAL_DELIVERY_FTUE_DOOR_HIT_ID_PREFIX}${doorIndex}`}
          key={`sd-door-hit-${doorIndex}`}
          type="button"
          aria-label={`Special delivery ${doorIndex + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDoor(doorIndex);
          }}
          className="absolute p-0 m-0 bg-transparent cursor-pointer"
          style={{
            left: artPercentX(cx - SPECIAL_DELIVERY_DOOR_HIT_WIDTH_ART_PX / 2),
            top: artPercentY(cy - SPECIAL_DELIVERY_DOOR_HIT_HEIGHT_ART_PX / 2),
            width: artPercentX(SPECIAL_DELIVERY_DOOR_HIT_WIDTH_ART_PX),
            height: artPercentY(SPECIAL_DELIVERY_DOOR_HIT_HEIGHT_ART_PX),
            zIndex: 3,
            border: SPECIAL_DELIVERY_SHOW_DOOR_HITBOXES
              ? '2px dotted rgba(255, 40, 40, 0.95)'
              : 'none',
            boxSizing: 'border-box',
            pointerEvents: boardLocked ? 'none' : 'auto',
          }}
        />
      ))}

      {portalTarget &&
        keyParticle &&
        createPortal(
          <SpecialDeliveryKeyParticle
            data={keyParticle}
            onImpact={onKeyImpact}
            onComplete={() => setKeyParticle(null)}
          />,
          portalTarget,
        )}

      {portalTarget &&
        flyingUnlock &&
        createPortal(
          <SpecialDeliveryUnlockKnockoff
            key={flyingUnlock.id}
            id={flyingUnlock.id}
            x={flyingUnlock.x}
            y={flyingUnlock.y}
            sizePx={flyingUnlock.sizePx}
            onComplete={() => setFlyingUnlock(null)}
          />,
          portalTarget,
        )}

      {match3PortalTarget &&
        match3Flight &&
        createPortal(
          <SpecialDeliveryMatch3
            items={match3Flight.items}
            reward={match3Flight.reward}
            centerX={match3Flight.centerX}
            centerY={match3Flight.centerY}
            onClaimReward={onClaimReward}
            onClearLeftoverRewards={clearLeftoverRewardsOnClaim}
            onClaimReady={onMatch3ClaimReady}
            onDismissStart={onMatch3DismissStart}
            onComplete={onMatch3Complete}
          />,
          match3PortalTarget,
        )}

      {portalTarget &&
        doorLeafBursts.length > 0 &&
        createPortal(
          <>
            {doorLeafBursts.map((burst) => (
              <LeafBurst
                key={burst.id}
                x={burst.x}
                y={burst.y}
                startTime={burst.startTime}
                spriteVariant="gold"
                particleCount={burst.particleCount}
                useCircle={burst.useCircle ?? true}
                burstScale={burst.burstScale}
                appScale={1}
                zIndex={222}
                anchorPosition="absolute"
                spawnOffsetUpPx={0}
                onComplete={() =>
                  setDoorLeafBursts((prev) => prev.filter((b) => b.id !== burst.id))
                }
              />
            ))}
          </>,
          portalTarget,
        )}
    </>
  );
}
