/**
 * Collection bonuses — discovery-style shell; backdrop and X dismiss; bonus tier list.
 */
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { assetPath } from '../utils/assetPath';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight, POPUP_ENTER_MS, popupEnterInteractionPointerEvents, isPopupEnterInteractionLocked } from '../hooks/usePopupPreflightEnter';
import {
  POPUP_CLOSE_HIT_TARGET,
  POPUP_CLOSE_TOP_PX,
  POPUP_CREAM_DROP_SHADOW_FILTER,
  POPUP_CREAM_HIT_TARGET,
  POPUP_CREAM_STACK_MARGIN_TOP_PX,
  POPUP_HEADER_PASS_THROUGH,
  POPUP_HEADER_TOP_PX,
  POPUP_LAYOUT_PASS_THROUGH,
  popupAppScaleStyle,
  popupOverlayStyle,
} from '../constants/popupPointerEvents';
import { PopupVectorBackground } from './PopupVectorBackground';
import { PopupPrescaleFrame } from './PopupPrescaleFrame';
import { getCollectionBonusesIconPath, getCollectionBonusIconPath } from '../utils/gardenAssets';
import {
  getGoldenPotBonusIconSlugForPotCount,
  getGoldenPotBonusTiersForDisplay,
  GOLDEN_POT_BONUS_TIERS,
} from '../constants/goldenPotBonuses';
import { COLLECTION_PLANT_COUNT } from '../constants/barnShelves';
import { shouldPlayPopupLeafBurst } from '../utils/performanceMode';

const LEAF_SPRITES = [assetPath('/assets/vfx/particle_leaf_green_1.png'), assetPath('/assets/vfx/particle_leaf_green_2.png')];

interface LeafParticle {
  id: number;
  sprite: string;
  angle: number;
  speed: number;
  rotationSpeed: number;
  initialRotation: number;
  size: number;
  delay: number;
  spawnX?: number;
  spawnY?: number;
  lifetime: number;
}

interface RowBurstLeaf {
  id: number;
  sprite: string;
  /** Offset from row center (px, inner coords). */
  spawnX: number;
  spawnY: number;
  /** Outward unit normal for drift. */
  nx: number;
  ny: number;
  dist: number;
  rot: number;
  size: number;
}

export interface GoldenPotBonusesPopupProps {
  isVisible: boolean;
  onClose: () => void;
  /** Fired on tap when dismissing via X or backdrop (immediate), not when the close animation ends. */
  onUserDismiss?: () => void;
  /** Plants that currently have a golden pot (mastered) — header progress. */
  goldenPotCount: number;
  /** Pot thresholds unlocked by completing that shelf (drives green rows). */
  unlockedTierPotCounts?: readonly number[];
  maxGoldenPots?: number;
  appScale?: number;
  /**
   * When opening right after unlocking this tier (e.g. 4), that row shows disabled until open settles,
   * then after 0.25s it pops to green with a small leaf burst.
   */
  revealTierPotCount?: number | null;
  /** Scroll the bonus list to this tier row when the popup opens (e.g. shelf progress bar tap). */
  scrollToTierPotCount?: number | null;
  /** Tier rows for shelves that currently show the upgrade button (per started garden). */
  inProgressTierPotCounts?: readonly number[];
}

const POPUP_LEAF_COUNT = 40;
const POPUP_LEAF_MIN_LIFETIME_MS = 250;
const POPUP_LEAF_MAX_LIFETIME_MS = 1000;
const POPUP_CLOSE_MS = 200;

/** Popup open burst leaf size (px). Tier row burst uses 50% of this range. */
const POPUP_OPEN_LEAF_SIZE_MIN = 20;
const POPUP_OPEN_LEAF_SIZE_RANGE = 20;
const BONUS_ROW_LEAF_SIZE_MIN = POPUP_OPEN_LEAF_SIZE_MIN * 0.5;
const BONUS_ROW_LEAF_SIZE_RANGE = POPUP_OPEN_LEAF_SIZE_RANGE * 0.5;

/** Horizontal pill matching bonus row sprite (~520px inner tier width, flat top/bottom, rounded ends). */
const BONUS_ROW_PILL_RX = 234;
const BONUS_ROW_PILL_RY = 26;
const BONUS_ROW_PILL_L = Math.max(0, BONUS_ROW_PILL_RX - BONUS_ROW_PILL_RY);
const BONUS_ROW_LEAF_COUNT = 36;

