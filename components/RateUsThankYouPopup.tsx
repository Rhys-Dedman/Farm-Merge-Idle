/**
 * Rate Us thank-you confirmation — same card shell as RateUsPopup, no star row.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight } from '../hooks/usePopupPreflightEnter';
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
import { playSfx, SFX_IDS } from '../utils/sfx';

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

const HEADER_ICON = assetPath('/assets/icons/rateus/icon_star_gold_completed.png');
const HEADER_ICON_PX = 70;
const TITLE_TEXT = 'Thank You';
const DESCRIPTION_TEXT = 'We appreciate your feedback!';
const RATE_US_DIVIDER_ROW_MIN_HEIGHT_PX = 40;

const OKAY_BUTTON = {
  bg: '#b8d458',
  border: '#8fb33a',
  text: '#4a6b1e',
  pressedBg: '#9fc044',
} as const;

const PLANT_NAME_TITLE_COLOR = '#5c4a32';

interface RateUsThankYouPopupProps {
  isVisible: boolean;
  onClose: () => void;
  /** OK, X, or backdrop — Rate Us flow never shown again. */
  onDismissForever?: () => void;
  onUserDismiss?: () => void;
  closeOnBackdropClick?: boolean;
  appScale?: number;
}

export const RateUsThankYouPopup: React.FC<RateUsThankYouPopupProps> = ({
  isVisible,
  onClose,
  onDismissForever,
  onUserDismiss,
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
  const [okayPressed, setOkayPressed] = useState(false);
  const dismissForeverCalledRef = useRef(false);

  const callDismissForeverOnce = useCallback(() => {
    if (dismissForeverCalledRef.current) return;
    dismissForeverCalledRef.current = true;
    onDismissForever?.();
  }, [onDismissForever]);

  useEffect(() => {
    if (!isVisible) {
      setAssetsReady(false);
      setOkayPressed(false);
      dismissForeverCalledRef.current = false;
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
    setAnimState('entering');
    setTimeout(() => setAnimState('visible'), 250);
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

  const dismiss = () => {
    if (animState === 'leaving' || animState === 'hidden' || animState === 'preflight') return;
    callDismissForeverOnce();
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  const dismissWithDeclineSfx = () => {
    onUserDismiss?.();
    dismiss();
  };

  const handleOkayClick = () => {
    playSfx(SFX_IDS.uiConfirmNormal);
    dismiss();
  };

  if (animState === 'hidden') return null;

  const isPreflight = animState === 'preflight';
  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';
  const titleFontSize = `min(4.375rem, ${580 / (TITLE_TEXT.length * 0.6)}px)`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={popupOverlayStyle({ pointerEvents: isPreflight ? 'none' : 'auto' })}
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
        onClick={closeOnBackdropClick ? dismissWithDeclineSfx : undefined}
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
              'popupEnter 250ms ease-out forwards',
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

                <p
                  className="font-medium text-center leading-relaxed italic w-full"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: '2rem',
                    minHeight: '4.5rem',
                    marginTop: '8px',
                    marginBottom: '8px',
                  }}
                >
                  {DESCRIPTION_TEXT}
                </p>

                <div style={{ height: '16px', flexShrink: 0 }} />

                <button
                  type="button"
                  onClick={handleOkayClick}
                  onMouseDown={() => setOkayPressed(true)}
                  onMouseUp={() => setOkayPressed(false)}
                  onMouseLeave={() => setOkayPressed(false)}
                  className="relative flex items-center justify-center rounded-xl transition-all cursor-pointer active:translate-y-[4px] active:mb-[4px]"
                  style={{
                    width: '360px',
                    height: '88px',
                    marginBottom: '0px',
                    backgroundColor: okayPressed ? OKAY_BUTTON.pressedBg : OKAY_BUTTON.bg,
                    border: `4px solid ${OKAY_BUTTON.border}`,
                    borderRadius: '24px',
                    boxShadow: okayPressed
                      ? 'inset 0 4px 8px rgba(0,0,0,0.15)'
                      : `0 8px 0 ${OKAY_BUTTON.border}, 0 12px 24px rgba(0,0,0,0.15)`,
                    transform: okayPressed ? 'translateY(4px)' : 'translateY(0)',
                  }}
                >
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      color: OKAY_BUTTON.text,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '2rem',
                      textShadow: '0 2px 0 rgba(255,255,255,0.3)',
                    }}
                  >
                    Okay
                  </span>
                </button>
              </div>
            </div>
          </PopupPrescaleFrame>

          <button
            type="button"
            onClick={dismissWithDeclineSfx}
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
    </div>
  );
};
