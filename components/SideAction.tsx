import React, { useRef, useEffect, useState } from 'react';
import { type GardenId } from '../constants/gardens';
import { getGardenActionButtonChrome } from '../constants/gardenActionButtonTheme';
import { shouldTick30 } from '../utils/raf60';

interface TapRipple {
  id: number;
  startTime: number;
}

interface SideActionProps {
  label: string;
  /** Image URL, path, or emoji — ignored when `iconNode` is set */
  icon: string;
  /** When set, rendered instead of `icon` (e.g. plant + pot stack) */
  iconNode?: React.ReactNode;
  progress: number;
  color: string;
  isActive?: boolean;
  isFlashing?: boolean;
  shouldAnimate?: boolean;
  isBoardFull?: boolean;
  iconScale?: number;
  iconOffsetY?: number;
  /** When set, progress bar is driven at 60fps from this ref (0–100) for smooth updates without React re-renders. */
  progressRef?: React.MutableRefObject<number>;
  /** Seed storage: show "X/Y" badge (e.g. 0/1, 3/10); background width fits content. */
  storageCount?: number;
  storageMax?: number;
  /** When true: progress stays 0%, badge shows "FREE", tap still works but doesn't consume charges/capacity. */
  freeMode?: boolean;
  /** Incremented each time we should bounce (e.g. seed progress hits 100%); key forces animation to re-run. */
  bounceTrigger?: number;
  /** If true, disable the rotate animation when flashing (default: false) */
  noRotateOnFlash?: boolean;
  /** Active garden — circle gradient + pill chrome swap per garden palette. */
  gardenId?: GardenId;
  onClick?: (e: React.MouseEvent) => void;
}

/** Circle button size (96px base × 1.15). */
const SIDE_ACTION_SIZE_PX = 110;
/** Icon base size before `iconScale` (40px × 1.15). */
const SIDE_ACTION_ICON_BASE_PX = 46;
/** Fixed pill size so seed & harvest badges match (content no longer drives width). */
const RECHARGE_PILL_WIDTH_PX = 52;
const RECHARGE_PILL_MIN_HEIGHT_PX = 24;
const RECHARGE_PILL_FONT_SIZE_PX = 13;
const RECHARGE_PILL_BOTTOM_OFFSET_PX = -4;