/** t01 in [0,1): point on stadium perimeter + unit outward normal (center at origin). */
function stadiumPillPerimeterPoint(t01: number, L: number, Ry: number): { x: number; y: number; nx: number; ny: number } {
  const topLen = 2 * L;
  const arcLen = Math.PI * Ry;
  const perim = 2 * topLen + 2 * arcLen;
  let s = ((t01 % 1) + 1) % 1;
  s *= perim;

  if (s < topLen) {
    const u = s / topLen;
    const x = -L + u * (2 * L);
    const y = -Ry;
    return { x, y, nx: 0, ny: -1 };
  }
  s -= topLen;
  if (s < arcLen) {
    const u = s / arcLen;
    const theta = -Math.PI / 2 + u * Math.PI;
    const nx = Math.cos(theta);
    const ny = Math.sin(theta);
    return { x: L + Ry * nx, y: Ry * ny, nx, ny };
  }
  s -= arcLen;
  if (s < topLen) {
    const u = s / topLen;
    const x = L - u * (2 * L);
    const y = Ry;
    return { x, y, nx: 0, ny: 1 };
  }
  s -= topLen;
  const u = s / arcLen;
  const theta = Math.PI / 2 + u * Math.PI;
  const nx = Math.cos(theta);
  const ny = Math.sin(theta);
  return { x: -L + Ry * nx, y: Ry * ny, nx, ny };
}

function createBonusRowPillLeaves(idBase: number): RowBurstLeaf[] {
  return Array.from({ length: BONUS_ROW_LEAF_COUNT }, (_, i) => {
    const t = (i + Math.random() * 0.85) / BONUS_ROW_LEAF_COUNT;
    const { x, y, nx, ny } = stadiumPillPerimeterPoint(t, BONUS_ROW_PILL_L, BONUS_ROW_PILL_RY);
    const jitter = (Math.random() - 0.5) * 3;
    return {
      id: idBase + i,
      sprite: LEAF_SPRITES[i % LEAF_SPRITES.length],
      spawnX: x + nx * jitter,
      spawnY: y + ny * jitter,
      nx,
      ny,
      dist: 28 + Math.random() * 44,
      rot: Math.random() * 360,
      size: BONUS_ROW_LEAF_SIZE_MIN + Math.random() * BONUS_ROW_LEAF_SIZE_RANGE,
    };
  });
}

const POPUP_WIDTH = 260;
const POPUP_HEIGHT = 320;

function createPopupLeaves(): LeafParticle[] {
  return Array.from({ length: POPUP_LEAF_COUNT }, (_, i) => {
    const perimeter = 2 * (POPUP_WIDTH + POPUP_HEIGHT);
    const pos = (i / POPUP_LEAF_COUNT) * perimeter + Math.random() * 40;

    let spawnX: number;
    let spawnY: number;
    let outwardAngle: number;

    if (pos < POPUP_WIDTH) {
      spawnX = pos - POPUP_WIDTH / 2;
      spawnY = -POPUP_HEIGHT / 2;
      outwardAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    } else if (pos < POPUP_WIDTH + POPUP_HEIGHT) {
      spawnX = POPUP_WIDTH / 2;
      spawnY = (pos - POPUP_WIDTH) - POPUP_HEIGHT / 2;
      outwardAngle = 0 + (Math.random() - 0.5) * 0.8;
    } else if (pos < 2 * POPUP_WIDTH + POPUP_HEIGHT) {
      spawnX = POPUP_WIDTH / 2 - (pos - POPUP_WIDTH - POPUP_HEIGHT);
      spawnY = POPUP_HEIGHT / 2;
      outwardAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    } else {
      spawnX = -POPUP_WIDTH / 2;
      spawnY = POPUP_HEIGHT / 2 - (pos - 2 * POPUP_WIDTH - POPUP_HEIGHT);
      outwardAngle = Math.PI + (Math.random() - 0.5) * 0.8;
    }

    return {
      id: i,
      sprite: LEAF_SPRITES[i % LEAF_SPRITES.length],
      angle: outwardAngle,
      speed: Math.random() * 600,
      rotationSpeed: (Math.random() - 0.5) * 540,
      initialRotation: Math.random() * 360,
      size: POPUP_OPEN_LEAF_SIZE_MIN + Math.random() * POPUP_OPEN_LEAF_SIZE_RANGE,
      lifetime: POPUP_LEAF_MIN_LIFETIME_MS + Math.random() * (POPUP_LEAF_MAX_LIFETIME_MS - POPUP_LEAF_MIN_LIFETIME_MS),
      delay: 0,
      spawnX,
      spawnY,
    };
  });
}

