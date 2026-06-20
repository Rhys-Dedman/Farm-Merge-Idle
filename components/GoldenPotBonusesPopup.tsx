/**
 * Golden pot bonuses — discovery-style shell without plant subtitle or collect button.
 * Backdrop and X dismiss; shows golden pot count and bonus tier strip.
 */
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { assetPath } from '../utils/assetPath';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight } from '../hooks/usePopupPreflightEnter';
import { PopupVectorBackground } from './PopupVectorBackground';
import { PlantWithPot } from './PlantWithPot';
import {
  REWARD_PILL_HEIGHT_PX,
  REWARD_PILL_STROKE_COLOR,
  REWARD_PILL_STROKE_WIDTH_PX,
} from './Reward';
import {
  GOLDEN_POT_BONUS_TIER_THRESHOLDS,
  GOLDEN_POT_BONUS_TIERS,
  getGoldenPotBonusIconSlugForPotCount,
} from '../constants/goldenPotBonuses';
import { getCollectionBonusIconPath } from '../utils/gardenAssets';
import { COLLECTION_PLANT_COUNT } from '../constants/barnShelves';

const LEAF_SPRITES = [assetPath('/assets/vfx/particle_leaf_green_1.png'), assetPath('/assets/vfx/particle_leaf_green_2.png')];

const GOLDEN_POT_ICON_PX = Math.round(40 * 1.15) + 2;

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
  /** Plants that currently have a golden pot (mastered). */
  goldenPotCount: number;
  maxGoldenPots?: number;
  appScale?: number;
  /**
   * When opening right after unlocking this tier (e.g. 4), that row shows disabled until open settles,
   * then after 0.25s it pops to green with a small leaf burst.
   */
  revealTierPotCount?: number | null;
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
/** Flex center follows collapsed 0.5× layout height; nudge up so the card reads visually centered. */
const GOLDEN_POT_BONUSES_POPUP_CENTER_NUDGE_Y_PX = -96;

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
const BONUS_TIER_NUMBER_REM = 1.4;
const BONUS_TIER_NUMBER_COLOR = '#915c22';
const BONUS_TIER_NUMBER_LETTER_SPACING_EM = -0.08;
const BONUS_ROW_REWARD_ICON_PX = 56;
const BONUS_ROW_REWARD_ICON_LEFT = 'calc(3% + 9px)';
const BONUS_ROW_DESC_BOX_WIDTH_PX = 318;
const BONUS_ROW_DESC_BOX_OFFSET_Y_PX = 4;
const BONUS_ROW_DESC_TITLE_HEIGHT_PX = 45;
const BONUS_ROW_DESC_SUBTITLE_HEIGHT_PX = 25;
const BONUS_ROW_DESC_TITLE_FONT_REM = 2.1;
const BONUS_ROW_DESC_SUBTITLE_FONT_REM = 1.55;
const BONUS_ENABLED_TITLE_COLOR = '#62863b';
const BONUS_ENABLED_SUBTITLE_COLOR = '#9eb643';
const BONUS_LOCKED_TITLE_COLOR = '#765041';
const BONUS_LOCKED_SUBTITLE_COLOR = '#c6b280';

const GOLD_POT_BONUS_TIERS_DISPLAY = GOLDEN_POT_BONUS_TIERS.map((tier, i) => ({
  ...tier,
  displayKey: `golden-pot-bonus-row-${i}`,
}));

