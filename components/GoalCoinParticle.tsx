/**
 * Goal coin particle: flies from completed goal icon or popup reward to wallet.
 * - `variant="goal"` — classic orders/goals: trough arc + original ease/speed/size.
 * - `variant="popupReward"` — discovery / offline / task claim: left-then-up path + punchier end ease.
 * - Optional `data.burst` — explode outward, crawl slowly, then stagger-suck to wallet (keeps trail).
 */
import React, { useEffect, useRef, useState } from 'react';
import { getGardenCoinIconPath } from '../utils/gardenAssets';
import { getPerformanceMode } from '../utils/performanceMode';
import { assetPath } from '../utils/assetPath';

const MOVE_DURATION_MS = 350;
/** Shorter trail = fewer SVG elements when many coins fly at once (e.g. 5+ goals). */
const MAX_TRAIL_POINTS = 8;
const TRAIL_FADE_AFTER_HIT_MS = 280;
const PARTICLE_SIZE = 40; // same as goal icon
const TRAIL_COLOR = '#dfbb38';
const TRAIL_STROKE_WIDTH = 32;
/** When more than this many particles are active, skip trail entirely to keep FPS up. */
const SKIP_TRAIL_WHEN_ACTIVE_ABOVE = 4;

/** Time remap for goal/order coins (legacy — symmetric slow-middle feel). */
function easePathProgressGoal(t: number): number {
  const p = 0.7;
  return t < 0.5 ? 0.5 * Math.pow(t * 2, p) : 1 - 0.5 * Math.pow((1 - t) * 2, p);
}

/**
 * Time remap for popup reward coins — accelerating into the wallet (slow path progress early,
 * steep late so it hits at high speed; no ease-out at the end).
 */
function easePathProgressPopupReward(t: number): number {
  if (t <= 0.14) return (t / 0.14) * 0.10;
  const u = (t - 0.14) / 0.86;
  return 0.10 + 0.90 * Math.pow(u, 1.7);
}

/**
 * Time remap for burst suck — opens nearly stopped (matches post-explode crawl),
 * then accelerates into the same punchy wallet finish as popup rewards.
 */
function easePathProgressBurstSuck(t: number): number {
  if (t <= 0.32) return (t / 0.32) * 0.028;
  const u = (t - 0.32) / 0.68;
  return 0.028 + 0.972 * Math.pow(u, 1.8);
}

function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

/** Explode progress that eases out but keeps a tiny end slope (never fully stops). */
function easeExplodeOutToCrawl(t: number): number {
  return 0.88 * easeOutCubic(t) + 0.12 * t;
}

interface Point {
  x: number;
  y: number;
}

export type GoalCoinBurstSuckPath = 'popup' | 'goal' | 'collection';

export interface GoalCoinBurstMotion {
  endX: number;
  endY: number;
  explodeMs: number;
  /** Keep crawling outward this long after explode before the suck stagger clock. */
  driftMs: number;
  /** Extra wait after drift before suck starts (per-coin stagger). */
  suckDelayMs: number;
  /**
   * Flight path into the wallet after explode.
   * `popup` = left-then-up (discovery / offline / tasks).
   * `goal` = trough down-then-up (coin order).
   * `collection` = right-then-down into the Collection nav tab.
   */
  suckPath?: GoalCoinBurstSuckPath;
}

export interface GoalCoinParticleData {
  id: string;
  startX: number;
  startY: number;
  value: number;
  /** Set for rewarded coin-goal ad: value already includes happiest multiplier; skip random happy roll. */
  skipHappyCustomerRoll?: boolean;
  /** Coin-goal ad reward: spawn `value` without shop Double Coins (no visual 2× on this tile). */
  skipDoubleCoinsMultiplier?: boolean;
  /** Multi-coin claim burst (explode → settle → staggered suck). */
  burst?: GoalCoinBurstMotion;
  /** When false, wallet impact skips coin SFX. Default true. */
  burstImpactSfx?: boolean;
  /** Playback rate for wallet impact SFX (1 = normal). Used for burst pitch steps. */
  burstImpactPitch?: number;
  /** Optional non-coin particle sprite (daily tasks use the full-size key). */
  iconSrc?: string;
  /** Optional trail color paired with `iconSrc`. */
  trailColor?: string;
  /** When true, impact is visual/SFX only — wallet was already credited. */
  skipWalletCredit?: boolean;
}