const SUBTITLE_COLOR = '#5c4a32';

/** Tier pot count on locked rows (scaled inner coords). */
const BONUS_ROW_REWARD_ICON_PX = 56;
const BONUS_ROW_REWARD_ICON_LEFT = 'calc(3% + 9px)';
const BONUS_ROW_DESC_BOX_WIDTH_PX = 318;
const BONUS_ROW_DESC_BOX_OFFSET_Y_PX = 4;
const BONUS_ROW_DESC_TITLE_HEIGHT_PX = 45;
const BONUS_ROW_DESC_SUBTITLE_HEIGHT_PX = 25;
const BONUS_ROW_DESC_TITLE_FONT_REM = 2.0;
const BONUS_ROW_DESC_SUBTITLE_FONT_REM = 1.45;
const BONUS_ENABLED_TITLE_COLOR = '#62863b';
const BONUS_ENABLED_SUBTITLE_COLOR = '#8aa038';
const BONUS_LOCKED_TITLE_COLOR = '#765041';
const BONUS_LOCKED_SUBTITLE_COLOR = '#c6b280';
/** In-progress row: pots toward this tier (e.g. 2/4), far right. */
const BONUS_ROW_PROGRESS_RIGHT_PX = 34;
const BONUS_ROW_PROGRESS_FONT_REM = 1.45;

/** Pots completed toward an in-progress bonus tier (segment is always 4). */
function getInProgressTierFraction(
  tierPotCount: number,
  goldenPotCount: number,
): { numerator: number; denominator: number } {
  const idx = GOLDEN_POT_BONUS_TIERS.findIndex((t) => t.potCount === tierPotCount);
  const segmentStart = idx <= 0 ? 0 : GOLDEN_POT_BONUS_TIERS[idx - 1]!.potCount;
  const denominator = Math.max(1, tierPotCount - segmentStart);
  const numerator = Math.min(denominator, Math.max(0, goldenPotCount - segmentStart));
  return { numerator, denominator };
}


/** Bonus row sprite is 606×86; full row width in prescale coords (panel frame can be wider). */
const BONUS_ROW_DISPLAY_WIDTH_PX = 520;
const BONUS_LIST_PANEL_PAD_X_PX = 10;
const BONUS_LIST_PANEL_PAD_Y_PX = 10;
const BONUS_LIST_PANEL_WIDTH_PX = BONUS_ROW_DISPLAY_WIDTH_PX + BONUS_LIST_PANEL_PAD_X_PX * 2;
const BONUS_ROW_IMAGE_ASPECT = 86 / 606;
const BONUS_ROW_HEIGHT_PX = Math.round(BONUS_ROW_DISPLAY_WIDTH_PX * BONUS_ROW_IMAGE_ASPECT);
const BONUS_ROW_GAP_PX = 10;
const BONUS_ROWS_VISIBLE = 4.5;
const BONUS_LIST_SCROLL_ROWS_HEIGHT_PX = Math.round(
  BONUS_ROWS_VISIBLE * BONUS_ROW_HEIGHT_PX + (Math.ceil(BONUS_ROWS_VISIBLE) - 1) * BONUS_ROW_GAP_PX
);
/** Viewport height: 4.5 rows plus inset gaps inside the clip (padding lives on the scroller). */
const BONUS_LIST_SCROLL_VIEWPORT_HEIGHT_PX =
  BONUS_LIST_SCROLL_ROWS_HEIGHT_PX + BONUS_LIST_PANEL_PAD_Y_PX * 2;
/** Scroll panel — cream fill with matching outline. */
const BONUS_LIST_PANEL_FILL = '#f4e6b9';
const BONUS_LIST_PANEL_STROKE = '#e9dcaf';
const BONUS_LIST_PANEL_STROKE_PX = 3;
const BONUS_LIST_PANEL_RADIUS_PX = 36;

const BONUS_ROW_REVEAL_DELAY_MS = 250;
const BONUS_LIST_SCROLL_DURATION_MS = 320;

