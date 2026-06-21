/**
 * Top bar (coin wallet, level, active boosts, settings).
 * Reference UI: size/position locked — see docs/UI-REFERENCE-TOP-BAR.md.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import { MAX_PLANT_TIER } from '../constants/plants';
import { assetPath } from '../utils/assetPath';
import { type GardenId } from '../constants/gardens';
import { getGardenCoinIconPath, getGardenLevelIconPath, getGoldenPotWalletIconPath, getTopUiAssetPath } from '../utils/gardenAssets';
import { getTickCount60 } from '../utils/raf60';
import { getPerformanceMode } from '../utils/performanceMode';

/** Slightly under 33.33ms so we reliably get 30 counts/sec (avoids 25 due to timing). */
const FPS_COUNT_INTERVAL_30_MS = 32;
import { ActiveBoostIndicator, ActiveBoostData, ACTIVE_BOOST_INDICATOR_SIZE_PX } from './ActiveBoostIndicator';

const BOOST_GAP_PX = 2;
const BOOST_SLOT_WIDTH = ACTIVE_BOOST_INDICATOR_SIZE_PX + BOOST_GAP_PX;

/** Max boost icons in the strip; extras stay active off-screen until a slot frees. */
export const MAX_VISIBLE_BOOST_SLOTS = 5;

/** Player level pill width (must match level bar + spacer below). */
const PLAYER_LEVEL_SLOT_WIDTH_PX = 155;
/** Coin wallet button width. */
const WALLET_WIDTH_PX = 85;
/** Golden pot wallet (right dock) — auto width; reserve ≈ max label after scale(0.88). */
const GOLDEN_POT_WALLET_RESERVE_PX = 78;
const GOLDEN_POT_WALLET_GAP_PX = 10;
const GOLDEN_POT_WALLET_ICON_PX = 36;
/** Match coin cluster scale in `headerLeftWrapperRef`. */
const GOLDEN_POT_WALLET_SCALE = 0.88;
/** Gap between wallet, level, and boost strip inside the scaled cluster (`gap: 18`). */
const HEADER_CLUSTER_GAP_PX = 18;
/** Boost strip pulls left 10px under the level bar (`marginLeft: -10`). */
const BOOST_STRIP_MARGIN_LEFT_PX = -10;
/** Store: gap between centered title right edge and first boost icon. */
const AFTER_CENTER_TITLE_BOOST_PAD_PX = 10;
/** Reserve space at the right of the bar for FPS + settings (absolute dock); tuned so gear never clips. */
const RIGHT_DOCK_RESERVE_PX_WITH_FPS = 84;
const RIGHT_DOCK_RESERVE_PX_NO_FPS = 44;
/** Settings gear size + gap so FPS can sit to its left (`right-3` is 12px). */
const SETTINGS_GEAR_PX = 22;
const DOCK_GAP_PX = 8;
const FPS_RIGHT_OFFSET_PX = 12 + SETTINGS_GEAR_PX + DOCK_GAP_PX; // 42
/** Settings dock inset from the right edge (`right-3` = 12px per UI reference). */
const SETTINGS_DOCK_RIGHT_PX = 12;
const SETTINGS_DOCK_RIGHT_WITH_GOLDEN_POT_PX = 4;

