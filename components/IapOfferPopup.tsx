/**
 * Premium **IAP Offer** pre-purchase shell (purple/red top band + ring, shared layout).
 * Named product shells in App:
 * - **Starter Pack popup** — `StarterPackPopup` / `STORE_IAP_OFFER_STARTER_PACK_ID`
 * - **Field Pack popup** — `FieldPackPopup` / `STORE_IAP_OFFER_FIELD_PACK_ID`
 * - **Remove Ads popup** — this component with `STORE_IAP_OFFER_REMOVE_ADS_ID`
 * Post-purchase confirmation uses `PurchaseSuccessfulPopup` (plain panel, no premium band).
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
import { useLimitedOfferCountdown } from '../hooks/useLimitedOfferCountdown';
import { formatBundleLimitedCountdown } from '../utils/limitedOfferCountdown';
import { Reward, REWARD_INLINE_LAYOUT_HEIGHT_PX, REWARD_INLINE_WIDTH_PX, REWARD_PILL_HEIGHT_PX } from './Reward';
import { PopupPrescaleFrame } from './PopupPrescaleFrame';
import {
  PopupVectorBackground,
  PREMIUM_IAP_POPUP_TOP_ACCENT_BLUE,
  PREMIUM_IAP_POPUP_TOP_ACCENT_HEIGHT_PRESCALE_PX,
} from './PopupVectorBackground';
import type { PurchaseSuccessfulRewardRow } from './PurchaseSuccessfulPopup';
import { shouldPlayPopupLeafBurst } from '../utils/performanceMode';

/** Inner header product art — 85% of prior 94px treatment. */
const PURCHASE_SUCCESS_HEADER_ICON_PX = Math.round(94 * 0.85);

/** Matches existing popup `Reward` `scale(2)`. */
const PURCHASE_POPUP_REWARD_SCALE = 2;
/** Scaled strip layout box (440×44 → 880×88 visual). */
const PURCHASE_POPUP_REWARD_STRIP_SCALED_H_PX = REWARD_INLINE_LAYOUT_HEIGHT_PX * PURCHASE_POPUP_REWARD_SCALE;
/**
 * Gap from bottom of one pill to top of next (inner panel px). With `transformOrigin: top center`,
 * pill spans ~Y −4…64 in each strip → step (64 + gap − (−4)) = 68 + gap per row anchor.
 */
const PURCHASE_POPUP_REWARD_PILL_GAP_PX = 4;
const PURCHASE_POPUP_REWARD_STACK_STEP_PX =
  REWARD_PILL_HEIGHT_PX * PURCHASE_POPUP_REWARD_SCALE + PURCHASE_POPUP_REWARD_PILL_GAP_PX;

