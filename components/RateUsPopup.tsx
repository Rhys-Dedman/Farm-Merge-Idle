/**
 * Rate Us popup — discovery-style card without plant subtitle / reward row.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { LeafBurst, LEAF_BURST_SMALL_COUNT } from './LeafBurst';
import { PopupVectorBackground } from './PopupVectorBackground';
import { PopupPrescaleFrame } from './PopupPrescaleFrame';
import { shouldPlayPopupLeafBurst } from '../utils/performanceMode';
import { hapticTap } from '../utils/haptics';

const LEAF_SPRITES = [
  assetPath('/assets/vfx/particle_leaf_yellow_1.png'),
  assetPath('/assets/vfx/particle_leaf_yellow_2.png'),
];

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

const POPUP_LEAF_COUNT = 40;
const POPUP_LEAF_MIN_LIFETIME_MS = 250;
const POPUP_LEAF_MAX_LIFETIME_MS = 1000;
const POPUP_CLOSE_MS = 200;
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
      spawnY = pos - POPUP_WIDTH - POPUP_HEIGHT / 2;
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
      size: 20 + Math.random() * 20,
      lifetime:
        POPUP_LEAF_MIN_LIFETIME_MS +
        Math.random() * (POPUP_LEAF_MAX_LIFETIME_MS - POPUP_LEAF_MIN_LIFETIME_MS),
      delay: 0,
      spawnX,
      spawnY,
    };
  });
}

const STAR_ICON_BROWN = assetPath('/assets/icons/rateus/icon_star_brown.png');
const STAR_ICON_GOLD = assetPath('/assets/icons/rateus/icon_star_gold.png');
const HEADER_ICON = assetPath('/assets/icons/rateus/icon_star_gold.png');
const HEADER_ICON_PX = 70;
const STAR_ICON_PX = 90;
const STAR_COUNT = 5;
const TITLE_TEXT = 'Rate Us';
/** Divider row in 0.5× prescale panel (matches loaded yellow divider art). */
const RATE_US_DIVIDER_ROW_MIN_HEIGHT_PX = 40;

/** Matches UpgradeList purchase button when maxed / can't afford (disabled brown). */
const UPGRADE_PANEL_DISABLED_BUTTON = {
  bg: '#e3c28c',
  border: '#c7a36e',
  text: '#a68e64',
} as const;

/** Discovery / limited-offer green CTA */
const RATE_NOW_BUTTON_ACTIVE = {
  bg: '#b8d458',
  border: '#8fb33a',
  text: '#4a6b1e',
  pressedBg: '#9fc044',
} as const;

const STAR_STAGGER_MS = 50;
const STAR_BOUNCE_MS = 200;

/** Discovery popup plant-name subtitle styling. */
const PLANT_NAME_TITLE_COLOR = '#5c4a32';

interface RateUsPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onUserDismiss?: () => void;
  /** X / backdrop close without completing — popup may return later (see App). */
  onDismissWithoutComplete?: () => void;
  /** 5th star: open store review flow immediately (fake URL for now). */
  onFifthStarChosen?: () => void;
  /** 1–4 stars + Rate Now: close Rate Us; parent shows thank-you confirmation. */
  onLowRatingRateNow?: () => void;
  closeOnBackdropClick?: boolean;
  appScale?: number;
}

