/**
 * Level Up Popup - Shown when player levels up.
 * Same layout as Discovery popup but with blue theme and particle_leaf_5/6.
 */
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { assetPath } from '../utils/assetPath';
import { formatCompactNumber } from '../utils/formatCompactNumber';
import { getGardenCoinIconPath } from '../utils/gardenAssets';
import { DEFAULT_GARDEN_ID, type GardenId } from '../constants/gardens';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight, POPUP_ENTER_MS, popupEnterInteractionPointerEvents, isPopupEnterInteractionLocked } from '../hooks/usePopupPreflightEnter';
import {
  POPUP_CREAM_STACK_MARGIN_TOP_PX,
  POPUP_HEADER_TOP_PX,
  popupAppScaleStyle,
  popupOverlayStyle,
} from '../constants/popupPointerEvents';
import { PopupVectorBackground } from './PopupVectorBackground';
import { PopupPrescaleFrame } from './PopupPrescaleFrame';
import {
  REWARD_OFFER_LINE_TEXT_COLOR,
  REWARD_PILL_FILL_COLOR,
  REWARD_PILL_HEIGHT_PX,
  REWARD_PILL_STROKE_COLOR,
  REWARD_PILL_STROKE_WIDTH_PX,
} from './Reward';
import { shouldPlayPopupLeafBurst } from '../utils/performanceMode';
import { LevelUpRewardTrack, INTRO_BUTTON_DELAY_MS } from './LevelUpRewardTrack';
import { shouldShowLevelUpRewardTrack } from './UpgradeList';
import { PopupRectLeafBurst } from './PopupRectLeafBurst';
import { playSfx, SFX_IDS } from '../utils/sfx';

/** Match DiscoveryPopup coin reward icon size (2× layout space). */
const LEVEL_UP_REWARD_ICON_PX = Math.round(40 * 1.15);

const LEAF_SPRITES = [assetPath('/assets/vfx/particle_leaf_blue_1.png'), assetPath('/assets/vfx/particle_leaf_blue_2.png')];

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

interface LevelUpPopupProps {
  isVisible: boolean;
  onClose: () => void;
  level?: number;
  /** Dynamic title based on what's being unlocked (e.g. "Storage Capacity") */
  title: string;
  /** Dynamic description (e.g. "You can now increase the amount of seeds you can store") */
  description: string;
  /** Icon path for header (matches the upgrade being unlocked) */
  icon: string;
  /** When set, shown inside the blue header circle instead of `icon` (e.g. PlantWithPot). */
  headerIcon?: React.ReactNode;
  onUnlockNow?: (rewardStartPoint?: { x: number; y: number }) => void;
  appScale?: number;
  /** When provided, show smaller text above title (e.g. "New Feature") */
  subtitle?: string;
  /** Button text (default "Unlock Now!") */
  buttonText?: string;
  /** Icon scale in header (default 1, use 0.8 for 80%) */
  iconScale?: number;
  /** When true, hide "Level X" (for info-style popups) */
  hideLevel?: boolean;
  /** Level ≥ 6: show Discovery-style reward pill (“Upgrades Available”). */
  showGoldenPotAvailableRow?: boolean;
  /** Garden coin reward amount (generic level-ups). Discovery-style pill. */
  rewardAmount?: number;
  /** Garden for coin icon when `rewardAmount` is set. */
  gardenId?: GardenId;
  /** When true after primary button tap, skip close animation (e.g. ad break playing). */
  shouldDeferPrimaryClose?: (rewardStartPoint?: { x: number; y: number }) => boolean;
  /**
   * Garden 1 level-2 only: intro that explains garden leveling (Garden Level copy +
   * track reveal scroll). Button starts disabled as “Lets go!” until the reveal finishes.
   */
  gardenLevelIntroFtue?: boolean;
  /** Increment to skip the garden-level intro reveal (dev Shift+T). */
  introSkipNonce?: number;
};