export const SideAction: React.FC<SideActionProps> = ({ 
  label, 
  icon,
  iconNode,
  progress, 
  color, 
  isActive, 
  isFlashing, 
  shouldAnimate = true,
  isBoardFull = false,
  iconScale = 1,
  iconOffsetY = 0,
  progressRef,
  storageCount,
  storageMax,
  freeMode = false,
  bounceTrigger = 0,
  noRotateOnFlash = false,
  gardenId,
  onClick 
}) => {
  const chrome = getGardenActionButtonChrome(gardenId);
  // Base Radius and Expanded Radius (only for body/decoration when flashing)
  const baseRadius = 38;
  const expandedRadius = baseRadius * 1.1; // 10% increase = 41.8
  // Progress ring always uses baseRadius so it doesn't scale/transition during pulse (avoids -10% visual bug)
  // Green-button version: make progress rings slightly narrower (inset a few px).
  const progressRadius = isFlashing ? baseRadius : (baseRadius - 1);
  const circumference = 2 * Math.PI * progressRadius;
  const progressCircleRef = useRef<SVGCircleElement>(null);
  const whiteHeadCircleRef = useRef<SVGCircleElement>(null);
  // White progress bar radius: on the inner edge of the white body circle (r=43)
  const whiteProgressRadius = 38;
  const whiteCircumference = 2 * Math.PI * whiteProgressRadius;
  const whiteProgressCircleRef = useRef<SVGCircleElement>(null);
  const isFlashingRef = useRef(isFlashing);
  const raf30LastTickRef = useRef(0);
  isFlashingRef.current = isFlashing;

  // When progressRef is provided and not in free mode, drive both progress rings at 30fps (smooth enough, less work than 60fps)
  useEffect(() => {
    if (!progressRef || freeMode) return;
    let rafId: number;
    const tick = () => {
      if (!shouldTick30(raf30LastTickRef)) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const raw = progressRef.current;
      const pct = Math.max(0, Math.min(100, raw));
      // Green progress bar: show actual progress (including 100% as a full ring)
      const greenShow = pct / 100;
      const whiteHeadLead = 0.02;
      const whiteHeadShow = greenShow > 0 ? Math.min(1, greenShow + whiteHeadLead) : 0;
      // White progress bar always tracks actual progress (visibility controlled by opacity)
      const whiteShow = pct / 100;
      
      // Main progress ring (green version)
      if (progressCircleRef.current) {
        const offset = circumference - (greenShow * circumference);
        progressCircleRef.current.style.strokeDashoffset = String(offset);
        progressCircleRef.current.style.transition = 'none';
      }

      // White "head" ring (slightly ahead of the green completed ring)
      if (whiteHeadCircleRef.current) {
        const headOffset = circumference - (whiteHeadShow * circumference);
        whiteHeadCircleRef.current.style.strokeDashoffset = String(headOffset);
        whiteHeadCircleRef.current.style.transition = 'none';
      }
      
      // White version progress ring (always update, visibility via opacity)
      if (whiteProgressCircleRef.current) {
        const whiteOffset = whiteCircumference - (whiteShow * whiteCircumference);
        whiteProgressCircleRef.current.style.strokeDashoffset = String(whiteOffset);
        whiteProgressCircleRef.current.style.transition = 'none';
      }
      
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [progressRef, circumference, whiteCircumference, freeMode]);

  // Clamp progress to 0–1 so the ring never shows negative or >100%; in free mode always show 0
  const clampedProgress = freeMode ? 0 : Math.max(0, Math.min(1, progress));
  const displayProgress = clampedProgress;
  const whiteHeadLead = 0.02;
  const whiteHeadProgress = displayProgress > 0 ? Math.min(1, displayProgress + whiteHeadLead) : 0;
  const strokeDashoffset = circumference - (displayProgress * circumference);
  const whiteHeadStrokeDashoffset = circumference - (whiteHeadProgress * circumference);
  const whiteStrokeDashoffset = whiteCircumference - (displayProgress * whiteCircumference);

  // Capacitor build uses relative base (`./`); absolute `/` check alone would render the path as text.
  const isImageIcon =
    !iconNode &&
    (icon.startsWith('http') ||
      icon.startsWith('/') ||
      icon.startsWith('./') ||
      /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(icon));

  // Tap ripple state - stores active ripples that expand outward on each tap
  const [tapRipples, setTapRipples] = useState<TapRipple[]>([]);
  const rippleIdRef = useRef(0);

  // Clean up finished ripples after 300ms
  useEffect(() => {
    if (tapRipples.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setTapRipples(prev => prev.filter(r => now - r.startTime < 300));
    }, 310);
    return () => clearTimeout(timer);
  }, [tapRipples]);

  // Handler to spawn a new ripple on click
  const handleClick = (e: React.MouseEvent) => {
    // Spawn new ripple
    rippleIdRef.current += 1;
    setTapRipples(prev => [...prev, { id: rippleIdRef.current, startTime: Date.now() }]);
    // Call original onClick
    onClick?.(e);
  };

  const transitionStyle = (isFlashing || displayProgress === 0)
    ? 'none'
    : 'stroke-dashoffset 0.08s cubic-bezier(0.25, 0.1, 0.25, 1)';

  const progressTrackColor = chrome.pillOutlineColor;
  const progressBgColor = progressTrackColor;
  const completedProgressColor = isFlashing ? chrome.progressRingFlashColor : chrome.progressRingColor;
  const whiteProgressCompletedColor = chrome.progressRingLightColor;
  const whiteProgressIncompleteColor = progressTrackColor;
  const useRefDrive = progressRef != null && !freeMode;
  // Green bar: hides progress when flashing
  const greenPct = useRefDrive ? Math.max(0, Math.min(1, (progressRef?.current ?? 0) / 100)) : 0;
  const refDriveOffset = useRefDrive
    ? circumference - (greenPct * circumference)
    : (freeMode ? circumference : undefined);
  const whiteHeadRefDriveOffset = useRefDrive
    ? circumference - (Math.min(1, greenPct + whiteHeadLead) * circumference)
    : (freeMode ? circumference : undefined);
  // White bar: always shows actual progress
  const whiteRefDriveOffset = useRefDrive
    ? whiteCircumference - (greenPct * whiteCircumference)
    : (freeMode ? whiteCircumference : undefined);

  const rechargePillStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to bottom, ${chrome.pillGradientTop}, ${chrome.pillGradientBottom})`,
    borderColor: chrome.pillOutlineColor,
    borderRadius: '999px',
    boxSizing: 'border-box',
    width: RECHARGE_PILL_WIDTH_PX,
    minHeight: RECHARGE_PILL_MIN_HEIGHT_PX,
    paddingLeft: 8,
    paddingRight: 8,
  };
  const rechargePillTextStyle: React.CSSProperties = {
    color: chrome.pillTextColor,
  };

  const hasBodyGradient = chrome.bodyGradientTop != null && chrome.bodyGradientBottom != null;
  const innerBodyFill =
    isFlashing || !hasBodyGradient
      ? `url(#pill-grad-${label})`
      : `url(#body-grad-${label})`;

  return (
    <div className="relative overflow-visible">
      <style>{`
        @keyframes seed-bounce {
          0% { transform: scale(1); }
          35% { transform: scale(1.18); }
          70% { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        .side-action-bounce {
          animation: seed-bounce 0.4s ease-out;
        }
        @keyframes tap-ripple {
          0% {
            transform: scale(1);
            opacity: 1;
            stroke-width: 5;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
            stroke-width: 2;
          }
        }
        .tap-ripple-ring {
          animation: tap-ripple 1000ms cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }
      `}</style>
      {/* Tap Ripple Rings - positioned outside bounce container so they're not affected by bounce animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
        <svg
          className="overflow-visible"
          viewBox="0 0 100 100"
          style={{ width: SIDE_ACTION_SIZE_PX, height: SIDE_ACTION_SIZE_PX, overflow: 'visible' }}
        >
          {tapRipples.map((ripple) => (
            <circle
              key={ripple.id}
              cx="50"
              cy="50"
              r="50"
              fill="none"
              stroke={chrome.pillOutlineColor}
              strokeWidth="5"
              className="tap-ripple-ring"
              style={{ transformOrigin: '50% 50%' }}
            />
          ))}
        </svg>
      </div>
      <div
        key={bounceTrigger}
        className={`flex flex-col items-center select-none group ${bounceTrigger > 0 ? 'side-action-bounce' : ''}`}
        onClick={handleClick}
      >
        <div
          className="relative flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-200"
          style={{ width: SIDE_ACTION_SIZE_PX, height: SIDE_ACTION_SIZE_PX }}
        >
        
        {/* SVG Circular Progress & Decoration */}
        <svg className="absolute inset-0 z-0 w-full h-full drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]" viewBox="0 0 100 100">
          <defs>
            {/* Same vertical gradient as floating-button / recharge pill */}
            <linearGradient id={`pill-grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chrome.pillGradientTop} />
              <stop offset="100%" stopColor={chrome.pillGradientBottom} />
            </linearGradient>
            {hasBodyGradient ? (
              <linearGradient id={`body-grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={chrome.bodyGradientTop} />
                <stop offset="100%" stopColor={chrome.bodyGradientBottom} />
              </linearGradient>
            ) : null}
          </defs>

          {/* Outer border ring */}
          {/* Green version: r=48, White version: r=46 */}
          <circle
            cx="50"
            cy="50"
            r={isFlashing ? 44 : 48}
            fill={`url(#pill-grad-${label})`}
            className="transition-all duration-300"
            style={{
              filter: 'none'
            }}
          />
          
          {/* Inner body — light when ready, dark when recharging (Garden 1). */}
          <circle
            cx="50"
            cy="50"
            r="43"
            fill={innerBodyFill}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />

          {/* Incomplete Progress Track (Background) - fixed radius so pulse doesn't affect progress */}
          <circle
            cx="50"
            cy="50"
            r={progressRadius}
            fill="transparent"
            stroke={progressBgColor}
            strokeWidth="3"
            style={{ transition: 'none' }}
          />

          {/* White "head" progress ring: sits above track but below green ring */}
          <circle
            ref={progressRef ? whiteHeadCircleRef : undefined}
            cx="50"
            cy="50"
            r={progressRadius}
            fill="transparent"
            stroke="#f8edcb"
            strokeWidth={isFlashing ? 3 : 2.5}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: useRefDrive ? whiteHeadRefDriveOffset : whiteHeadStrokeDashoffset,
              transition: useRefDrive ? 'none' : transitionStyle,
              transform: 'rotate(90deg)',
              transformOrigin: '50% 50%',
              opacity: 1
            }}
          />

          {/* Progress Bar Ring - When progressRef is set, strokeDashoffset is driven at 60fps in useEffect */}
          <circle
            ref={progressRef ? progressCircleRef : undefined}
            cx="50"
            cy="50"
            r={progressRadius}
            fill="transparent"
            stroke={completedProgressColor}
            strokeWidth={isFlashing ? 4 : 3}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset: useRefDrive ? refDriveOffset : strokeDashoffset,
              transition: useRefDrive ? 'stroke 0.3s ease' : `${transitionStyle}, stroke 0.3s ease`,
              transform: 'rotate(90deg)',
              transformOrigin: '50% 50%',
              opacity: 1
            }}
          />

          {/* White Version Progress Bar - Only visible when flashing (white state), fades in/out with white */}
          {/* Track (dark green background - incomplete portion) */}
          <circle
            cx="50"
            cy="50"
            r={whiteProgressRadius}
            fill="transparent"
            stroke={whiteProgressIncompleteColor}
            strokeWidth="4"
            style={{ 
              transition: 'opacity 0.3s ease',
              opacity: 0
            }}
          />
          {/* Progress Fill (light green - completed portion) */}
          <circle
            ref={progressRef ? whiteProgressCircleRef : undefined}
            cx="50"
            cy="50"
            r={whiteProgressRadius}
            fill="transparent"
            stroke={whiteProgressCompletedColor}
            strokeWidth="5"
            strokeDasharray={whiteCircumference}
            style={{ 
              strokeDashoffset: useRefDrive ? whiteRefDriveOffset : (isFlashing ? whiteStrokeDashoffset : whiteCircumference),
              transition: useRefDrive ? 'opacity 0.3s ease' : `opacity 0.3s ease, stroke-dashoffset 0.08s cubic-bezier(0.25, 0.1, 0.25, 1)`,
              transform: 'rotate(90deg)',
              transformOrigin: '50% 50%',
              opacity: 0
            }}
          />
        </svg>

        {/* Content Icon — above ring/body chrome so tall plants aren't covered by circles */}
        <div 
          className={`relative z-30 w-16 h-16 rounded-full flex items-center justify-center overflow-visible transition-all duration-300 ${
            isFlashing && shouldAnimate
              ? (storageCount !== undefined || noRotateOnFlash)
                ? 'scale-110'
                : 'scale-110 rotate-12'
              : isActive
                ? 'scale-105'
                : 'scale-100'
          }`}
        >
          {iconNode ? (
            <div
              className="flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
              style={{
                width: SIDE_ACTION_ICON_BASE_PX * iconScale,
                height: SIDE_ACTION_ICON_BASE_PX * iconScale,
                transform: iconOffsetY ? `translateY(${iconOffsetY}px)` : undefined,
              }}
            >
              {iconNode}
            </div>
          ) : isImageIcon ? (
            <img 
              src={icon} 
              alt={label} 
              className="object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
              style={{ width: SIDE_ACTION_ICON_BASE_PX * iconScale, height: SIDE_ACTION_ICON_BASE_PX * iconScale, transform: iconOffsetY ? `translateY(${iconOffsetY}px)` : undefined }}
            />
          ) : (
            <span className="text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none">
              {icon}
            </span>
          )}
          {/* Subtle Shine Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
        </div>

        {/* Storage badge: FREE / X/Y / FULL — fixed size so seed & harvest match */}
        {freeMode && (storageCount !== undefined || storageMax !== undefined) ? (
          <div 
            className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center justify-center border-2 py-[4px] shadow-md transition-all duration-200"
            style={{ ...rechargePillStyle, bottom: RECHARGE_PILL_BOTTOM_OFFSET_PX }}
          >
            <span 
              className="font-black uppercase tracking-widest leading-none whitespace-nowrap"
              style={{ ...rechargePillTextStyle, fontSize: RECHARGE_PILL_FONT_SIZE_PX }}
            >
              FREE
            </span>
          </div>
        ) : storageCount !== undefined && storageMax !== undefined ? (
          <div 
            className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center justify-center border-2 py-[4px] shadow-md transition-all duration-200"
            style={{ ...rechargePillStyle, bottom: RECHARGE_PILL_BOTTOM_OFFSET_PX }}
          >
            <span 
              className="font-black tabular-nums leading-none whitespace-nowrap"
              style={{ ...rechargePillTextStyle, fontSize: RECHARGE_PILL_FONT_SIZE_PX }}
            >
              {storageCount}/{storageMax}
            </span>
          </div>
        ) : isFlashing && isBoardFull ? (
          <div 
            className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center justify-center border-2 py-[4px] shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ ...rechargePillStyle, bottom: RECHARGE_PILL_BOTTOM_OFFSET_PX }}
          >
            <span 
              className="font-black uppercase tracking-widest leading-none"
              style={{ ...rechargePillTextStyle, fontSize: RECHARGE_PILL_FONT_SIZE_PX }}
            >
              FULL
            </span>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
};