export const RateUsPopup: React.FC<RateUsPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  onDismissWithoutComplete,
  onFifthStarChosen,
  onLowRatingRateNow,
  closeOnBackdropClick = true,
  appScale = 1,
}) => {
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [assetsReady, setAssetsReady] = useState(false);
  const [leaves, setLeaves] = useState<LeafParticle[]>([]);
  const [leafPositions, setLeafPositions] = useState<
    { x: number; y: number; opacity: number; rotation: number; scale: number }[]
  >([]);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const leafRafRef = useRef<number>(0);
  const leafStartTimeRef = useRef<number>(0);
  const leafPosRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      opacity: number;
      rotation: number;
      scale: number;
      started: boolean;
    }[]
  >([]);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);
  const starButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const staggerTimersRef = useRef<number[]>([]);
  const revealSequenceRef = useRef(0);

  const [selectedRating, setSelectedRating] = useState(0);
  const [revealedGold, setRevealedGold] = useState<boolean[]>(() => Array(STAR_COUNT).fill(false));
  const [starBursts, setStarBursts] = useState<
    { id: string; x: number; y: number; startTime: number }[]
  >([]);
  const [rateNowPressed, setRateNowPressed] = useState(false);

  const clearRevealTimers = useCallback(() => {
    staggerTimersRef.current.forEach((t) => window.clearTimeout(t));
    staggerTimersRef.current = [];
  }, []);

  const resetStarSelection = useCallback(() => {
    clearRevealTimers();
    revealSequenceRef.current += 1;
    setRevealedGold(Array(STAR_COUNT).fill(false));
    setStarBursts([]);
    setSelectedRating(0);
  }, [clearRevealTimers]);

  const handleStarClick = useCallback(
    (index: number) => {
      hapticTap();
      if (index === STAR_COUNT - 1) {
        clearRevealTimers();
        onFifthStarChosen?.();
        return;
      }

      const rating = index + 1;
      clearRevealTimers();
      revealSequenceRef.current += 1;
      const seq = revealSequenceRef.current;

      setRevealedGold(Array(STAR_COUNT).fill(false));
      setStarBursts([]);
      setSelectedRating(rating);

      for (let i = 0; i < rating; i++) {
        const timer = window.setTimeout(() => {
          if (revealSequenceRef.current !== seq) return;

          setRevealedGold((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });

          const el = starButtonRefs.current[i];
          if (el && shouldPlayPopupLeafBurst()) {
            const r = el.getBoundingClientRect();
            setStarBursts((prev) => [
              ...prev,
              {
                id: `rate-us-star-burst-${seq}-${i}-${Date.now()}`,
                x: r.left + r.width / 2,
                y: r.top + r.height / 2,
                startTime: Date.now(),
              },
            ]);
          }
        }, i * STAR_STAGGER_MS);
        staggerTimersRef.current.push(timer);
      }
    },
    [clearRevealTimers, onFifthStarChosen],
  );

  const handleRateNowClick = useCallback(() => {
    if (selectedRating < 1 || selectedRating >= STAR_COUNT) return;
    onLowRatingRateNow?.();
  }, [selectedRating, onLowRatingRateNow]);

  useEffect(() => {
    if (!isVisible) {
      setAssetsReady(false);
      setRateNowPressed(false);
      return;
    }
    setAssetsReady(true);
  }, [isVisible]);

  // Keep gold stars visible through the leave animation; clear only once fully closed.
  useEffect(() => {
    if (animState === 'hidden') {
      resetStarSelection();
    }
  }, [animState, resetStarSelection]);

  useEffect(() => () => clearRevealTimers(), [clearRevealTimers]);

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
        p.opacity =
          leafElapsed < fadeStart ? 1 : Math.max(0, 1 - (leafElapsed - fadeStart) / fadeDuration);
        p.scale = 1 - 0.2 * Math.min(1, leafElapsed / leaf.lifetime);
      });

      setLeafPositions(
        leafPosRef.current.map((p) => ({
          x: p.x,
          y: p.y,
          opacity: p.opacity,
          rotation: p.rotation,
          scale: p.scale,
        })),
      );
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
      setLeafPositions(
        newLeaves.map((leaf) => ({
          x: leaf.spawnX ?? 0,
          y: leaf.spawnY ?? 0,
          opacity: 1,
          rotation: 0,
          scale: 1,
        })),
      );
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

  const dismissWithoutAction = () => {
    if (animState === 'leaving' || animState === 'hidden' || isPopupEnterInteractionLocked(animState)) return;
    onUserDismiss?.();
    onDismissWithoutComplete?.();
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
  const titleFontSize = `min(4.375rem, ${580 / (TITLE_TEXT.length * 0.6)}px)`;
  const rateNowActive = selectedRating > 0 && selectedRating < STAR_COUNT;
  const rateNowButton = rateNowActive ? RATE_NOW_BUTTON_ACTIVE : UPGRADE_PANEL_DISABLED_BUTTON;

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
        onClick={closeOnBackdropClick ? dismissWithoutAction : undefined}
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
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
              `popupLeave ${POPUP_CLOSE_MS}ms ease-in forwards`,
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
            @keyframes rateUsStarBounce {
              0% { transform: scale(0.5); }
              35% { transform: scale(1.2); }
              65% { transform: scale(0.9); }
              100% { transform: scale(1); }
            }
          `}</style>

          {/* Header circle — discovery layout with gold star icon */}
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
              src={assetPath('/assets/ui/popup_header_yellow.png')}
              alt=""
              decoding="sync"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            />
            <img
              src={HEADER_ICON}
              alt=""
              decoding="sync"
              className="relative object-contain"
              style={{
                width: `${HEADER_ICON_PX}px`,
                height: `${HEADER_ICON_PX}px`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                marginTop: '-4px',
              }}
            />
          </div>

          <PopupPrescaleFrame
            creamHitTarget={false}
            prescaleWidthPx={640}
            style={{ marginTop: POPUP_CREAM_STACK_MARGIN_TOP_PX }}
          >
            <div
              style={{
                position: 'relative',
                padding: '150px 40px 60px 40px',
                ...POPUP_CREAM_HIT_TARGET,
              }}
            >
              <PopupVectorBackground style={{ filter: POPUP_CREAM_DROP_SHADOW_FILTER }} />
              <div className="relative z-[2] flex flex-col items-center">
                <h2
                  className="font-black tracking-tight text-center"
                  style={{
                    color: PLANT_NAME_TITLE_COLOR,
                    fontFamily: 'Inter, sans-serif',
                    marginTop: '-8px',
                    whiteSpace: 'nowrap',
                    width: 'fit-content',
                    maxWidth: '580px',
                    fontSize: titleFontSize,
                  }}
                >
                  {TITLE_TEXT}
                </h2>

                <div
                  className="w-full flex items-center justify-center"
                  style={{
                    marginTop: '8px',
                    marginBottom: '24px',
                    minHeight: RATE_US_DIVIDER_ROW_MIN_HEIGHT_PX,
                  }}
                >
                  <img
                    src={assetPath('/assets/ui/popup_divider_yellow.png')}
                    alt=""
                    decoding="sync"
                    className="h-auto object-contain"
                    style={{ width: '520px', maxHeight: RATE_US_DIVIDER_ROW_MIN_HEIGHT_PX }}
                  />
                </div>

                <div
                  className="flex flex-row items-center justify-center"
                  style={{
                    marginTop: '8px',
                    marginBottom: '20px',
                    marginLeft: '-40px',
                    marginRight: '-40px',
                    width: 'calc(100% + 80px)',
                    minHeight: STAR_ICON_PX,
                    gap: '12px',
                  }}
                  role="group"
                  aria-label="Rate your experience"
                >
                  {Array.from({ length: STAR_COUNT }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      ref={(el) => {
                        starButtonRefs.current[i] = el;
                      }}
                      onClick={() => handleStarClick(i)}
                      className="relative shrink-0 p-0 border-0 bg-transparent cursor-pointer transition-transform hover:scale-105 active:scale-95"
                      style={{ width: STAR_ICON_PX, height: STAR_ICON_PX }}
                      aria-label={`${i + 1} star${i === 0 ? '' : 's'}`}
                      aria-pressed={revealedGold[i]}
                    >
                      <img
                        src={STAR_ICON_BROWN}
                        alt=""
                        decoding="sync"
                        draggable={false}
                        className="object-contain w-full h-full pointer-events-none"
                      />
                      {revealedGold[i] ? (
                        <img
                          src={STAR_ICON_GOLD}
                          alt=""
                          decoding="sync"
                          draggable={false}
                          className="absolute inset-0 object-contain w-full h-full pointer-events-none"
                          style={{
                            animation: `rateUsStarBounce ${STAR_BOUNCE_MS}ms ease-out forwards`,
                          }}
                        />
                      ) : null}
                    </button>
                  ))}
                </div>

                <p
                  className="font-medium text-center leading-relaxed italic w-full"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: '2rem',
                    minHeight: '4.5rem',
                  }}
                >
                  Please let us know how you are enjoying the game
                </p>

                <div style={{ height: '80px', flexShrink: 0 }} />

                <button
                  type="button"
                  disabled={!rateNowActive}
                  aria-disabled={!rateNowActive}
                  onClick={handleRateNowClick}
                  onMouseDown={() => rateNowActive && setRateNowPressed(true)}
                  onMouseUp={() => setRateNowPressed(false)}
                  onMouseLeave={() => setRateNowPressed(false)}
                  className={`relative flex items-center justify-center rounded-xl transition-all ${
                    rateNowActive ? 'cursor-pointer active:translate-y-[4px] active:mb-[4px]' : 'cursor-default'
                  }`}
                  style={{
                    width: '360px',
                    height: '88px',
                    marginBottom: '0px',
                    backgroundColor: rateNowPressed && rateNowActive ? rateNowButton.pressedBg : rateNowButton.bg,
                    border: `4px solid ${rateNowButton.border}`,
                    borderRadius: '24px',
                    boxShadow: rateNowPressed && rateNowActive
                      ? 'inset 0 4px 8px rgba(0,0,0,0.15)'
                      : `0 8px 0 ${rateNowButton.border}, 0 12px 24px rgba(0,0,0,0.15)`,
                    transform: rateNowPressed && rateNowActive ? 'translateY(4px)' : 'translateY(0)',
                    pointerEvents: rateNowActive ? 'auto' : 'none',
                  }}
                >
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      color: rateNowButton.text,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '2rem',
                      textShadow: rateNowActive ? '0 2px 0 rgba(255,255,255,0.3)' : undefined,
                    }}
                  >
                    Rate Now
                  </span>
                </button>
              </div>
            </div>
          </PopupPrescaleFrame>

          <button
            type="button"
            onClick={dismissWithoutAction}
            className="absolute right-6 w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              top: POPUP_CLOSE_TOP_PX,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#c2b280',
              zIndex: 105,
              ...POPUP_CLOSE_HIT_TARGET,
            }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>
      </div>

      {starBursts.map((b) => (
        <LeafBurst
          key={b.id}
          x={b.x}
          y={b.y}
          startTime={b.startTime}
          particleCount={LEAF_BURST_SMALL_COUNT}
          useCircle
          spriteVariant="gold"
          burstScale={0.55}
          zIndex={110}
          spawnOffsetUpPx={0}
          appScale={appScale}
          onComplete={() => setStarBursts((prev) => prev.filter((x) => x.id !== b.id))}
        />
      ))}
    </div>
  );
};