const POPUP_LEAF_COUNT = 40;
const POPUP_LEAF_MIN_LIFETIME_MS = 250;
const POPUP_LEAF_MAX_LIFETIME_MS = 1000;
const POPUP_WIDTH = 260;
/** Slightly taller leaf burst to cover cream card with reward track. */
const POPUP_HEIGHT = 380;
const POPUP_CLOSE_MS = 200;

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
      size: 20 + Math.random() * 20,
      lifetime: POPUP_LEAF_MIN_LIFETIME_MS + Math.random() * (POPUP_LEAF_MAX_LIFETIME_MS - POPUP_LEAF_MIN_LIFETIME_MS),
      delay: 0,
      spawnX,
      spawnY,
    };
  });
}

export const LevelUpPopup: React.FC<LevelUpPopupProps> = ({
  isVisible,
  onClose,
  level = 1,
  title,
  description,
  icon,
  headerIcon,
  onUnlockNow,
  appScale = 1,
  subtitle,
  buttonText = 'Unlock Now!',
  iconScale = 1,
  hideLevel = false,
  showGoldenPotAvailableRow = false,
  rewardAmount,
  gardenId = DEFAULT_GARDEN_ID,
  shouldDeferPrimaryClose,
  gardenLevelIntroFtue = false,
  introSkipNonce = 0,
}) => {
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [assetsReady, setAssetsReady] = useState(false);
  const [leaves, setLeaves] = useState<LeafParticle[]>([]);
  const [leafPositions, setLeafPositions] = useState<{ x: number; y: number; opacity: number; rotation: number; scale: number }[]>([]);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const [buttonPressed, setButtonPressed] = useState(false);
  const [introButtonReady, setIntroButtonReady] = useState(!gardenLevelIntroFtue);
  const [introButtonBounce, setIntroButtonBounce] = useState(false);
  const [introButtonLeafBurst, setIntroButtonLeafBurst] = useState<{
    id: string;
    rectWidth: number;
    rectHeight: number;
  } | null>(null);
  const leafRafRef = useRef<number>(0);
  const leafStartTimeRef = useRef<number>(0);
  const leafPosRef = useRef<{ x: number; y: number; vx: number; vy: number; opacity: number; rotation: number; scale: number; started: boolean }[]>([]);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);

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

      setLeafPositions(leafPosRef.current.map(p => ({ x: p.x, y: p.y, opacity: p.opacity, rotation: p.rotation, scale: p.scale })));
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

  const buttonRef = useRef<HTMLButtonElement>(null);
  const goldenPotRewardIconRef = useRef<HTMLImageElement>(null);
  const rewardCoinRef = useRef<HTMLImageElement>(null);

  const handleButtonClick = () => {
    if (isPopupEnterInteractionLocked(animState)) return;
    if (gardenLevelIntroFtue && !introButtonReady) return;
    let startPoint: { x: number; y: number } | undefined;
    if (rewardCoinRef.current) {
      const r = rewardCoinRef.current.getBoundingClientRect();
      startPoint = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    } else if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      startPoint = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    if (shouldDeferPrimaryClose?.(startPoint)) return;
    onUnlockNow?.(startPoint);
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  const handleIntroRevealComplete = useCallback((opts?: { immediate?: boolean }) => {
    if (!gardenLevelIntroFtue) return;
    const immediate = opts?.immediate === true;
    const runButtonReveal = () => {
      // Same SFX as collection FTUE FREE button reveal.
      playSfx(SFX_IDS.popupLevelUp);
      setIntroButtonBounce(true);
      const btn = buttonRef.current;
      if (btn && shouldPlayPopupLeafBurst()) {
        const w = btn.offsetWidth;
        const h = btn.offsetHeight;
        if (w > 0 && h > 0) {
          setIntroButtonLeafBurst({
            id: `level-up-intro-lb-${Date.now()}`,
            rectWidth: w,
            rectHeight: h,
          });
        }
      }
      // Flip to enabled blue on the next frame so the color transition plays during bounce.
      window.setTimeout(() => setIntroButtonReady(true), 16);
      window.setTimeout(() => setIntroButtonBounce(false), 320);
    };
    if (immediate || introButtonReady) {
      if (!introButtonReady) {
        setIntroButtonReady(true);
      }
      return;
    }
    // After selected bounce, wait 0.25s before bouncing the Lets go button.
    window.setTimeout(runButtonReveal, INTRO_BUTTON_DELAY_MS);
  }, [gardenLevelIntroFtue, introButtonReady]);

  useEffect(() => {
    if (!gardenLevelIntroFtue || introSkipNonce <= 0) return;
    handleIntroRevealComplete({ immediate: true });
  }, [introSkipNonce, gardenLevelIntroFtue, handleIntroRevealComplete]);

  if (animState === 'hidden') return null;

  const isPreflight = animState === 'preflight';
  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  const buttonDisabled = gardenLevelIntroFtue && !introButtonReady;
  // Match collection FTUE disabled brown, then settle into level-up blue when ready.
  const buttonBgColor = buttonDisabled ? '#e3c28c' : '#89c8e1';
  const buttonBorderColor = buttonDisabled ? '#c7a36e' : '#6fa4c5';
  const buttonTextColor = buttonDisabled ? '#a68e64' : '#4580a8';
  const buttonPressedBg = '#7ab8d1';
  const displayTitle = gardenLevelIntroFtue ? 'Garden Level' : title;
  const displayDescription = gardenLevelIntroFtue
    ? 'Complete orders to level up your garden and unlock rewards'
    : description;
  const displayButtonText = gardenLevelIntroFtue ? "Lets go!" : buttonText;
  const displayLevelLabel = gardenLevelIntroFtue ? 'Level Up' : `Level ${level}`;
  const titleFontSize = gardenLevelIntroFtue ? '4.375rem' : '3.5rem';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={popupOverlayStyle({ pointerEvents: popupEnterInteractionPointerEvents(animState) })}
    >
      {/* Backdrop - tapping outside does NOT close */}
      <div
        className="absolute"
        style={{
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          opacity: isLeaving || isPreflight ? 0 : 1,
          transition: 'opacity 0.2s',
        }}
      />

      <div
        className="relative flex items-center justify-center"
        style={popupAppScaleStyle(appScale)}
      >
        {/* Leaf Burst VFX - particle_leaf_5 & 6 */}
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
                      background: 'linear-gradient(135deg, #559dcf 0%, #89c8e1 100%)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  />
                ) : (
                  <img
                    src={leaf.sprite}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                    onError={() => setImgFailed(prev => ({ ...prev, [i]: true }))}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Popup Container */}
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
          `}</style>

          {/* Header Circle - popup_header_blue */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              top: `${POPUP_HEADER_TOP_PX}px`,
              zIndex: 104,
            }}
          >
            <img
              src={assetPath('/assets/ui/popup_header_blue.png')}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            />
            {headerIcon != null ? (
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: `${75 * iconScale}px`,
                  height: `${75 * iconScale}px`,
                  marginTop: '-4px',
                }}
              >
                {headerIcon}
              </div>
            ) : (
              <img
                src={icon}
                alt=""
                className="relative object-contain"
                style={{
                  width: `${75 * iconScale}px`,
                  height: `${75 * iconScale}px`,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  marginTop: '-4px',
                }}
              />
            )}
          </div>

          <PopupPrescaleFrame
            prescaleWidthPx={640}
            style={{ marginTop: POPUP_CREAM_STACK_MARGIN_TOP_PX }}
          >
            <div
              style={{
                position: 'relative',
                filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.3))',
                padding: '150px 40px 60px 40px',
              }}
            >
              <PopupVectorBackground />
              <div className="relative z-[2] flex flex-col items-center">
                {/* Title - "Level X" (hidden when hideLevel) */}
                {!hideLevel && (
                  <h2
                    className="font-normal text-center"
                    style={{
                      color: '#c2b280',
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '-0.02em',
                      fontSize: '2.25rem',
                    }}
                  >
                    {displayLevelLabel}
                  </h2>
                )}

                {/* Subtitle - smaller text above main title (e.g. "New Feature") */}
                {subtitle && (
                  <h2
                    className="font-normal text-center"
                    style={{
                      color: '#76a0b7',
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '-0.02em',
                      fontSize: '2rem',
                      marginTop: hideLevel ? '0' : '-8px',
                    }}
                  >
                    {subtitle}
                  </h2>
                )}

                {/* Main title - dynamic (e.g. "Storage Capacity" or "Seeds Evolve!") */}
                <h3
                  className="font-black tracking-tight text-center"
                  style={{
                    color: '#5c4a32',
                    fontFamily: 'Inter, sans-serif',
                    marginTop: subtitle ? '4px' : '-8px',
                    fontSize: titleFontSize,
                  }}
                >
                  {displayTitle}
                </h3>

                {/* Divider - popup_divider_Blue */}
                <div className="w-full flex items-center justify-center" style={{ marginTop: '8px', marginBottom: '24px' }}>
                  <img
                    src={assetPath('/assets/ui/popup_divider_blue.png')}
                    alt=""
                    className="h-auto object-contain"
                    style={{ width: '520px' }}
                  />
                </div>

                {/* Description - dynamic (e.g. "You can now increase the amount of seeds you can store") */}
                <p
                  className="font-medium text-center leading-relaxed italic w-full"
                  style={{
                    color: '#76a0b7',
                    fontFamily: 'Inter, sans-serif',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: '2rem',
                  }}
                >
                  {displayDescription}
                </p>

                {!hideLevel &&
                  level != null &&
                  (gardenLevelIntroFtue || shouldShowLevelUpRewardTrack(level, gardenId)) && (
                  <LevelUpRewardTrack
                    currentLevel={level}
                    gardenId={gardenId}
                    introReveal={gardenLevelIntroFtue}
                    introRevealPlay={gardenLevelIntroFtue && animState === 'visible'}
                    introSkipNonce={introSkipNonce}
                    onIntroRevealComplete={
                      gardenLevelIntroFtue
                        ? () => handleIntroRevealComplete()
                        : undefined
                    }
                  />
                )}

                {showGoldenPotAvailableRow && (
                  <div className="flex items-center justify-center" style={{ marginTop: '12px' }}>
                    <div
                      className="inline-flex items-center justify-center box-border rounded-full"
                      style={{
                        backgroundColor: REWARD_PILL_FILL_COLOR,
                        border: `${REWARD_PILL_STROKE_WIDTH_PX * 2}px solid ${REWARD_PILL_STROKE_COLOR}`,
                        minHeight: `${REWARD_PILL_HEIGHT_PX * 2}px`,
                        minWidth: '420px',
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingLeft: 20,
                        paddingRight: 24,
                        gap: '10px',
                      }}
                    >
                      <img
                        ref={goldenPotRewardIconRef}
                        src={assetPath('/assets/icons/collection/icon_goldenpot.png')}
                        alt=""
                        className="object-contain shrink-0"
                        style={{
                          width: `${LEVEL_UP_REWARD_ICON_PX}px`,
                          height: `${LEVEL_UP_REWARD_ICON_PX}px`,
                        }}
                      />
                      <span
                        className="font-black tracking-tight whitespace-nowrap"
                        style={{
                          color: REWARD_OFFER_LINE_TEXT_COLOR,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '2rem',
                          lineHeight: 1,
                        }}
                      >
                        Upgrades Available
                      </span>
                    </div>
                  </div>
                )}

                {rewardAmount != null && rewardAmount > 0 && !showGoldenPotAvailableRow && (
                  <div className="flex items-center justify-center" style={{ marginTop: '12px' }}>
                    <div
                      className="inline-flex items-center justify-center box-border rounded-full"
                      style={{
                        backgroundColor: REWARD_PILL_FILL_COLOR,
                        border: `${REWARD_PILL_STROKE_WIDTH_PX * 2}px solid ${REWARD_PILL_STROKE_COLOR}`,
                        minHeight: `${REWARD_PILL_HEIGHT_PX * 2}px`,
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingLeft: 20,
                        paddingRight: 31,
                        gap: '10px',
                      }}
                    >
                      <img
                        ref={rewardCoinRef}
                        src={getGardenCoinIconPath(gardenId)}
                        alt=""
                        className="object-contain shrink-0"
                        style={{
                          width: `${LEVEL_UP_REWARD_ICON_PX}px`,
                          height: `${LEVEL_UP_REWARD_ICON_PX}px`,
                        }}
                      />
                      <span
                        className="font-black tracking-tight"
                        style={{
                          color: REWARD_OFFER_LINE_TEXT_COLOR,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '2rem',
                          lineHeight: 1,
                        }}
                      >
                        {formatCompactNumber(rewardAmount)}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className={`flex-grow ${
                    showGoldenPotAvailableRow || (rewardAmount != null && rewardAmount > 0)
                      ? 'min-h-[24px]'
                      : 'min-h-[28px]'
                  }`}
                />

                {/* Unlock Now / Lets go Button - blue (gray while garden-level intro runs) */}
                <div
                  className="relative flex items-center justify-center"
                  style={{ width: '360px' }}
                >
                  {/* Leaf burst sits outside the bounce transform so it does not scale with the button. */}
                  {introButtonLeafBurst && (
                    <div
                      className="absolute left-1/2 top-1/2 pointer-events-none"
                      style={{
                        width: introButtonLeafBurst.rectWidth,
                        height: introButtonLeafBurst.rectHeight,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 0,
                      }}
                    >
                      <PopupRectLeafBurst
                        key={introButtonLeafBurst.id}
                        rectWidth={introButtonLeafBurst.rectWidth}
                        rectHeight={introButtonLeafBurst.rectHeight}
                        spriteVariant="blue"
                        zIndex={0}
                        onComplete={() => setIntroButtonLeafBurst(null)}
                      />
                    </div>
                  )}
                  <button
                    ref={buttonRef}
                    type="button"
                    disabled={buttonDisabled}
                    onMouseDown={() => {
                      if (!buttonDisabled) setButtonPressed(true);
                    }}
                    onMouseUp={() => setButtonPressed(false)}
                    onMouseLeave={() => setButtonPressed(false)}
                    onClick={handleButtonClick}
                    className={`relative flex items-center justify-center rounded-xl${
                      introButtonBounce ? ' collection-ftue-free-button-bounce' : ''
                    }`}
                    style={{
                      width: '360px',
                      height: '88px',
                      marginBottom: '0px',
                      zIndex: 1,
                      backgroundColor:
                        !buttonDisabled && buttonPressed ? buttonPressedBg : buttonBgColor,
                      border: `4px solid ${buttonBorderColor}`,
                      borderRadius: '24px',
                      boxShadow:
                        buttonDisabled
                          ? `0 8px 0 ${buttonBorderColor}, 0 12px 24px rgba(0,0,0,0.12)`
                          : !buttonDisabled && buttonPressed
                            ? 'inset 0 4px 8px rgba(0,0,0,0.15)'
                            : `0 8px 0 ${buttonBorderColor}, 0 12px 24px rgba(0,0,0,0.15)`,
                      transform:
                        !buttonDisabled && buttonPressed ? 'translateY(4px)' : 'translateY(0)',
                      transition:
                        'background-color 320ms ease-out, border-color 320ms ease-out, color 320ms ease-out, box-shadow 320ms ease-out',
                      cursor: buttonDisabled ? 'default' : 'pointer',
                    }}
                  >
                    <span
                      className="font-bold tracking-tight"
                      style={{
                        color: buttonTextColor,
                        fontFamily: 'Inter, sans-serif',
                        textShadow: buttonDisabled ? 'none' : '0 2px 0 rgba(255,255,255,0.3)',
                        fontSize: '2rem',
                        transition: 'color 320ms ease-out',
                      }}
                    >
                      {displayButtonText}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </PopupPrescaleFrame>
        </div>
      </div>
    </div>
  );
};