/** Scroll offset to align a bonus tier row with the top of the list viewport (display order). */
function getBonusTierListScrollTop(
  tierPotCount: number,
  unlocked: number | ReadonlySet<number>,
  inProgress: ReadonlySet<number> | readonly number[] = [],
): number | null {
  const displayTiers = getGoldenPotBonusTiersForDisplay(unlocked, inProgress);
  const displayIndex = displayTiers.findIndex((t) => t.potCount === tierPotCount);
  if (displayIndex < 0) return null;
  return displayIndex * (BONUS_ROW_HEIGHT_PX + BONUS_ROW_GAP_PX);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function smoothScrollBonusListTo(
  scrollContainer: HTMLElement,
  targetTop: number,
  durationMs = BONUS_LIST_SCROLL_DURATION_MS,
): () => void {
  const startTop = scrollContainer.scrollTop;
  const distance = targetTop - startTop;
  if (Math.abs(distance) < 1) {
    scrollContainer.scrollTop = targetTop;
    return () => {};
  }

  const startTime = performance.now();
  let rafId = 0;
  let cancelled = false;

  const step = (now: number) => {
    if (cancelled) return;
    const progress = Math.min(1, (now - startTime) / durationMs);
    scrollContainer.scrollTop = startTop + distance * easeInOutQuad(progress);
    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      scrollContainer.scrollTop = targetTop;
    }
  };

  rafId = requestAnimationFrame(step);
  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}