interface PageHeaderProps {
  /** Coin balance; null/undefined coerced to 0 for display (bad saves / edge cases). */
  money: number | null | undefined;
  walletRef?: React.RefObject<HTMLButtonElement | null>;
  walletIconRef?: React.RefObject<HTMLElement | null>;
  walletFlashActive?: boolean;
  /** When this increments, triggers coin bounce animation */
  walletBurstCount?: number;
  /** Golden pots owned / total collection plants; when set with refs, shows a right-docked wallet left of settings. */
  goldenPotWallet?: {
    count: number;
    totalCount: number;
    walletRef: React.RefObject<HTMLButtonElement | null>;
    walletIconRef: React.RefObject<HTMLElement | null>;
    flashActive?: boolean;
    burstCount?: number;
  };
  onWalletClick?: () => void;
  /** If set, shows plant wallet instead of coin wallet */
  plantWallet?: {
    unlockedCount: number;
    totalCount: number;
  };
  /** When set, shows gift button to the right of coin panel */
  onGiftClick?: () => void;
  /** When true, player level section is invisible and untappable (FTUE hide until we reveal) */
  hidePlayerLevel?: boolean;
  /** Player level progress (0 to goalsRequired) */
  playerLevel?: number;
  playerLevelProgress?: number;
  /** Goals required to level up from current level (e.g. 2 for level 1, 4 for level 2) */
  playerLevelGoalsRequired?: number;
  /** When this increments, triggers progress bar flash */
  playerLevelFlashTrigger?: number;
  /** If true, hide the top bar background (e.g. for shed screen - keeps plant wallet + settings only) */
  hideTopBarBg?: boolean;
  /** If true, hide the small FPS button (e.g. Store). Ignored for layout when 5+ active boosts fill the bar. */
  hideFps?: boolean;
  /** If true, hide/collapse the player level block so it doesn't reserve width. */
  collapsePlayerLevel?: boolean;
  /**
   * When true (interactive header only), do not render the level bar or its spacer — coin sits next to boosts.
   * Used e.g. Collection / barn screen.
   */
  omitPlayerLevelBlock?: boolean;
  /** Override outer `<header>` left padding (px); omit to keep `px-2` (8px). */
  headerOuterPadLeftPx?: number;
  /** Override inner content row left padding (px); omit to keep 12px (`pl-3`). */
  headerRowPadLeftPx?: number;
  /** Override left cluster `marginLeft` (default 10). */
  headerClusterMarginLeftPx?: number;
  /** Optional centered title rendered above the 9-slice top bar background. */
  centerTitle?: string;
  /** When provided, shows a + button that grants 1 goal worth of XP on tap */
  onXpBoostClick?: () => void;
  /** When provided, settings (gear) button opens pause menu */
  onPauseClick?: () => void;
  /** Active rewarded-ad boosts (max 5); shown left of level as circles with radial progress */
  activeBoosts?: ActiveBoostData[];
  /** Ref for the boost area (used as particle target when activating a reward) */
  activeBoostAreaRef?: React.RefObject<HTMLDivElement | null>;
  /** Min width of boost area when empty so particle target (first boost center) is stable */
  activeBoostMinWidthPx?: number;
  /** When a boost's timer hits 0; (id, rect) so caller can play burst at position */
  onBoostComplete?: (id: string, rect?: DOMRect) => void;
  /** When user taps a boost: open the matching limited offer popup in "active" view (countdown, brown button) */
  onBoostClick?: (boost: ActiveBoostData) => void;
  /** Ref for the left section wrapper (scale 0.88); used so boost particle can render inside it and hit the correct slot */
  headerLeftWrapperRef?: React.RefObject<HTMLDivElement | null>;
  /** Add this to boost area marginLeft (e.g. 20 on Store to push boosts right) */
  boostAreaMarginLeftOffset?: number;
  /**
   * Store only: place boosts just right of `centerTitle` (measured each layout).
   * Farm/gameplay keep the default strip after the level bar.
   */
  boostAreaLayout?: 'default' | 'afterCenterTitle';
  /**
   * Dev / testing: poll this ref and show "Last: Plant N" left of the FPS readout.
   * Flex-end keeps FPS anchored when the label is visible.
   */
  debugLastSpawnedGoalLevelRef?: MutableRefObject<number> | null;
  /**
   * Dev / testing: poll this ref — remaining normal goal spawns until a discovery order (left of Last).
   */
  debugDiscoveryGoalsUntilRef?: MutableRefObject<number> | null;
  /** Active garden — top bar background swaps per garden folder. */
  gardenId?: GardenId;
}