interface GoalCoinParticleProps {
  data: GoalCoinParticleData;
  containerRef: React.RefObject<HTMLDivElement | null>;
  walletRef: React.RefObject<HTMLElement | null>;
  walletIconRef?: React.RefObject<HTMLElement | null>;
  onImpact: (
    value: number,
    meta?: { playSfx: boolean; pitch?: number; skipWalletCredit?: boolean },
  ) => void;
  onComplete: () => void;
  appScale?: number;
  /** When > SKIP_TRAIL_WHEN_ACTIVE_ABOVE, trail is disabled to reduce cost (e.g. 5+ coins at once). */
  activeCount?: number;
  /**
   * `goal` — coin goals / plant orders → wallet (classic trough + easing).
   * `popupReward` — discovery, offline earnings, daily task claim (left-up path + punchier easing).
   */
  variant?: 'goal' | 'popupReward';
  /** Only for `popupReward`; default 1 (same coin/trail size as `goal`). */
  popupVisualScale?: number;
}

type AnimPhase = 'explode' | 'drift' | 'suckWait' | 'moving' | 'trailOnly';

export const GoalCoinParticle: React.FC<GoalCoinParticleProps> = ({
  data,
  containerRef,
  walletRef,
  walletIconRef,
  onImpact,
  onComplete,
  appScale = 1,
  activeCount = 1,
  variant = 'goal',
  popupVisualScale = 1,
}) => {
  const isPopupReward = variant === 'popupReward';
  const isBurst = !!data.burst;
  const durationMul = isPopupReward ? 0.75 : 1;
  const visualMul = isPopupReward ? popupVisualScale : 1;
  /** Burst coins read smaller than single popup reward flyers. */
  const burstSizeMul = isBurst ? 0.75 : 1;
  const particleSize = PARTICLE_SIZE * visualMul * burstSizeMul;
  const trailStrokeWidth = TRAIL_STROKE_WIDTH * visualMul * burstSizeMul;
  /** Burst suck is a touch longer so the ultra-slow open has room before the punch. */
  const moveDurationMs = MOVE_DURATION_MS * durationMul * (isBurst ? 1.35 : 1);
  const trailFadeAfterHitMs = TRAIL_FADE_AFTER_HIT_MS * durationMul;
  const trailLimit = getPerformanceMode() ? 2 : SKIP_TRAIL_WHEN_ACTIVE_ABOVE;
  // Burst claims always keep trails (that’s the look); otherwise throttle when crowded.
  const useTrail = isBurst || activeCount <= trailLimit;
  const [frame, setFrame] = useState<{
    phase: AnimPhase;
    pos: Point;
    scale: number;
    trail: { p: Point; color: string; t: number }[];
    trailOpacity: number;
  }>({
    phase: isBurst ? 'explode' : 'moving',
    pos: { x: data.startX, y: data.startY },
    scale: 1,
    trail: [],
    trailOpacity: 1,
  });
  const startTimeRef = useRef<number>(Date.now());
  const phaseStartRef = useRef<number>(Date.now());
  const trailRef = useRef<{ p: Point; color: string; t: number }[]>([]);
  const impactFiredRef = useRef(false);
  const trailOnlyStartRef = useRef<number>(0);
  const phaseRef = useRef<AnimPhase>(isBurst ? 'explode' : 'moving');
  const suckStartPosRef = useRef<Point>({ x: data.startX, y: data.startY });
  const driftPosRef = useRef<Point>({ x: data.startX, y: data.startY });
  const driftDirRef = useRef<Point>({ x: 0, y: -1 });
  const crawlSpeedPxPerMsRef = useRef(0.014);
  const rafRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const completeScheduledRef = useRef(false);
  const onImpactRef = useRef(onImpact);
  const onCompleteRef = useRef(onComplete);
  onImpactRef.current = onImpact;
  onCompleteRef.current = onComplete;
  // Do NOT sync phaseRef from frame.phase — RAF owns phase transitions.

  useEffect(() => {
    startTimeRef.current = Date.now();
    phaseStartRef.current = Date.now();
    trailRef.current = [
      { p: { x: data.startX, y: data.startY }, color: data.trailColor ?? TRAIL_COLOR, t: 0 },
    ];
    phaseRef.current = data.burst ? 'explode' : 'moving';
    suckStartPosRef.current = { x: data.startX, y: data.startY };
    driftPosRef.current = { x: data.startX, y: data.startY };
    if (data.burst) {
      const dx = data.burst.endX - data.startX;
      const dy = data.burst.endY - data.startY;
      const len = Math.hypot(dx, dy) || 1;
      driftDirRef.current = { x: dx / len, y: dy / len };
      // Match residual explode slope (~0.12 of dist over explodeMs).
      crawlSpeedPxPerMsRef.current = Math.max(
        0.008,
        Math.min(0.028, (0.12 * len) / Math.max(1, data.burst.explodeMs)),
      );
    }
  }, [data.id, data.startX, data.startY, data.burst]);

  // Performance Mode: credit immediately, skip flight.
  useEffect(() => {
    if (!getPerformanceMode()) return;
    onImpactRef.current(data.value, {
      playSfx: data.burstImpactSfx !== false,
      pitch: data.burstImpactPitch,
      skipWalletCredit: data.skipWalletCredit === true,
    });
    onCompleteRef.current();
  }, [data.id, data.value, data.burstImpactSfx, data.burstImpactPitch, data.skipWalletCredit]);

  useEffect(() => {
    if (getPerformanceMode()) return;
    mountedRef.current = true;
    completeScheduledRef.current = false;
    const container = containerRef.current;
    const walletEl = walletIconRef?.current ?? walletRef.current;
    if (!container || !walletEl) return;

    const cr = container.getBoundingClientRect();
    const containerHeight = cr.height / appScale;
    const burst = data.burst;

    const getWalletPos = (): Point => {
      const br = walletEl.getBoundingClientRect();
      return {
        x: (br.left + br.width / 2 - cr.left) / appScale,
        y: (br.top + br.height / 2 - cr.top) / appScale,
      };
    };

    const finishAndDespawn = () => {
      if (completeScheduledRef.current) return;
      completeScheduledRef.current = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      trailRef.current = [];
      onCompleteRef.current();
    };

    const setPhase = (next: AnimPhase, now: number) => {
      phaseRef.current = next;
      phaseStartRef.current = now;
    };

    const pushTrail = (x: number, y: number, t: number) => {
      if (!useTrail) return;
      trailRef.current = [
        { p: { x, y }, color: data.trailColor ?? TRAIL_COLOR, t },
        ...trailRef.current,
      ].slice(
        0,
        MAX_TRAIL_POINTS,
      );
    };

    const sampleSuckPos = (tt: number, start: Point, target: Point): Point => {
      const dx = target.x - start.x;
      const dy = target.y - start.y;
      let cp1: Point;
      let cp2: Point;
      const useCollectionPath = isBurst && burst?.suckPath === 'collection';
      const useGoalTrough = isBurst ? burst?.suckPath === 'goal' : !isPopupReward;
      if (useCollectionPath) {
        // Head right first, then bend down into Collection.
        cp1 = { x: start.x + dx * 0.55, y: start.y };
        cp2 = { x: target.x, y: start.y + dy * 0.55 };
      } else if (!useGoalTrough) {
        // Left-ish then up into the wallet.
        cp1 = { x: start.x + dx * 0.45, y: start.y };
        cp2 = { x: target.x - dx * 0.05, y: start.y + dy * 0.55 };
      } else {
        // Match classic goal/coin-order trough; scale depth when drawing in viewport space.
        const troughDepth = 200 * (isBurst && burst?.suckPath === 'goal' ? visualMul : 1);
        const safetyMargin = containerHeight * 0.12;
        const troughY = Math.min(
          containerHeight - safetyMargin,
          Math.max(start.y, target.y) + troughDepth,
        );
        const leanFactor = 0.45;
        cp1 = { x: start.x + dx * leanFactor, y: troughY };
        cp2 = { x: target.x - dx * 0.1, y: troughY };
      }
      return {
        x:
          Math.pow(1 - tt, 3) * start.x +
          3 * Math.pow(1 - tt, 2) * tt * cp1.x +
          3 * (1 - tt) * tt * tt * cp2.x +
          Math.pow(tt, 3) * target.x,
        y:
          Math.pow(1 - tt, 3) * start.y +
          3 * Math.pow(1 - tt, 2) * tt * cp1.y +
          3 * (1 - tt) * tt * tt * cp2.y +
          Math.pow(tt, 3) * target.y,
      };
    };

    const advanceDrift = (dtMs: number): Point => {
      const dir = driftDirRef.current;
      const speed = crawlSpeedPxPerMsRef.current;
      const next = {
        x: driftPosRef.current.x + dir.x * speed * dtMs,
        y: driftPosRef.current.y + dir.y * speed * dtMs,
      };
      driftPosRef.current = next;
      suckStartPosRef.current = next;
      return next;
    };

    const fireImpact = () => {
      if (impactFiredRef.current) return;
      impactFiredRef.current = true;
      onImpactRef.current(data.value, {
        playSfx: data.burstImpactSfx !== false,
        pitch: data.burstImpactPitch,
        skipWalletCredit: data.skipWalletCredit === true,
      });
    };

    let lastTickNow = Date.now();

    const tick = () => {
      if (!mountedRef.current) return;
      const now = Date.now();
      const dtMs = Math.min(48, Math.max(0, now - lastTickNow));
      lastTickNow = now;
      const phase = phaseRef.current;
      const phaseElapsed = now - phaseStartRef.current;

      if (burst && phase === 'explode') {
        const t = Math.min(phaseElapsed / Math.max(1, burst.explodeMs), 1);
        const tt = easeExplodeOutToCrawl(t);
        const x = data.startX + (burst.endX - data.startX) * tt;
        const y = data.startY + (burst.endY - data.startY) * tt;
        driftPosRef.current = { x, y };
        suckStartPosRef.current = { x, y };
        const coinScale = 1 + 0.12 * (1 - tt);
        pushTrail(x, y, t * 0.35);
        if (t >= 1) {
          setPhase('drift', now);
          setFrame({
            phase: 'drift',
            pos: { x, y },
            scale: 1,
            trail: useTrail ? [...trailRef.current] : [],
            trailOpacity: 1,
          });
        } else {
          setFrame({
            phase: 'explode',
            pos: { x, y },
            scale: coinScale,
            trail: useTrail ? [...trailRef.current] : [],
            trailOpacity: 1,
          });
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (burst && phase === 'drift') {
        const pos = advanceDrift(dtMs);
        pushTrail(pos.x, pos.y, 0.38);
        if (phaseElapsed < burst.driftMs) {
          setFrame({
            phase: 'drift',
            pos,
            scale: 1,
            trail: useTrail ? [...trailRef.current] : [],
            trailOpacity: 1,
          });
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        setPhase('suckWait', now);
        // Fall through — keep crawling during stagger wait.
      }

      if (burst && phaseRef.current === 'suckWait') {
        const pos = advanceDrift(dtMs);
        pushTrail(pos.x, pos.y, 0.4);
        const suckWaitElapsed = now - phaseStartRef.current;
        if (suckWaitElapsed < burst.suckDelayMs) {
          setFrame({
            phase: 'suckWait',
            pos,
            scale: 1,
            trail: useTrail ? [...trailRef.current] : [],
            trailOpacity: 1,
          });
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        suckStartPosRef.current = { ...driftPosRef.current };
        trailRef.current = [
          {
            p: { ...suckStartPosRef.current },
            color: data.trailColor ?? TRAIL_COLOR,
            t: 0,
          },
          ...trailRef.current,
        ].slice(0, MAX_TRAIL_POINTS);
        startTimeRef.current = now;
        setPhase('moving', now);
        // Fall through into moving with elapsed ≈ 0.
      }

      if (phaseRef.current === 'moving') {
        const elapsed = now - startTimeRef.current;
        const t = Math.min(elapsed / moveDurationMs, 1);
        const tt = isBurst
          ? easePathProgressBurstSuck(t)
          : isPopupReward
            ? easePathProgressPopupReward(t)
            : easePathProgressGoal(t);
        const start = isBurst ? suckStartPosRef.current : { x: data.startX, y: data.startY };
        const target = getWalletPos();
        const { x, y } = sampleSuckPos(tt, start, target);
        const coinScale = t <= 0.5 ? 1 - (1 - 0.65) * (t / 0.5) : 0.65;
        pushTrail(x, y, t);

        if (t >= 1) {
          fireImpact();
          if (useTrail) {
            trailOnlyStartRef.current = now;
            setPhase('trailOnly', now);
            setFrame({
              phase: 'trailOnly',
              pos: { x, y },
              scale: coinScale,
              trail: [...trailRef.current],
              trailOpacity: 1,
            });
          } else {
            finishAndDespawn();
            return;
          }
        } else {
          setFrame({
            phase: 'moving',
            pos: { x, y },
            scale: coinScale,
            trail: useTrail ? [...trailRef.current] : [],
            trailOpacity: 1,
          });
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (phaseRef.current === 'trailOnly') {
        const trailElapsed = now - trailOnlyStartRef.current;
        const fade = Math.max(0, 1 - trailElapsed / trailFadeAfterHitMs);
        if (trailElapsed >= trailFadeAfterHitMs || fade <= 0.001) {
          finishAndDespawn();
          return;
        }
        if (mountedRef.current) {
          setFrame((prev) => ({ ...prev, trailOpacity: fade, trail: [...trailRef.current] }));
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      trailRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data,
    containerRef,
    walletRef,
    walletIconRef,
    appScale,
    useTrail,
    isPopupReward,
    isBurst,
    trailFadeAfterHitMs,
    moveDurationMs,
  ]);

  // Safety net: force-complete if animation is stuck (RAF starvation during heavy renders)
  useEffect(() => {
    if (getPerformanceMode()) return;
    const burstExtra = data.burst
      ? data.burst.explodeMs + data.burst.driftMs + data.burst.suckDelayMs
      : 0;
    const timer = window.setTimeout(() => {
      if (!impactFiredRef.current) {
        impactFiredRef.current = true;
        onImpactRef.current(data.value, {
          playSfx: data.burstImpactSfx !== false,
          pitch: data.burstImpactPitch,
          skipWalletCredit: data.skipWalletCredit === true,
        });
      }
      if (!completeScheduledRef.current) {
        completeScheduledRef.current = true;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
        onCompleteRef.current();
      }
    }, 5000 + burstExtra);
    return () => clearTimeout(timer);
  }, [data.id, data.value, data.burst, data.burstImpactSfx, data.burstImpactPitch]);

  if (getPerformanceMode()) return null;

  const { phase, pos, scale, trail, trailOpacity } = frame;
  const showCoin = phase !== 'trailOnly';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 200 }}>
      {useTrail && trail.length > 1 && (
        <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
          <g>
            {trail.map((seg, i) => {
              if (i === 0) return null;
              const prev = trail[i - 1];
              const curr = seg;
              const headT = prev.t;
              const baseWidthScale = headT <= 0.5 ? 1 - (1 - 0.65) * (headT / 0.5) : 0.65;
              const taperProgress = (i - 1) / Math.max(1, trail.length - 2);
              const widthScale = baseWidthScale * (1 - taperProgress);
              const opacityScale = 1.0 - taperProgress;
              const lineOpacity = Math.max(0, Math.min(1, opacityScale * trailOpacity));
              return (
                <line
                  key={`gcp-${data.id}-${i}`}
                  x1={prev.p.x}
                  y1={prev.p.y}
                  x2={curr.p.x}
                  y2={curr.p.y}
                  stroke={curr.color}
                  strokeWidth={trailStrokeWidth * widthScale}
                  strokeLinecap="round"
                  strokeOpacity={lineOpacity}
                />
              );
            })}
          </g>
        </svg>
      )}

      {showCoin && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: pos.x,
            top: pos.y,
            width: particleSize,
            height: particleSize,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <img
            src={data.iconSrc ? assetPath(data.iconSrc) : getGardenCoinIconPath()}
            alt=""
            className="w-full h-full object-contain"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
};