export const GoldenPotBonusesPopup: React.FC<GoldenPotBonusesPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  goldenPotCount,
  unlockedTierPotCounts,
  maxGoldenPots = COLLECTION_PLANT_COUNT,
  appScale = 1,
  revealTierPotCount = null,
  scrollToTierPotCount = null,
  inProgressTierPotCounts = [],
}) => {
  const unlockedTiersSet = useMemo(() => {
    if (unlockedTierPotCounts) return new Set(unlockedTierPotCounts);
    // Legacy fallback: pot-count threshold unlocks.
    return new Set(
      [4, 8, 12, 16, 20, 24, 28, 32, 36, 40].filter((t) => goldenPotCount >= t),
    );
  }, [unlockedTierPotCounts, goldenPotCount]);
  const inProgressTierSet = useMemo(
    () => new Set(inProgressTierPotCounts),
    [inProgressTierPotCounts],
  );
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [assetsReady, setAssetsReady] = useState(false);
  const [tierRevealArmed, setTierRevealArmed] = useState(false);
  const [rowBurstLeaves, setRowBurstLeaves] = useState<RowBurstLeaf[]>([]);
  const [leaves, setLeaves] = useState<LeafParticle[]>([]);
  const [leafPositions, setLeafPositions] = useState<
    { x: number; y: number; opacity: number; rotation: number; scale: number }[]
  >([]);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const leafRafRef = useRef<number>(0);
  const leafStartTimeRef = useRef<number>(0);
  const leafPosRef = useRef<
    { x: number; y: number; vx: number; vy: number; opacity: number; rotation: number; scale: number; started: boolean }[]
  >([]);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);
  const bonusListScrollRef = useRef<HTMLDivElement>(null);
  const scrollToTierHandledRef = useRef<number | null>(null);
  const cancelBonusListScrollRef = useRef<(() => void) | null>(null);

  const clampedCount = Math.max(0, Math.min(maxGoldenPots, goldenPotCount));
  const bonusTiersForDisplay = useMemo(
    () => getGoldenPotBonusTiersForDisplay(unlockedTiersSet, inProgressTierSet),
    [unlockedTiersSet, inProgressTierSet],
  );

  useEffect(() => {
    if (!isVisible) {
      setAssetsReady(false);
      return;
    }
    setAssetsReady(true);
  }, [isVisible]);

  useEffect(() => {
    if (leaves.length === 0) return;

    const tick = () => {
      const elapsed = Date.now() - leafStartTimeRef.current;

      const allDone = leaves.every((leaf, i) => {
        const leafElapsed = elapsed - leaf.delay;
        return leafElapsed > leaf.lifetime + 100;
      });

      if (allDone) {
        setLeaves([]);
        return;
      }

      leafPosRef.current.forEach((p, i) => {
        const leaf = leaves[i];
        if (!leaf) return;
        const leafElapsed = elapsed - leaf.delay;

        if (leafElapsed < 0) return;
        if (leafElapsed > leaf.lifetime) {
          p.opacity = 0;
          return;
        }

        if (!p.started) {
          p.started = true;
          p.vx = Math.cos(leaf.angle) * leaf.speed;
          p.vy = Math.sin(leaf.angle) * leaf.speed;
        }

        const dtSec = 1 / 60;
        const gravity = 60;
        const drag = 0.92;

        p.vy += gravity * dtSec;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.rotation = leaf.initialRotation + (leafElapsed / 1000) * leaf.rotationSpeed;

        const fadeStart = leaf.lifetime * 0.5;
        const fadeDuration = leaf.lifetime * 0.5;
        p.opacity = leafElapsed < fadeStart ? 1 : Math.max(0, 1 - (leafElapsed - fadeStart) / fadeDuration);
        p.scale = 1 - 0.2 * Math.min(1, leafElapsed / leaf.lifetime);
      });

      setLeafPositions(leafPosRef.current.map((p) => ({ x: p.x, y: p.y, opacity: p.opacity, rotation: p.rotation, scale: p.scale })));
      leafRafRef.current = requestAnimationFrame(tick);
    };

    leafRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(leafRafRef.current);
  }, [leaves]);

  const beginEnterAfterPreflight = useCallback(() => {
    if (shouldPlayPopupLeafBurst()) {
      const newLeaves = createPopupLeaves();
      setLeaves(newLeaves);
      leafStartTimeRef.current = Date.now();
      leafPosRef.current = newLeaves.map((leaf) => ({
        x: leaf.spawnX ?? 0,
        y: leaf.spawnY ?? 0,
        vx: 0,
        vy: 0,
        opacity: 1,
        rotation: 0,
        scale: 1,
        started: false,
      }));
      setLeafPositions(newLeaves.map((leaf) => ({ x: leaf.spawnX ?? 0, y: leaf.spawnY ?? 0, opacity: 1, rotation: 0, scale: 1 })));
      setImgFailed({});
    } else {
      setLeaves([]);
      setLeafPositions([]);
    }
    setAnimState('entering');
    setTimeout(() => setAnimState('visible'), POPUP_ENTER_MS);
  }, []);

  usePopupPreflightEnter(animState, beginEnterAfterPreflight, popupCardLayoutRef);

  useEffect(() => {
    setTierRevealArmed(false);
    setRowBurstLeaves([]);
  }, [revealTierPotCount, isVisible]);

  useEffect(() => {
    if (!revealTierPotCount || animState !== 'visible') return;
    const t = window.setTimeout(() => setTierRevealArmed(true), BONUS_ROW_REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [revealTierPotCount, animState]);

  useEffect(() => {
    if (!tierRevealArmed || !revealTierPotCount) {
      setRowBurstLeaves([]);
      return;
    }
    if (!shouldPlayPopupLeafBurst()) {
      setRowBurstLeaves([]);
      return;
    }
    const idBase = Date.now();
    const burst = createBonusRowPillLeaves(idBase);
    setRowBurstLeaves(burst);
    const clearT = setTimeout(() => setRowBurstLeaves([]), 720);
    return () => clearTimeout(clearT);
  }, [tierRevealArmed, revealTierPotCount]);

  useEffect(() => {
    if (!isVisible) {
      scrollToTierHandledRef.current = null;
      cancelBonusListScrollRef.current?.();
      cancelBonusListScrollRef.current = null;
      return;
    }
    if (scrollToTierPotCount == null || animState !== 'visible') return;
    if (scrollToTierHandledRef.current === scrollToTierPotCount) return;

    let cancelled = false;

    const scrollRowToTop = () => {
      if (cancelled || scrollToTierHandledRef.current === scrollToTierPotCount) return;

      const scrollContainer = bonusListScrollRef.current;
      if (!scrollContainer) return;

      const targetTop = getBonusTierListScrollTop(
        scrollToTierPotCount,
        unlockedTiersSet,
        inProgressTierSet,
      );
      if (targetTop == null) return;

      const maxScroll = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
      const clampedTop = Math.min(Math.max(0, targetTop), maxScroll);

      cancelBonusListScrollRef.current?.();
      cancelBonusListScrollRef.current = smoothScrollBonusListTo(scrollContainer, clampedTop);
      scrollToTierHandledRef.current = scrollToTierPotCount;
    };

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(scrollRowToTop);
    });
    const retryId = window.setTimeout(scrollRowToTop, 150);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(retryId);
      cancelBonusListScrollRef.current?.();
      cancelBonusListScrollRef.current = null;
    };
  }, [isVisible, animState, scrollToTierPotCount, unlockedTiersSet, inProgressTierSet]);

  useEffect(() => {
    if (isVisible && assetsReady && animState === 'hidden') {
      setAnimState('preflight');
    } else if (!isVisible && (animState === 'visible' || animState === 'entering' || animState === 'preflight')) {
      setAnimState('leaving');
      setTimeout(() => {
        setAnimState('hidden');
        onClose();
      }, POPUP_CLOSE_MS);
    }
  }, [isVisible, assetsReady, animState, onClose]);

  const [isClosing, setIsClosing] = useState(false);

  const dismiss = () => {
    if (isClosing || animState === 'leaving' || isPopupEnterInteractionLocked(animState)) return;
    onUserDismiss?.();
    setIsClosing(true);
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  if (animState === 'hidden') return null;

  const isPreflight = animState === 'preflight';
  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={popupOverlayStyle({ pointerEvents: popupEnterInteractionPointerEvents(animState) })}
    >
      <div
        className="absolute transition-opacity duration-200"
        style={{
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          opacity: isLeaving || isPreflight ? 0 : 1,
        }}
        onClick={dismiss}
      />

      <div
        className="relative flex items-center justify-center"
        style={popupAppScaleStyle(appScale)}
      >
        {(isEntering || animState === 'visible') && leaves.length > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: 1,
              height: 1,
              transform: 'translate(-50%, -50%)',
              zIndex: 101,
            }}
          >
            {leaves.map((leaf, i) => (
              <div
                key={leaf.id}
                className="absolute"
                style={{
                  left: leafPositions[i]?.x ?? 0,
                  top: leafPositions[i]?.y ?? 0,
                  width: leaf.size,
                  height: leaf.size,
                  transform: `translate(-50%, -50%) scale(${leafPositions[i]?.scale ?? 1}) rotate(${leafPositions[i]?.rotation ?? 0}deg)`,
                  opacity: leafPositions[i]?.opacity ?? 0,
                }}
              >
                {imgFailed[i] ? (
                  <div
                    className="w-full h-full rounded-sm"
                    style={{
                      background: 'linear-gradient(135deg, #4a7c23 0%, #6b8e23 100%)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  />
                ) : (
                  <img
                    src={leaf.sprite}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                    onError={() => setImgFailed((prev) => ({ ...prev, [i]: true }))}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div
          ref={popupCardLayoutRef}
          className="relative flex flex-col items-center"
          style={{
            width: '320px',
            zIndex: 102,
            ...POPUP_LAYOUT_PASS_THROUGH,
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              `popupEnter ${POPUP_ENTER_MS}ms ease-out forwards`,
              `popupLeave ${POPUP_CLOSE_MS}ms ease-in forwards`
            ),
          }}
        >
          <style>{`
            @keyframes popupEnter {
              0% { transform: scale(0.9); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes popupLeave {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0; }
            }
            @keyframes bonusTierRevealPop {
              0% { transform: scale(1); }
              35% { transform: scale(1.07); }
              100% { transform: scale(1); }
            }
            @keyframes bonusRowLeafAlongNormal {
              0% {
                opacity: 1;
                transform: translate(-50%, -50%) translate(0, 0) rotate(var(--leaf-rot, 0deg)) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate(-50%, -50%) translate(var(--dx, 0px), var(--dy, 0px))
                  rotate(calc(var(--leaf-rot, 0deg) + 100deg)) scale(0.48);
              }
            }
            .golden-pot-bonus-list-scroll {
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .golden-pot-bonus-list-scroll::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              top: `${POPUP_HEADER_TOP_PX}px`,
              zIndex: 104,
              ...POPUP_HEADER_PASS_THROUGH,
            }}
          >
            <img
              src={assetPath('/assets/ui/popup_header.png')}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            />
            <div
              className="relative flex items-center justify-center"
              style={{
                width: '94px',
                height: '94px',
                marginTop: '-4px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            >
              <img
                src={getCollectionBonusesIconPath()}
                alt=""
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>
          </div>

          <PopupPrescaleFrame
            creamHitTarget={false}
            prescaleWidthPx={640}
            style={{ marginTop: POPUP_CREAM_STACK_MARGIN_TOP_PX }}
          >
            <div
              style={{
                position: 'relative',
                padding: '150px 40px 36px 40px',
                ...POPUP_CREAM_HIT_TARGET,
              }}
            >
              <PopupVectorBackground style={{ filter: POPUP_CREAM_DROP_SHADOW_FILTER }} />
              <div className="relative z-[2] flex flex-col items-center">
                <h2
                  className="font-black tracking-tight text-center"
                  style={{
                    color: SUBTITLE_COLOR,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '3.25rem',
                    lineHeight: 1.05,
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  Collection Bonuses
                </h2>

                <div className="w-full flex items-center justify-center" style={{ marginTop: '8px', marginBottom: '24px' }}>
                  <img
                    src={assetPath('/assets/ui/popup_divider.png')}
                    alt=""
                    className="h-auto object-contain"
                    style={{ width: '520px' }}
                  />
                </div>

                <p
                  className="font-medium text-center leading-relaxed italic w-full"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: '2rem',
                  }}
                >
                  Upgrading a whole shelf will unlock its bonus reward
                </p>

                <div
                  style={{
                    marginTop: '28px',
                    width: `${BONUS_LIST_PANEL_WIDTH_PX}px`,
                    paddingLeft: `${BONUS_LIST_PANEL_PAD_X_PX}px`,
                    paddingRight: `${BONUS_LIST_PANEL_PAD_X_PX}px`,
                    boxSizing: 'border-box',
                    backgroundColor: BONUS_LIST_PANEL_FILL,
                    borderRadius: `${BONUS_LIST_PANEL_RADIUS_PX}px`,
                    boxShadow: `0 0 0 ${BONUS_LIST_PANEL_STROKE_PX}px ${BONUS_LIST_PANEL_STROKE}`,
                    overflow: 'hidden',
                  }}
                  aria-label="Golden pot bonuses"
                >
                  <div
                    ref={bonusListScrollRef}
                    className="golden-pot-bonus-list-scroll flex flex-col overflow-y-auto overflow-x-hidden"
                    style={{
                      width: `${BONUS_ROW_DISPLAY_WIDTH_PX}px`,
                      maxHeight: `${BONUS_LIST_SCROLL_VIEWPORT_HEIGHT_PX}px`,
                      paddingTop: `${BONUS_LIST_PANEL_PAD_Y_PX}px`,
                      paddingBottom: `${BONUS_LIST_PANEL_PAD_Y_PX}px`,
                      boxSizing: 'border-box',
                      gap: `${BONUS_ROW_GAP_PX}px`,
                    }}
                  >
                  {bonusTiersForDisplay.map((tier) => {
                    const rowIsCompleted = unlockedTiersSet.has(tier.potCount);
                    const isStagedRevealRow =
                      revealTierPotCount != null && revealTierPotCount === tier.potCount;
                    const showAsUnlocked = rowIsCompleted && (!isStagedRevealRow || tierRevealArmed);
                    const isInProgress = !showAsUnlocked && inProgressTierSet.has(tier.potCount);
                    const rewardIconSrc = getCollectionBonusIconPath(
                      getGoldenPotBonusIconSlugForPotCount(tier.potCount),
                      // Match shelf progress bar: in-progress uses full-color icon, not disabled.
                      !(showAsUnlocked || isInProgress),
                    );
                    const bonusSprite = showAsUnlocked
                      ? assetPath('/assets/ui/popup_bonuses_enabled.png')
                      : isInProgress
                        ? assetPath('/assets/ui/popup_bonuses_inprogress.png')
                        : assetPath('/assets/ui/popup_bonuses_disabled.png');
                    const titleColor =
                      showAsUnlocked || isInProgress
                        ? BONUS_ENABLED_TITLE_COLOR
                        : BONUS_LOCKED_TITLE_COLOR;
                    const subtitleColor =
                      showAsUnlocked || isInProgress
                        ? BONUS_ENABLED_SUBTITLE_COLOR
                        : BONUS_LOCKED_SUBTITLE_COLOR;
                    const playRowPop = isStagedRevealRow && tierRevealArmed;
                    return (
                      <div
                        key={`golden-pot-bonus-tier-${tier.potCount}`}
                        id={`golden-pot-bonus-tier-${tier.potCount}`}
                        className="relative w-full shrink-0 overflow-visible"
                        style={playRowPop ? { animation: 'bonusTierRevealPop 420ms ease-out' } : undefined}
                      >
                        {isStagedRevealRow && rowBurstLeaves.length > 0 && (
                          <div
                            className="pointer-events-none absolute inset-0 z-10 overflow-visible"
                            aria-hidden
                          >
                            {rowBurstLeaves.map((leaf) => (
                              <div
                                key={leaf.id}
                                className="pointer-events-none absolute"
                                style={{
                                  left: `calc(50% + ${leaf.spawnX}px)`,
                                  top: `calc(50% + ${leaf.spawnY}px)`,
                                  width: leaf.size,
                                  height: leaf.size,
                                  ['--leaf-rot' as string]: `${leaf.rot}deg`,
                                  ['--dx' as string]: `${leaf.nx * leaf.dist}px`,
                                  ['--dy' as string]: `${leaf.ny * leaf.dist}px`,
                                  animation: 'bonusRowLeafAlongNormal 0.7s ease-out forwards',
                                  animationDelay: `${(leaf.id % 8) * 5}ms`,
                                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
                                }}
                              >
                                <img src={leaf.sprite} alt="" className="h-full w-full object-contain" draggable={false} />
                              </div>
                            ))}
                          </div>
                        )}
                        <img
                          src={bonusSprite}
                          alt=""
                          className="block h-auto w-full object-contain pointer-events-none"
                          draggable={false}
                        />
                        <div
                          className="pointer-events-none absolute flex items-center justify-center"
                          style={{
                            left: BONUS_ROW_REWARD_ICON_LEFT,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: `${BONUS_ROW_REWARD_ICON_PX}px`,
                            height: `${BONUS_ROW_REWARD_ICON_PX}px`,
                          }}
                        >
                          <img
                            src={rewardIconSrc}
                            alt=""
                            className="h-full w-full object-contain"
                            draggable={false}
                          />
                        </div>
                        <div
                          className="pointer-events-none absolute flex flex-col box-border overflow-hidden"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, calc(-50% - ${BONUS_ROW_DESC_BOX_OFFSET_Y_PX}px))`,
                            width: `${BONUS_ROW_DESC_BOX_WIDTH_PX}px`,
                          }}
                        >
                          <div
                            className="flex w-full items-center justify-start overflow-hidden"
                            style={{
                              height: `${BONUS_ROW_DESC_TITLE_HEIGHT_PX}px`,
                              paddingTop: '1px',
                              fontFamily: 'Inter, sans-serif',
                              lineHeight: 1,
                            }}
                          >
                            <span
                              className="block w-full min-w-0 whitespace-nowrap text-left font-bold"
                              style={{ fontSize: `${BONUS_ROW_DESC_TITLE_FONT_REM}rem`, color: titleColor }}
                            >
                              {tier.title}
                            </span>
                          </div>
                          <div
                            className="flex w-full items-center justify-start overflow-hidden"
                            style={{
                              height: `${BONUS_ROW_DESC_SUBTITLE_HEIGHT_PX}px`,
                              marginTop: '-1px',
                              fontFamily: 'Inter, sans-serif',
                              lineHeight: 1,
                            }}
                          >
                            <span
                              className="block w-full min-w-0 whitespace-nowrap text-left font-medium"
                              style={{ fontSize: `${BONUS_ROW_DESC_SUBTITLE_FONT_REM}rem`, color: subtitleColor }}
                            >
                              {tier.subtitle}
                            </span>
                          </div>
                        </div>
                        {isInProgress && (() => {
                          const { numerator, denominator } = getInProgressTierFraction(
                            tier.potCount,
                            goldenPotCount,
                          );
                          return (
                            <div
                              className="pointer-events-none absolute flex items-center justify-center"
                              style={{
                                right: BONUS_ROW_PROGRESS_RIGHT_PX,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: `${BONUS_ROW_PROGRESS_FONT_REM}rem`,
                                fontWeight: 900,
                                lineHeight: 1,
                                color: BONUS_ENABLED_SUBTITLE_COLOR,
                              }}
                              aria-label={`${numerator} of ${denominator} golden pots`}
                            >
                              {`${numerator}/${denominator}`}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                  </div>
                </div>

                <p
                  className="font-medium text-center leading-relaxed italic w-full whitespace-nowrap"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    marginTop: '24px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: '1.55rem',
                  }}
                >
                  Bonuses shared across all gardens
                </p>
              </div>
            </div>
          </PopupPrescaleFrame>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="absolute right-6 w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              top: POPUP_CLOSE_TOP_PX,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#c2b280',
              zIndex: 105,
              ...POPUP_CLOSE_HIT_TARGET,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