const formatMoney = (amount: number | null | undefined): string => {
  const n = amount != null && typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  money, 
  walletRef, 
  walletIconRef, 
  walletFlashActive = false,
  walletBurstCount = 0,
  goldenPotWallet,
  onWalletClick,
  plantWallet,
  onGiftClick,
  hidePlayerLevel = false,
  playerLevel = 1,
  playerLevelProgress = 0,
  playerLevelFlashTrigger = 0,
  playerLevelGoalsRequired = 2,
  hideTopBarBg = false,
  hideFps = false,
  collapsePlayerLevel = false,
  omitPlayerLevelBlock = false,
  headerOuterPadLeftPx,
  headerRowPadLeftPx,
  headerClusterMarginLeftPx,
  centerTitle,
  onXpBoostClick,
  onPauseClick,
  activeBoosts = [],
  activeBoostAreaRef,
  activeBoostMinWidthPx,
  onBoostComplete,
  onBoostClick,
  headerLeftWrapperRef,
  boostAreaMarginLeftOffset = 0,
  boostAreaLayout = 'default',
  debugLastSpawnedGoalLevelRef = null,
  debugDiscoveryGoalsUntilRef = null,
  gardenId,
}) => {
  const isInteractive = !!walletRef;
  const boostRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const centerTitleRef = useRef<HTMLDivElement>(null);
  const [afterCenterTitleBoostLeftPx, setAfterCenterTitleBoostLeftPx] = useState<number | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const fpsButtonRef = useRef<HTMLButtonElement>(null);
  const prevBurstRef = useRef(walletBurstCount);
  const prevGoldenPotBurstRef = useRef(goldenPotWallet?.burstCount ?? 0);
  const prevFlashRef = useRef(playerLevelFlashTrigger);
  const [bounceKey, setBounceKey] = useState(0);
  const [goldenPotBounceKey, setGoldenPotBounceKey] = useState(0);
  const [progressBarFlash, setProgressBarFlash] = useState(false);
  const [fps, setFps] = useState(0);
  const [debugLastGoalLevel, setDebugLastGoalLevel] = useState(0);
  const [debugDiscoveryGoalsUntil, setDebugDiscoveryGoalsUntil] = useState(0);
  const rafCountRef = useRef(0);
  const gameTickCountRef = useRef(0);
  const gameTickRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const lastCountTimeRef = useRef(performance.now());
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const now = performance.now();
      const perfMode = getPerformanceMode();
      if (perfMode) {
        if (now - lastCountTimeRef.current >= FPS_COUNT_INTERVAL_30_MS) {
          lastCountTimeRef.current = now;
          rafCountRef.current += 1;
        }
      } else {
        rafCountRef.current += 1;
      }
      gameTickCountRef.current += getTickCount60(gameTickRef);
      if (now - lastFpsUpdateRef.current >= 1000) {
        const rafPerSec = rafCountRef.current;
        const ticksDelivered = gameTickCountRef.current;
        const maxFps = perfMode ? 30 : 60;
        // In perf mode, 25–30 counts is "30fps target"; show 30 so it doesn't snap down to 25
        const raw = Math.min(maxFps, rafPerSec, ticksDelivered);
        const displayFps = perfMode && raw >= 24 ? 30 : raw;
        setFps(displayFps);
        rafCountRef.current = 0;
        gameTickCountRef.current = 0;
        lastFpsUpdateRef.current = now;
        lastCountTimeRef.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!debugLastSpawnedGoalLevelRef) return;
    const poll = () => {
      const v = debugLastSpawnedGoalLevelRef.current;
      setDebugLastGoalLevel((prev) => (prev !== v ? v : prev));
    };
    poll();
    const id = window.setInterval(poll, 100);
    return () => clearInterval(id);
  }, [debugLastSpawnedGoalLevelRef]);

  useEffect(() => {
    if (!debugDiscoveryGoalsUntilRef) return;
    const poll = () => {
      const v = debugDiscoveryGoalsUntilRef.current;
      setDebugDiscoveryGoalsUntil((prev) => (prev !== v ? v : prev));
    };
    poll();
    const id = window.setInterval(poll, 100);
    return () => clearInterval(id);
  }, [debugDiscoveryGoalsUntilRef]);

  useEffect(() => {
    if (walletBurstCount > prevBurstRef.current) {
      setBounceKey((k) => k + 1);
    }
    prevBurstRef.current = walletBurstCount;
  }, [walletBurstCount]);

  useEffect(() => {
    const burst = goldenPotWallet?.burstCount ?? 0;
    if (burst > prevGoldenPotBurstRef.current) {
      setGoldenPotBounceKey((k) => k + 1);
    }
    prevGoldenPotBurstRef.current = burst;
  }, [goldenPotWallet?.burstCount]);
  useEffect(() => {
    if (playerLevelFlashTrigger > prevFlashRef.current) {
      setProgressBarFlash(true);
      prevFlashRef.current = playerLevelFlashTrigger;
      const t = setTimeout(() => setProgressBarFlash(false), 320);
      return () => clearTimeout(t);
    }
  }, [playerLevelFlashTrigger]);

  /** Store / shed can force-hide; also hide when the bar is full of boosts (5 visible + busy). */
  const hideFpsReader = hideFps || activeBoosts.length >= MAX_VISIBLE_BOOST_SLOTS;

  /** Up to 5 visible slots; 6+ stay in hidden timers until a slot frees (see hiddenBoostSlice). */
  const displayBoostCount = Math.min(activeBoosts.length, MAX_VISIBLE_BOOST_SLOTS);
  const visibleBoostSlice = activeBoosts.slice(0, displayBoostCount);
  const hiddenBoostSlice = activeBoosts.slice(displayBoostCount);

  const bgUrl = getTopUiAssetPath('topui_bg.png', gardenId);

  // Sprite: 600×180
  // Left cap: 0–184px (184px wide)
  // Middle: 184–416px (232px wide) – stretch
  // Right cap: 416–600px (184px wide)
  const SPRITE_W = 600;
  const SPRITE_H = 180;
  const LEFT_CAP_PX = 184;
  const RIGHT_CAP_START_PX = 416;
  const MIDDLE_PX = RIGHT_CAP_START_PX - LEFT_CAP_PX; // 232

  // Left/right cap width when scaled to fit height 44px (184 * 44/180 ≈ 45px)
  const capWidthPx = Math.round((LEFT_CAP_PX * 44) / SPRITE_H);
  /** Golden pot right dock is collection-only; farm/store keep the locked fec7f0a dock layout. */
  const showGoldenPotWallet = goldenPotWallet != null;
  const goldenPotWalletReservePx = showGoldenPotWallet
    ? Math.round(GOLDEN_POT_WALLET_RESERVE_PX * GOLDEN_POT_WALLET_SCALE) + GOLDEN_POT_WALLET_GAP_PX
    : 0;
  const baseRightDockReservePx = hideFpsReader
    ? RIGHT_DOCK_RESERVE_PX_NO_FPS
    : RIGHT_DOCK_RESERVE_PX_WITH_FPS;
  const rightDockReservePx = baseRightDockReservePx + goldenPotWalletReservePx;
  const fpsRightOffsetPx = FPS_RIGHT_OFFSET_PX + goldenPotWalletReservePx;
  const settingsDockRightPx = showGoldenPotWallet
    ? SETTINGS_DOCK_RIGHT_WITH_GOLDEN_POT_PX
    : SETTINGS_DOCK_RIGHT_PX;
  /** Farm/store boost strip (after level bar or store spacer). Collection omits level and has no boosts. */
  const showBoostStrip = !omitPlayerLevelBlock || displayBoostCount > 0;
  const useAfterCenterTitleBoosts = boostAreaLayout === 'afterCenterTitle' && !!centerTitle;

  const measureAfterCenterTitleBoostLeft = useCallback(() => {
    const titleEl = centerTitleRef.current;
    const wrapperEl = headerLeftWrapperRef?.current;
    if (!titleEl || !wrapperEl) return;
    const titleRect = titleEl.getBoundingClientRect();
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const scale = wrapperEl.offsetWidth > 0 ? wrapperRect.width / wrapperEl.offsetWidth : 1;
    setAfterCenterTitleBoostLeftPx(
      (titleRect.right + AFTER_CENTER_TITLE_BOOST_PAD_PX - wrapperRect.left) / scale,
    );
  }, [headerLeftWrapperRef]);

  useLayoutEffect(() => {
    if (!useAfterCenterTitleBoosts) {
      setAfterCenterTitleBoostLeftPx(null);
      return;
    }
    measureAfterCenterTitleBoostLeft();
    window.addEventListener('resize', measureAfterCenterTitleBoostLeft);
    const ro = new ResizeObserver(measureAfterCenterTitleBoostLeft);
    if (centerTitleRef.current) ro.observe(centerTitleRef.current);
    if (headerLeftWrapperRef?.current) ro.observe(headerLeftWrapperRef.current);
    return () => {
      window.removeEventListener('resize', measureAfterCenterTitleBoostLeft);
      ro.disconnect();
    };
  }, [
    useAfterCenterTitleBoosts,
    centerTitle,
    measureAfterCenterTitleBoostLeft,
    displayBoostCount,
    headerLeftWrapperRef,
  ]);

  const boostStripWidthPx =
    displayBoostCount > 0
      ? displayBoostCount * ACTIVE_BOOST_INDICATOR_SIZE_PX + (displayBoostCount - 1) * BOOST_GAP_PX
      : activeBoostMinWidthPx ?? ACTIVE_BOOST_INDICATOR_SIZE_PX;

  /** Store: same flex row / vertical alignment as farm; only marginLeft pushes past the title. */
  const boostStripMarginLeftPx = useAfterCenterTitleBoosts
    ? afterCenterTitleBoostLeftPx != null
      ? Math.max(0, afterCenterTitleBoostLeftPx - WALLET_WIDTH_PX - HEADER_CLUSTER_GAP_PX)
      : 0
    : BOOST_STRIP_MARGIN_LEFT_PX + boostAreaMarginLeftOffset;

  return (
    <header
      className={`z-10 shrink-0 pt-4 pb-2 ${headerOuterPadLeftPx === undefined ? 'px-2' : 'pr-2'}`}
      style={headerOuterPadLeftPx !== undefined ? { paddingLeft: headerOuterPadLeftPx } : undefined}
    >
      {/* Top UI background - 3-slice: left cap (fixed), center (stretch), right cap (fixed) */}
      <div className="relative flex min-h-[44px]">
        {/* 3-slice background layer - hidden when hideTopBarBg (e.g. shed screen) */}
        {!hideTopBarBg && (
        <div className="absolute inset-0 flex w-full pointer-events-none">
          {/* Left cap - 0–184px of sprite, no stretch */}
          <div
            className="flex-shrink-0"
            style={{
              width: `${capWidthPx}px`,
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'auto 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'left center',
            }}
          />
          {/* Center - middle 232px stretched to fill (184-416px of sprite). -1px overlap hides sub-pixel gaps at scale. */}
          <div
            className="flex-1 min-w-[20px]"
            style={{
              marginLeft: -1,
              marginRight: -1,
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: '258.6% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '50% center',
            }}
          />
          {/* Right cap - 416–600px of sprite, no stretch */}
          <div
            className="flex-shrink-0"
            style={{
              width: `${capWidthPx}px`,
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'auto 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right center',
            }}
          />
        </div>
        )}
        {/* Content on top — left cluster flexes; FPS + settings are absolutely docked so boosts never push them off-screen */}
        <div
          className={`relative z-10 flex w-full min-w-0 min-h-[44px] items-center py-2 ${headerRowPadLeftPx === undefined ? 'pl-3 pr-3' : 'pr-3'}`}
          style={{
            /* Reserve space for absolute FPS + settings dock — do not shrink the cluster with max-width/clip (that hid boosts 3–5 and clipped the coin icon). */
            paddingRight: rightDockReservePx,
            ...(headerRowPadLeftPx !== undefined ? { paddingLeft: headerRowPadLeftPx } : {}),
          }}
        >
          {centerTitle && (
            <div
              ref={centerTitleRef}
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                color: '#5c4a32',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 900,
                fontSize: '1.15rem',
                lineHeight: 1,
                zIndex: 20,
              }}
            >
              {centerTitle}
            </div>
          )}
      <div
        ref={headerLeftWrapperRef}
        className="relative z-30 flex min-w-0 flex-1 items-center overflow-visible"
        style={{
          marginLeft: headerClusterMarginLeftPx ?? 10,
          gap: HEADER_CLUSTER_GAP_PX,
          transform: 'scale(0.88)',
          transformOrigin: 'left center',
        }}
      >
        {isInteractive ? (
          <>
            <button
              ref={walletRef}
              onClick={onWalletClick}
              className="relative inline-flex items-center justify-center rounded-full border outline-none shadow-2xl hover:opacity-90 active:scale-95 transition-all overflow-visible flex-shrink-0"
              style={{
                width: 85,
                minWidth: 85,
                maxWidth: 85,
                height: 22,
                backgroundColor: '#775041',
                borderWidth: 1,
                borderColor: '#e9dcaf',
              }}
            >
              <div
                className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-75 ease-out"
                style={{
                  background: '#d2af7b',
                  opacity: walletFlashActive ? 1 : 0,
                }}
                aria-hidden
              />
              {/* Icon: fixed left, does not affect width */}
              <span
                ref={walletIconRef}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center leading-none -ml-3 pointer-events-none"
                aria-hidden
              >
                <img key={bounceKey} src={getGardenCoinIconPath()} alt="" className={`w-[30px] h-[30px] object-contain object-left outline-none border-0 ${bounceKey > 0 ? 'coin-bounce' : ''}`} style={{ outline: 'none', border: 'none' }} />
              </span>
              {/* Text centered in fixed 85px width */}
              <span
                key={bounceKey}
                className={`relative font-black text-xs tracking-tight text-[#fcf0c7] whitespace-nowrap truncate pl-[12px] pr-2 py-1 max-w-full ${bounceKey > 0 ? 'coin-text-bounce' : ''}`}
                style={{ transformOrigin: 'center center' }}
              >
                {formatMoney(money)}
              </span>
            </button>
            {/* Store (afterCenterTitle): no spacer — boosts sit right of the title. Farm: level bar or FTUE spacer. */}
            {!omitPlayerLevelBlock &&
              !useAfterCenterTitleBoosts &&
              (collapsePlayerLevel && hidePlayerLevel ? (
                <div
                  aria-hidden
                  className="flex-shrink-0 pointer-events-none"
                  style={{
                    width: PLAYER_LEVEL_SLOT_WIDTH_PX,
                    minWidth: PLAYER_LEVEL_SLOT_WIDTH_PX,
                    height: 22,
                  }}
                />
              ) : (
                <div
                  className="relative inline-flex items-center rounded-full border flex-shrink-0 overflow-visible"
                  style={{
                    width: PLAYER_LEVEL_SLOT_WIDTH_PX,
                    minWidth: PLAYER_LEVEL_SLOT_WIDTH_PX,
                    maxWidth: PLAYER_LEVEL_SLOT_WIDTH_PX,
                    height: 22,
                    backgroundColor: '#775041',
                    borderWidth: 1,
                    borderColor: '#e9dcaf',
                    display: 'inline-flex',
                    opacity: hidePlayerLevel ? 0 : 1,
                    transition: 'opacity 400ms ease-out',
                    ...(hidePlayerLevel && { pointerEvents: 'none' as const }),
                  }}
                >
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center leading-none -ml-3 pointer-events-none z-10 w-[30px] h-[30px]">
                    <img src={getGardenLevelIconPath()} alt="" className="w-[30px] h-[30px] object-contain object-left" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-black leading-none" style={{ color: '#c8e9eb', fontSize: 12, WebkitTextStroke: '1px rgba(0,0,0,0.5)', paintOrder: 'stroke fill' }}>{playerLevel}</span>
                  </span>
                  {/* Progress bar: 1px padding top/right/bottom, 4px left; track #775041; fill has 1px inner stroke */}
                  <div className="flex-1 h-full flex items-stretch relative" style={{ paddingTop: 1, paddingRight: 1, paddingBottom: 1, paddingLeft: 10 }}>
                    {/* Goals count: fixed center of bar, above progress fill; cream text, black stroke 50%; same size as coin panel (text-xs) */}
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none font-black text-xs leading-none z-10"
                      style={{
                        color: '#fcf0c7',
                        WebkitTextStroke: '1px rgba(0,0,0,0.5)',
                        paintOrder: 'stroke fill',
                      }}
                    >
                      {playerLevelProgress}/{playerLevelGoalsRequired}
                    </span>
                    <div className="w-full h-full overflow-hidden bg-[#775041]" style={{ borderRadius: '0 9999px 9999px 0' }}>
                      {/* Progress completed: 2px padding, inner 2px stroke (gradient) on top of fill */}
                      <div
                        className="relative h-full transition-all duration-300 overflow-hidden"
                        style={{ width: `${playerLevelGoalsRequired > 0 ? (playerLevelProgress / playerLevelGoalsRequired) * 100 : 0}%`, borderRadius: '0 9999px 9999px 0' }}
                      >
                        <div
                          className="w-full h-full overflow-hidden relative"
                          style={{
                            padding: 1,
                            background: 'linear-gradient(180deg, #c2e3f6 0%, #2d77b5 100%)',
                            borderRadius: '0 9999px 9999px 0',
                          }}
                        >
                          <div
                            className="w-full h-full"
                            style={{
                              background: 'linear-gradient(180deg, #7fc8eb 0%, #559dcf 100%)',
                              borderRadius: '0 9999px 9999px 0',
                            }}
                          />
                          {/* Flash overlay: only over progress completed, below icon, fades out with bar animation */}
                          {progressBarFlash && (
                            <div
                              className="absolute inset-0 pointer-events-none progress-bar-flash"
                              style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '0 9999px 9999px 0' }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {/* Active boosts: wallet/level sit outside this box so coin -ml-3 is never clipped; up to 5 icons (6+ use hidden timers). */}
            {showBoostStrip && (
            <div
              ref={activeBoostAreaRef}
              className="relative flex flex-shrink-0 items-center overflow-visible boost-slide-container"
              style={{
                marginLeft: boostStripMarginLeftPx,
                height: 22,
                minHeight: 22,
                width: boostStripWidthPx,
                ...(activeBoostMinWidthPx != null &&
                  displayBoostCount === 0 && { minWidth: activeBoostMinWidthPx }),
              }}
            >
              {visibleBoostSlice.map((boost, index) => (
                <div
                  key={boost.id}
                  ref={(el) => { boostRefs.current[boost.id] = el; }}
                  role="button"
                  tabIndex={0}
                  onClick={() => onBoostClick?.(boost)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBoostClick?.(boost); } }}
                  className="absolute flex items-center justify-center boost-slide cursor-pointer"
                  style={{
                    left: index * BOOST_SLOT_WIDTH,
                    top: 0,
                    width: ACTIVE_BOOST_INDICATOR_SIZE_PX,
                    height: 22,
                    transform: 'translateZ(0)',
                  }}
                >
                  <ActiveBoostIndicator
                    data={boost}
                    onComplete={(id) => {
                      const rect = boostRefs.current[id]?.getBoundingClientRect?.();
                      onBoostComplete?.(id, rect);
                    }}
                  />
                </div>
              ))}
            </div>
            )}
          </>
        ) : plantWallet ? (
          <div className="relative flex items-center gap-1 bg-black/50 backdrop-blur-md pl-1 pr-2 py-1 rounded-full border-0 shadow-2xl overflow-hidden -ml-4">
            <span
              className="relative flex items-center justify-center text-sm leading-none text-white"
              aria-hidden
            >
              🌱
            </span>
            <span className="relative font-black text-xs tracking-tight text-white">
              {plantWallet.unlockedCount} / {plantWallet.totalCount}
            </span>
          </div>
        ) : (
          <div
            className="relative inline-flex items-center h-[22px] rounded-full border shadow-2xl overflow-visible w-fit min-w-0"
            style={{
              backgroundColor: '#775041',
              borderWidth: 1,
              borderColor: '#e9dcaf',
            }}
          >
            <div
              className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-75 ease-out"
              style={{
                background: '#d2af7b',
                opacity: walletFlashActive ? 1 : 0,
              }}
              aria-hidden
            />
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center leading-none -ml-3 pointer-events-none"
              aria-hidden
            >
              <img key={bounceKey} src={getGardenCoinIconPath()} alt="" className={`w-[30px] h-[30px] object-contain object-left outline-none border-0 ${bounceKey > 0 ? 'coin-bounce' : ''}`} style={{ outline: 'none', border: 'none' }} />
            </span>
            <span
              key={bounceKey}
              className={`relative font-black text-xs tracking-tight text-[#fcf0c7] whitespace-nowrap pl-[20px] pr-3 py-1 ${bounceKey > 0 ? 'coin-text-bounce' : ''}`}
              style={{ transformOrigin: 'center center' }}
            >
              {formatMoney(money)}
            </span>
          </div>
        )}
      </div>

      {/* FPS below boosts (z-20 < z-30); optional last-goal debug left of FPS */}
      {(!hideFpsReader || debugLastSpawnedGoalLevelRef || debugDiscoveryGoalsUntilRef) && (
        <div
          className="pointer-events-none absolute top-1/2 z-20 flex -translate-y-1/2 flex-row items-center justify-end gap-1.5"
          style={{ right: fpsRightOffsetPx }}
        >
          {debugDiscoveryGoalsUntilRef && (
            <span
              className="pointer-events-none min-w-[1.25rem] select-none whitespace-nowrap rounded border border-[#5c4035]/50 bg-black/35 px-1.5 py-0.5 text-center tabular-nums text-[10px] font-semibold leading-none"
              style={{ color: '#c8e8a8' }}
              title="Normal goal spawns remaining until discovery order (buffer − counter; ticks when a new normal order appears, not on coin tap)"
            >
              {debugDiscoveryGoalsUntil < 0 ? '—' : debugDiscoveryGoalsUntil}
            </span>
          )}
          {debugLastSpawnedGoalLevelRef && (
            <span
              className="pointer-events-none select-none whitespace-nowrap rounded border border-[#5c4035]/50 bg-black/35 px-1.5 py-0.5 tabular-nums text-[10px] font-semibold leading-none"
              style={{ color: '#e8d4a8' }}
              title="Last committed goal plant tier (debug)"
            >
              Last:{' '}
              {debugLastGoalLevel >= 1 && debugLastGoalLevel <= MAX_PLANT_TIER
                ? `Plant ${debugLastGoalLevel}`
                : '—'}
            </span>
          )}
          {!hideFpsReader && (
            <button
              ref={fpsButtonRef}
              type="button"
              className="pointer-events-auto tabular-nums text-[10px] font-semibold select-none cursor-pointer hover:underline focus:outline-none"
              style={{ color: '#c4a574', background: 'none', border: 'none', padding: 0 }}
              aria-label={`${fps} FPS (click to simulate hitch)`}
              title="Click to simulate a hitch — FPS should drop briefly if the counter is working"
              onClick={() => {
                const end = performance.now() + 250;
                while (performance.now() < end) {}
              }}
            >
              {fps} FPS
            </button>
          )}
        </div>
      )}
      <div
        className={`absolute top-1/2 z-40 flex -translate-y-1/2 items-center${showGoldenPotWallet ? '' : ' right-3'}`}
        style={
          showGoldenPotWallet
            ? { right: settingsDockRightPx, gap: GOLDEN_POT_WALLET_GAP_PX }
            : undefined
        }
      >
        {showGoldenPotWallet && (
          <button
            ref={goldenPotWallet.walletRef}
            type="button"
            className="relative inline-flex items-center justify-center rounded-full border outline-none shadow-2xl overflow-visible flex-shrink-0"
            style={{
              height: 22,
              minWidth: 78,
              marginLeft: 6,
              backgroundColor: '#775041',
              borderWidth: 1,
              borderColor: '#e9dcaf',
              transform: `scale(${GOLDEN_POT_WALLET_SCALE})`,
              transformOrigin: 'right center',
            }}
            aria-label={`${goldenPotWallet.count} of ${goldenPotWallet.totalCount} golden pots`}
          >
            <div
              className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-75 ease-out"
              style={{
                background: '#d2af7b',
                opacity: goldenPotWallet.flashActive ? 1 : 0,
              }}
              aria-hidden
            />
            <span
              ref={goldenPotWallet.walletIconRef}
              className="absolute left-0 top-1/2 flex items-center justify-center leading-none -ml-3 pointer-events-none"
              style={{ transform: 'translateY(calc(-50% + 1px))' }}
              aria-hidden
            >
              <img
                key={goldenPotBounceKey}
                src={getGoldenPotWalletIconPath()}
                alt=""
                className={`object-contain object-left outline-none border-0 ${goldenPotBounceKey > 0 ? 'coin-bounce' : ''}`}
                style={{
                  width: GOLDEN_POT_WALLET_ICON_PX,
                  height: GOLDEN_POT_WALLET_ICON_PX,
                  outline: 'none',
                  border: 'none',
                }}
                draggable={false}
              />
            </span>
            <span
              key={goldenPotBounceKey}
              className={`relative font-black text-xs tracking-tight text-[#fcf0c7] whitespace-nowrap pl-[22px] pr-2 py-1 ${goldenPotBounceKey > 0 ? 'coin-text-bounce' : ''}`}
              style={{ transformOrigin: 'center center' }}
            >
              {goldenPotWallet.count}/{goldenPotWallet.totalCount}
            </span>
          </button>
        )}
        <button
          id="settings-gear-button"
          ref={settingsButtonRef}
          type="button"
          onClick={onPauseClick}
          className="flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0"
          style={{
            width: SETTINGS_GEAR_PX,
            height: SETTINGS_GEAR_PX,
            backgroundColor: '#775041',
            borderWidth: 1,
            borderColor: '#e9dcaf',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#fcf0c7" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
        </div>
      </div>

      {/* Timers for boosts past the visible cap (still active, no icon until a slot frees) */}
      {hiddenBoostSlice.map((boost) => (
        <div
          key={`hidden-boost-${boost.id}`}
          className="pointer-events-none fixed overflow-hidden opacity-0"
          style={{ left: -9999, top: 0, width: ACTIVE_BOOST_INDICATOR_SIZE_PX, height: 22 }}
          aria-hidden
        >
          <ActiveBoostIndicator
            data={boost}
            onComplete={(id) => {
              const rect = boostRefs.current[id]?.getBoundingClientRect?.();
              onBoostComplete?.(id, rect);
            }}
          />
        </div>
      ))}
    </header>
  );
};