function getCompletedGoldenPotBonusCount(goldenPotCount: number): number {
  return GOLDEN_POT_BONUS_TIER_THRESHOLDS.filter((threshold) => goldenPotCount >= threshold).length;
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

export const GoldenPotBonusesPopup: React.FC<GoldenPotBonusesPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  goldenPotCount,
  maxGoldenPots = COLLECTION_PLANT_COUNT,
  appScale = 1,
  revealTierPotCount = null,
}) => {
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

  const clampedCount = Math.max(0, Math.min(maxGoldenPots, goldenPotCount));
  const completedBonusCount = getCompletedGoldenPotBonusCount(clampedCount);
  const countLabel = `${clampedCount}/${maxGoldenPots}`;

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
    setAnimState('entering');
    setTimeout(() => setAnimState('visible'), 250);
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
    const idBase = Date.now();
    const burst = createBonusRowPillLeaves(idBase);
    setRowBurstLeaves(burst);
    const clearT = setTimeout(() => setRowBurstLeaves([]), 720);
    return () => clearTimeout(clearT);
  }, [tierRevealArmed, revealTierPotCount]);

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
    if (isClosing || animState === 'leaving') return;
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
      style={{ zIndex: 100, overflow: 'hidden', pointerEvents: isPreflight ? 'none' : 'auto' }}
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
        style={{
          transform: `translateY(${GOLDEN_POT_BONUSES_POPUP_CENTER_NUDGE_Y_PX}px) scale(${appScale})`,
          transformOrigin: 'center center',
        }}
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
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              'popupEnter 250ms ease-out forwards',
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
              top: '-20px',
              zIndex: 104,
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
              <PlantWithPot level={1} mastered wrapperClassName="h-full w-full" />
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              marginTop: '36px',
              width: '640px',
              transform: 'scale(0.5)',
              transformOrigin: 'top center',
              marginBottom: '-575px',
            }}
          >
            <div
              style={{
                position: 'relative',
                filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.3))',
                padding: '150px 40px 63px 40px',
              }}
            >
              <PopupVectorBackground />
              <div className="relative z-[2] flex flex-col items-center">
                <h2
                  className="font-black tracking-tight text-center"
                  style={{
                    color: SUBTITLE_COLOR,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '4.375rem',
                    lineHeight: 1.05,
                  }}
                >
                  Golden Pots
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
                  Collect golden pots to unlock powerful bonuses.
                </p>

                <div className="flex items-center justify-center" style={{ marginTop: '20px' }}>
                  <div
                    className="inline-flex items-center justify-center box-border rounded-full"
                    style={{
                      backgroundColor: '#775041',
                      border: `${REWARD_PILL_STROKE_WIDTH_PX * 2}px solid ${REWARD_PILL_STROKE_COLOR}`,
                      minHeight: `${REWARD_PILL_HEIGHT_PX * 2 - 5}px`,
                      paddingTop: 8,
                      paddingBottom: 7,
                      paddingLeft: 20,
                      paddingRight: 31,
                      gap: '10px',
                    }}
                  >
                    <img
                      src={assetPath('/assets/icons/collection/icon_goldenpot.png')}
                      alt=""
                      className="object-contain shrink-0"
                      style={{ width: `${GOLDEN_POT_ICON_PX}px`, height: `${GOLDEN_POT_ICON_PX}px` }}
                    />
                    <span
                      className="font-black tracking-tight"
                      style={{
                        color: '#fcf0c7',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '2rem',
                        lineHeight: 1,
                      }}
                    >
                      {countLabel}
                    </span>
                  </div>
                </div>

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
                  {GOLD_POT_BONUS_TIERS_DISPLAY.map((tier, tierIndex) => {
                    const rowIsCompleted = tierIndex < completedBonusCount;
                    const isStagedRevealRow =
                      revealTierPotCount != null &&
                      revealTierPotCount === tier.potCount &&
                      tierIndex === completedBonusCount - 1;
                    const showAsUnlocked = rowIsCompleted && (!isStagedRevealRow || tierRevealArmed);
                    const rewardIconSrc = getCollectionBonusIconPath(
                      getGoldenPotBonusIconSlugForPotCount(tier.potCount)
                    );
                    const bonusSprite = showAsUnlocked
                      ? assetPath('/assets/ui/popup_bonuses_enabled.png')
                      : assetPath('/assets/ui/popup_bonuses_disabled.png');
                    const titleColor = showAsUnlocked ? BONUS_ENABLED_TITLE_COLOR : BONUS_LOCKED_TITLE_COLOR;
                    const subtitleColor = showAsUnlocked ? BONUS_ENABLED_SUBTITLE_COLOR : BONUS_LOCKED_SUBTITLE_COLOR;
                    const playRowPop = isStagedRevealRow && tierRevealArmed;
                    return (
                      <div
                        key={tier.displayKey}
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
                        {!showAsUnlocked && (
                          <div
                            className="pointer-events-none absolute flex items-center justify-center rounded-lg font-bold box-border text-center"
                            style={{
                              right: 'calc(4% + 4px)',
                              top: 'calc(22% + 12px)',
                              padding: '10px 13px',
                              width: '3.45rem',
                              maxWidth: '3.45rem',
                              backgroundColor: 'transparent',
                              color: BONUS_TIER_NUMBER_COLOR,
                              fontFamily: 'Inter, sans-serif',
                              fontSize: `${BONUS_TIER_NUMBER_REM}rem`,
                              letterSpacing: `${BONUS_TIER_NUMBER_LETTER_SPACING_EM}em`,
                              lineHeight: 1,
                            }}
                          >
                            {tier.potCount}
                          </div>
                        )}
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
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="absolute top-[56px] right-6 w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#c2b280',
              zIndex: 105,
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