const DEFAULT_IAP_LEAF_BURST_SPRITES = [
  assetPath('/assets/vfx/particle_leaf_green_1.png'),
  assetPath('/assets/vfx/particle_leaf_green_2.png'),
];
const STARTER_PACK_IAP_LEAF_BURST_SPRITES = [
  assetPath('/assets/vfx/particle_leaf_purple_1.png'),
  assetPath('/assets/vfx/particle_leaf_purple_2.png'),
];
const REMOVE_ADS_IAP_LEAF_BURST_SPRITES = [
  assetPath('/assets/vfx/particle_leaf_red_1.png'),
  assetPath('/assets/vfx/particle_leaf_red_2.png'),
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

/** One reward strip — same props as store `Reward` (pill + icon + text + divider + duration). */
export type IapOfferRewardRow = PurchaseSuccessfulRewardRow;

export interface IapOfferPopupProps {
  isVisible: boolean;
  onClose: () => void;
  /** Fired when the player dismisses via X or backdrop (not purchase). */
  onUserDismiss?: () => void;
  title: string;
  /** Main product icon in header (see `PURCHASE_SUCCESS_HEADER_ICON_PX`). */
  headerImageSrc: string;
  rewards: IapOfferRewardRow[];
  priceLabel: string;
  /** When set, shown left of `priceLabel` on the purchase button (strikethrough), same text color as the final price. */
  originalPriceLabel?: string;
  /** Fired with the purchase button’s screen rect before the success popup opens. */
  onPurchase?: (buttonRect: DOMRect) => void;
  appScale?: number;
  /** Optional body copy under title (Discovery-style: italic, `2rem`, `#c2b280`). */
  description?: string;
  /** Title `<h2>` color; default `#5c4a32`. */
  titleColor?: string;
  /** Header ring sprite path (pass `assetPath(...)`); default `popup_header.png`. */
  headerRingSrc?: string;
  /** Nudge title up (px, inner panel coords); negative moves up. */
  titleOffsetYPx?: number;
  /** Close (X) icon stroke color. */
  closeIconColor?: string;
  /** When both set, shows “Limited Offer: …” pill (live countdown) between title and description. */
  limitedOfferCountdownStorageKey?: string;
  limitedOfferCountdownDurationMs?: number;
  /** Override premium top band fill (default purple `#ba82d8`). */
  premiumIapTopAccentFill?: string;
  /** Override narrow inset ring on premium band (default `#ba82d8`). */
  premiumIapTopAccentStrokeNarrow?: string;
  /** Override wide (20px) inset ring on premium band (default `#995fb7`). */
  premiumIapTopAccentStrokeWide?: string;
  /** Leaf burst alternates two `particle_leaf_*` textures (`starter` → 11–12, `removeAds` → 9–10). */
  leafBurstVariant?: 'starter' | 'removeAds';
}

const POPUP_LEAF_COUNT = 40;
const POPUP_LEAF_MIN_LIFETIME_MS = 250;
const POPUP_LEAF_MAX_LIFETIME_MS = 1000;

// Popup dimensions for spawning leaves around the edge (slightly smaller than BG sprite so leaves start behind it)
const POPUP_WIDTH = 260;
const POPUP_HEIGHT = 320;
const POPUP_CLOSE_MS = 200;

function createPopupLeaves(sprites: readonly string[]): LeafParticle[] {
  return Array.from({ length: POPUP_LEAF_COUNT }, (_, i) => {
    // Spawn leaves around the rectangle edge of the popup
    const perimeter = 2 * (POPUP_WIDTH + POPUP_HEIGHT);
    const pos = (i / POPUP_LEAF_COUNT) * perimeter + Math.random() * 40;
    
    let spawnX: number;
    let spawnY: number;
    let outwardAngle: number;
    
    if (pos < POPUP_WIDTH) {
      // Top edge
      spawnX = pos - POPUP_WIDTH / 2;
      spawnY = -POPUP_HEIGHT / 2;
      outwardAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8; // Upward
    } else if (pos < POPUP_WIDTH + POPUP_HEIGHT) {
      // Right edge
      spawnX = POPUP_WIDTH / 2;
      spawnY = (pos - POPUP_WIDTH) - POPUP_HEIGHT / 2;
      outwardAngle = 0 + (Math.random() - 0.5) * 0.8; // Rightward
    } else if (pos < 2 * POPUP_WIDTH + POPUP_HEIGHT) {
      // Bottom edge
      spawnX = POPUP_WIDTH / 2 - (pos - POPUP_WIDTH - POPUP_HEIGHT);
      spawnY = POPUP_HEIGHT / 2;
      outwardAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.8; // Downward
    } else {
      // Left edge
      spawnX = -POPUP_WIDTH / 2;
      spawnY = POPUP_HEIGHT / 2 - (pos - 2 * POPUP_WIDTH - POPUP_HEIGHT);
      outwardAngle = Math.PI + (Math.random() - 0.5) * 0.8; // Leftward
    }
    
    return {
      id: i,
      sprite: sprites[i % sprites.length]!,
      angle: outwardAngle,
      speed: Math.random() * 600, // 0 to 600 - wide variety of speeds
      rotationSpeed: (Math.random() - 0.5) * 540,
      initialRotation: Math.random() * 360,
      size: 20 + Math.random() * 20, // 20-40px
      lifetime: POPUP_LEAF_MIN_LIFETIME_MS + Math.random() * (POPUP_LEAF_MAX_LIFETIME_MS - POPUP_LEAF_MIN_LIFETIME_MS),
      delay: 0, // All leaves shoot out at the same time
      spawnX,
      spawnY,
    };
  });
}

export const IapOfferPopup: React.FC<IapOfferPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  title,
  headerImageSrc,
  rewards,
  priceLabel,
  originalPriceLabel,
  onPurchase,
  appScale = 1,
  description,
  titleColor = '#5c4a32',
  headerRingSrc,
  titleOffsetYPx = 0,
  closeIconColor = '#c2b280',
  limitedOfferCountdownStorageKey,
  limitedOfferCountdownDurationMs,
  premiumIapTopAccentFill,
  premiumIapTopAccentStrokeNarrow,
  premiumIapTopAccentStrokeWide,
  leafBurstVariant,
}) => {
  const leafBurstSprites = useMemo(() => {
    if (leafBurstVariant === 'starter') return STARTER_PACK_IAP_LEAF_BURST_SPRITES;
    if (leafBurstVariant === 'removeAds') return REMOVE_ADS_IAP_LEAF_BURST_SPRITES;
    return DEFAULT_IAP_LEAF_BURST_SPRITES;
  }, [leafBurstVariant]);

  const limitedOfferRemainingMs = useLimitedOfferCountdown(
    limitedOfferCountdownStorageKey,
    limitedOfferCountdownDurationMs,
  );
  const showLimitedOfferPill =
    Boolean(limitedOfferCountdownStorageKey && limitedOfferCountdownDurationMs) &&
    limitedOfferRemainingMs > 0;

  const headerRing = headerRingSrc ?? assetPath('/assets/ui/popup_header.png');
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [assetsReady, setAssetsReady] = useState(false);
  const [leaves, setLeaves] = useState<LeafParticle[]>([]);
  const [leafPositions, setLeafPositions] = useState<{ x: number; y: number; opacity: number; rotation: number; scale: number }[]>([]);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const [buttonPressed, setButtonPressed] = useState(false);
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

  // Separate effect for leaf animation - runs independently of popup state
  useEffect(() => {
    if (leaves.length === 0) return;
    
    const tick = () => {
      const elapsed = Date.now() - leafStartTimeRef.current;
      
      // Check if all leaves are done
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
        const drag = 0.92; // Higher drag - slows down hard after initial burst

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
      const newLeaves = createPopupLeaves(leafBurstSprites);
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
  }, [leafBurstSprites]);

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

  const [isClosing, setIsClosing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const dismissPopup = () => {
    if (isClosing || isPopupEnterInteractionLocked(animState)) return;
    onUserDismiss?.();
    setIsClosing(true);
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  const handlePurchaseClick = () => {
    if (isClosing || isPopupEnterInteractionLocked(animState)) return;
    setIsClosing(true);
    if (onPurchase && buttonRef.current) {
      onPurchase(buttonRef.current.getBoundingClientRect());
    }
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

  const buttonBgColor = '#b8d458'; // Bright lime green
  const buttonBorderColor = '#8fb33a'; // Darker green border
  const buttonTextColor = '#4a6b1e'; // Dark green text
  const buttonPressedBg = '#9fc044';

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={popupOverlayStyle({ pointerEvents: popupEnterInteractionPointerEvents(animState) })}
    >
{/* Backdrop - not scaled, covers full screen */}
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
        onClick={dismissPopup}
        aria-hidden
      />

      {/* Scaled content wrapper */}
      <div
        className="relative flex items-center justify-center"
        style={popupAppScaleStyle(appScale)}
      >

      {/* Leaf Burst VFX */}
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
                  onError={() => setImgFailed(prev => ({ ...prev, [i]: true }))}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Popup Container - centered on screen with fixed dimensions */}
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
            0% {
              transform: scale(0.9);
              opacity: 0;
            }
            70% {
              transform: scale(1.05);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes popupLeave {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(0.9);
              opacity: 0;
            }
          }
        `}</style>
        {/* Header Circle - positioned to overlap top of popup */}
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
          {/* Header background sprite */}
          <img 
            src={headerRing} 
            alt="" 
            className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
          />
          {/* Plant image inside header */}
          <img 
            src={headerImageSrc} 
            alt="" 
            className="relative object-contain"
            style={{
              width: `${PURCHASE_SUCCESS_HEADER_ICON_PX}px`,
              height: `${PURCHASE_SUCCESS_HEADER_ICON_PX}px`,
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
              padding: '150px 40px 56px 40px',
              ...POPUP_CREAM_HIT_TARGET,
            }}
          >
            <PopupVectorBackground
              style={{ filter: POPUP_CREAM_DROP_SHADOW_FILTER }}
              premiumTopAccent={{
                heightPx: PREMIUM_IAP_POPUP_TOP_ACCENT_HEIGHT_PRESCALE_PX,
                backgroundColor: premiumIapTopAccentFill ?? PREMIUM_IAP_POPUP_TOP_ACCENT_BLUE,
                strokeNarrowColor: premiumIapTopAccentStrokeNarrow,
                strokeWideColor: premiumIapTopAccentStrokeWide,
              }}
            />
            {/* Content - doubled sizes since container is scaled 0.5x */}
            <div
              className="relative z-[2] flex flex-col items-center"
            >
          {/* Title — match Settings visual size: inner panel uses scale(0.5), so 2× rem vs Settings’ 2.25rem */}
          <h2
            className="font-black tracking-tight text-center"
            style={{
              color: titleColor,
              fontFamily: 'Inter, sans-serif',
              fontSize: '4.5rem',
              marginTop: titleOffsetYPx,
              marginBottom:
                description || limitedOfferCountdownStorageKey ? '8px' : '0',
            }}
          >
            {title}
          </h2>

          {showLimitedOfferPill ? (
            <div
              role="status"
              aria-live="polite"
              className="font-black tracking-tight text-center whitespace-nowrap rounded-full shadow-md"
              style={{
                backgroundColor: '#eb5761',
                color: '#fbefc6',
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.6rem',
                padding: '8px 22px',
                marginTop: '16px',
                marginBottom: '10px',
              }}
            >
              Limited Offer: {formatBundleLimitedCountdown(limitedOfferRemainingMs)}
            </div>
          ) : null}

          {description ? (
            <p
              className="font-medium text-center leading-relaxed italic w-full"
              style={{
                color: '#c2b280',
                fontFamily: 'Inter, sans-serif',
                paddingLeft: '24px',
                paddingRight: '24px',
                fontSize: '2rem',
                marginTop: showLimitedOfferPill ? '0' : '12px',
                marginBottom: '24px',
              }}
            >
              {description}
            </p>
          ) : null}

          {/* Rewards — stacked so pill bottom → next pill top = PURCHASE_POPUP_REWARD_PILL_GAP_PX */}
          <div
            className="relative w-full overflow-visible flex justify-center"
            style={{
              marginTop: description ? 0 : '28px',
              minHeight:
                rewards.length === 0
                  ? 0
                  : (rewards.length - 1) * PURCHASE_POPUP_REWARD_STACK_STEP_PX + PURCHASE_POPUP_REWARD_STRIP_SCALED_H_PX,
            }}
          >
            {rewards.map((row, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 flex justify-center overflow-visible"
                style={{
                  top: idx * PURCHASE_POPUP_REWARD_STACK_STEP_PX,
                }}
              >
                <div
                  style={{
                    width: REWARD_INLINE_WIDTH_PX,
                    flexShrink: 0,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${PURCHASE_POPUP_REWARD_SCALE})`,
                      transformOrigin: 'top center',
                    }}
                  >
                    <Reward
                      layout="inline"
                      offerLineText={row.offerLineText}
                      durationText={row.durationText}
                      coinIconPath={row.coinIconPath}
                      coinIconScale={row.coinIconScale}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tight gap above purchase */}
          <div className="flex-grow" style={{ minHeight: '12px' }} />

          {/* Action Button */}
          <button
            ref={buttonRef}
            onMouseDown={() => setButtonPressed(true)}
            onMouseUp={() => setButtonPressed(false)}
            onMouseLeave={() => setButtonPressed(false)}
            onClick={handlePurchaseClick}
            className="relative flex items-center justify-center rounded-xl transition-all"
            style={{
              width: '360px',
              height: '88px',
              marginBottom: '0px',
              backgroundColor: buttonPressed ? buttonPressedBg : buttonBgColor,
              border: `4px solid ${buttonBorderColor}`,
              borderRadius: '24px',
              boxShadow: buttonPressed 
                ? 'inset 0 4px 8px rgba(0,0,0,0.15)' 
                : '0 8px 0 ' + buttonBorderColor + ', 0 12px 24px rgba(0,0,0,0.15)',
              transform: buttonPressed ? 'translateY(4px)' : 'translateY(0)',
            }}
          >
            {originalPriceLabel ? (
              <span
                className="flex items-center justify-center gap-8 font-bold tracking-tight"
                style={{
                  color: buttonTextColor,
                  fontFamily: 'Inter, sans-serif',
                  textShadow: '0 2px 0 rgba(255,255,255,0.3)',
                  fontSize: '2rem',
                }}
              >
                <span className="line-through shrink-0">{originalPriceLabel}</span>
                <span className="shrink-0">{priceLabel}</span>
              </span>
            ) : (
              <span
                className="font-bold tracking-tight"
                style={{
                  color: buttonTextColor,
                  fontFamily: 'Inter, sans-serif',
                  textShadow: '0 2px 0 rgba(255,255,255,0.3)',
                  fontSize: '2rem',
                }}
              >
                {priceLabel}
              </span>
            )}
          </button>
            </div>
          </div>
        </PopupPrescaleFrame>

        <button
          type="button"
          onClick={dismissPopup}
          aria-label="Close"
          className="absolute right-6 w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            top: POPUP_CLOSE_TOP_PX,
            backgroundColor: 'transparent',
            border: 'none',
            color: closeIconColor,
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
