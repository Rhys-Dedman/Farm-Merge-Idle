import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PageHeader } from './PageHeader';
import { assetPath } from '../utils/assetPath';
import type { ActiveBoostData } from './ActiveBoostIndicator';
import { ACTIVE_BOOST_INDICATOR_SIZE_PX } from './ActiveBoostIndicator';
import {
  getOfferById,
  STORE_DAILY_ALLOWANCE_OFFER_ID,
  STORE_FREE_OFFER_HEADER_ICON_PX,
  STORE_IAP_OFFER_FIELD_PACK_ID,
  STORE_IAP_OFFER_REMOVE_ADS_ID,
  STORE_IAP_OFFER_STARTER_PACK_ID,
  getVisibleStoreBundleOffers,
  getVisibleStoreCoinOffers,
  hasActiveRemoveAdsBoost,
} from '../offers';
import { useFieldPackCountdown, useStarterPackCountdown } from '../hooks/useStarterPackCountdown';
import { StoreBundleOffer } from './StoreBundleOffer';
import { StoreCoinOffer } from './StoreCoinOffer';
import { formatCompactNumber } from '../utils/formatCompactNumber';
import {
  REWARD_PILL_DIVIDER_COLOR,
  REWARD_PILL_DIVIDER_HEIGHT_PX,
  REWARD_PILL_DIVIDER_WIDTH_PX,
  REWARD_PILL_FILL_COLOR,
  REWARD_PILL_STROKE_COLOR,
  REWARD_PILL_STROKE_WIDTH_PX,
} from './Reward';

/** Matches upgrade panel MAX / disabled purchase button (UpgradeList). */
const UPGRADE_MAX_BUTTON_BG = '#e3c28c';
const UPGRADE_MAX_BUTTON_DEPTH = '#c7a36e';
const UPGRADE_MAX_BUTTON_FONT = '#a68e64';

const FREE_OFFER_TITLE_FONT_MAX_PX = 13;
const FREE_OFFER_TITLE_FONT_MIN_PX = 6;

const STORE_FREE_OFFER_TITLE_BOX_WIDTH_PX = 110;
const STORE_FREE_OFFER_TITLE_BOX_LEFT_PX = 30;

/** Visual scale for `ui_store_medium` free-offer cards (layout width fixed below). */
const STORE_FREE_OFFER_SCALE = 1.05;
const STORE_FREE_OFFER_LAYOUT_W_PX = 214;

/** Match `PageHeader` total block height (pt-4 + bar + pb-2) so brown can sit flush under the bar art. */
const STORE_PAGE_HEADER_HEIGHT_PX = 84;
/** Brown band below the header (above scroll); 0 = scroll sits flush under header bar. */
const STORE_TOP_CHROME_BELOW_HEADER_PX = 10;
/** Horizontal rule inset above the scroll clip (gap between line bottom and scroll top). */
const STORE_MASK_LINE_ABOVE_SCROLL_PX = 3;
/** Extra space below the last store row when scrolled to the end. */
const STORE_SCROLL_CONTENT_PADDING_BOTTOM_PX = 10;
/** Wait for farm → store horizontal slide before programmatic scroll. */
const STORE_SCROLL_TO_COIN_SECTION_DELAY_MS = 720;
const STORE_SCROLL_TO_COIN_SECTION_DURATION_MS = 650;
const STORE_TOP_CHROME_BROWN = '#432f2a';
const STORE_MASK_LINE_COLOR = '#775041';

/** Reward pill chrome on medium free-offer cards — aligned to existing title + duration positions. */
const STORE_FREE_OFFER_PILL_LEFT_PX = 21;
const STORE_FREE_OFFER_PILL_WIDTH_PX = 172;
const STORE_FREE_OFFER_PILL_HEIGHT_PX = 33;
/** Nudge pill + divider up (px) while keeping text positions fixed. */
const STORE_FREE_OFFER_PILL_OFFSET_Y_PX = -1;
/** Between title box (ends ~140) and duration (starts 152). */
const STORE_FREE_OFFER_PILL_DIVIDER_LEFT_PX = 146;
const STORE_FREE_OFFER_PILL_CENTER_Y = `calc(-50% + ${STORE_FREE_OFFER_PILL_OFFSET_Y_PX}px)`;

const storeFreeOfferPillStyle: React.CSSProperties = {
  left: STORE_FREE_OFFER_PILL_LEFT_PX,
  top: '50%',
  transform: `translateY(${STORE_FREE_OFFER_PILL_CENTER_Y})`,
  width: STORE_FREE_OFFER_PILL_WIDTH_PX,
  height: STORE_FREE_OFFER_PILL_HEIGHT_PX,
  backgroundColor: REWARD_PILL_FILL_COLOR,
  border: `${REWARD_PILL_STROKE_WIDTH_PX}px solid ${REWARD_PILL_STROKE_COLOR}`,
};

/** Normal garden coin icon size inside the allowance pill row. */
const STORE_FREE_OFFER_ALLOWANCE_COIN_IN_PILL_PX = 22;

/** Green purchase-style FREE button (Daily Allowance only). */
const DAILY_ALLOWANCE_FREE_BUTTON_BG = '#cae060';
const DAILY_ALLOWANCE_FREE_BUTTON_DEPTH = '#9db546';
const DAILY_ALLOWANCE_FREE_BUTTON_ACTIVE_BG = '#61882b';
const DAILY_ALLOWANCE_FREE_BUTTON_FONT = '#587e26';
const DAILY_ALLOWANCE_FREE_BUTTON_ACTIVE_FONT = '#cbe05d';

export type StoreDailyAllowanceDisplay = {
  coinIconPath: string;
  coinAmount: number;
};

/** Store free offer — tiny version of rewarded ad. Rotates to a new pool offer after cooldown (with bounce). */
const StoreFreeOffer: React.FC<{
  slotIndex: number;
  offerId: string;
  onFreeClick?: (buttonRect: DOMRect, particleOriginRect?: DOMRect) => void;
  cooldownEndMs?: number;
  onSlotCooldownEnded?: (slotIndex: number) => void;
  /** When set on slot 0, replaces the normal free offer until claimed today. */
  dailyAllowance?: StoreDailyAllowanceDisplay | null;
  /** After claim: hide large icon only while post-claim hold runs (pill stays; button shows timer). */
  hideAllowanceIcon?: boolean;
}> = ({ slotIndex, offerId, onFreeClick, cooldownEndMs = 0, onSlotCooldownEnded, dailyAllowance = null, hideAllowanceIcon = false }) => {
  const [pressed, setPressed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [bounceActive, setBounceActive] = useState(false);
  const prevOnCooldownRef = useRef(false);
  const cooldownEndHandledRef = useRef(false);
  const freeOfferTitleBoxRef = useRef<HTMLDivElement>(null);
  const freeOfferTitleTextRef = useRef<HTMLSpanElement>(null);
  const headerIconRef = useRef<HTMLImageElement>(null);
  const headerIconSlotRef = useRef<HTMLDivElement>(null);
  const [freeOfferTitleFontPx, setFreeOfferTitleFontPx] = useState(FREE_OFFER_TITLE_FONT_MAX_PX);
  const offer = offerId === STORE_DAILY_ALLOWANCE_OFFER_ID ? undefined : getOfferById(offerId);
  const isDailyAllowanceMode = dailyAllowance != null;

  // Allowance FREE is only before claim; after claim the slot cooldown timer shows immediately.
  const effectiveCooldownEndMs = isDailyAllowanceMode && !hideAllowanceIcon ? 0 : cooldownEndMs;
  const isOnCooldown = effectiveCooldownEndMs > now;
  const remainingMs = Math.max(0, effectiveCooldownEndMs - now);
  const remainingMins = Math.floor(remainingMs / 60000);
  const remainingSecs = Math.floor((remainingMs % 60000) / 1000);
  const timerLabel = `${remainingMins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;

  const durationSeconds =
    offer?.durationSeconds ?? (offer?.durationMinutes != null ? offer.durationMinutes * 60 : 0);
  const durationLabel = durationSeconds <= 0 ? 'Instant' : `${durationSeconds}s`;

  // Tick every second when on cooldown
  useEffect(() => {
    if (!isOnCooldown) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isOnCooldown, effectiveCooldownEndMs]);

  useEffect(() => {
    if (isOnCooldown) cooldownEndHandledRef.current = false;
  }, [isOnCooldown]);

  // When slot cooldown ends: bounce, swap offer mid-animation, then FREE again
  useEffect(() => {
    const justEnded = prevOnCooldownRef.current && !isOnCooldown && effectiveCooldownEndMs > 0;
    prevOnCooldownRef.current = isOnCooldown;
    if (!justEnded || cooldownEndHandledRef.current) return;
    cooldownEndHandledRef.current = true;
    setBounceActive(true);
    const swapId = window.setTimeout(() => {
      onSlotCooldownEnded?.(slotIndex);
    }, 200);
    const clearBounceId = window.setTimeout(() => setBounceActive(false), 480);
    return () => {
      window.clearTimeout(swapId);
      window.clearTimeout(clearBounceId);
    };
  }, [isOnCooldown, effectiveCooldownEndMs, slotIndex, onSlotCooldownEnded]);

  useEffect(() => {
    setFreeOfferTitleFontPx(FREE_OFFER_TITLE_FONT_MAX_PX);
  }, [offerId]);

  // Title: shrink font until full label fits in the title box (e.g. "Happiest Customers").
  useLayoutEffect(() => {
    if (isDailyAllowanceMode) return;
    const box = freeOfferTitleBoxRef.current;
    const text = freeOfferTitleTextRef.current;
    if (!offer || !box || !text) return;

    const fitTitle = () => {
      const cs = getComputedStyle(box);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const availW = Math.max(
        1,
        (box.clientWidth > 0 ? box.clientWidth : STORE_FREE_OFFER_TITLE_BOX_WIDTH_PX) - padX,
      );

      text.style.display = 'inline-block';
      text.style.width = 'max-content';
      text.style.maxWidth = 'none';

      let px = FREE_OFFER_TITLE_FONT_MAX_PX;
      text.style.fontSize = `${px}px`;
      while (px > FREE_OFFER_TITLE_FONT_MIN_PX && text.scrollWidth > availW) {
        px -= 0.5;
        text.style.fontSize = `${px}px`;
      }
      setFreeOfferTitleFontPx(px);
    };

    fitTitle();
    const ro = new ResizeObserver(fitTitle);
    ro.observe(box);
    return () => ro.disconnect();
  }, [offerId, offer?.title, isDailyAllowanceMode, offer]);

  const rowBandStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 28,
    marginTop: 9,
  };
  const yMid: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)' };

  if (!offer && !isDailyAllowanceMode) return null;

  const headerIconSrc = isDailyAllowanceMode
    ? dailyAllowance!.coinIconPath
    : assetPath(offer!.headerIcon);

  return (
    <div
      className={`flex justify-center flex-shrink-0 ${bounceActive ? 'store-free-offer-bounce' : ''}`}
      style={{ width: STORE_FREE_OFFER_LAYOUT_W_PX }}
    >
      <div
        style={{
          width: STORE_FREE_OFFER_LAYOUT_W_PX,
          transform: `scale(${STORE_FREE_OFFER_SCALE})`,
          transformOrigin: 'top center',
        }}
      >
        <div
          className="relative max-w-full flex-shrink-0"
          style={{ width: STORE_FREE_OFFER_LAYOUT_W_PX }}
        >
          <img
            src={assetPath('/assets/ui/ui_store_medium.png')}
            alt=""
            className="w-full h-auto block pointer-events-none select-none"
          />
          <div className="absolute inset-0 flex flex-col pointer-events-none select-none">
            {/* Large offer icon — top center */}
            <div className="flex justify-center shrink-0 pt-6 pb-1">
              {/* Reserve 108px height like the original icon so title/duration band stays aligned to the art */}
              <div
                ref={headerIconSlotRef}
                className="flex items-center justify-center shrink-0"
                style={{ height: 108, width: '100%' }}
              >
                {!(isDailyAllowanceMode && hideAllowanceIcon) && (
                  <img
                    ref={headerIconRef}
                    src={headerIconSrc}
                    alt=""
                    className="object-contain"
                    style={{
                      width: STORE_FREE_OFFER_HEADER_ICON_PX,
                      height: STORE_FREE_OFFER_HEADER_ICON_PX,
                      transform: 'translateY(2px)',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Title box (centered text); duration fixed at left:152 (may overlap) — or coin pill for daily allowance */}
            <div className="flex-1 flex items-start justify-center min-h-0 w-full">
              <div style={rowBandStyle}>
                <>
                  {/* Shared reward pill — all free offers + daily allowance (allowance has no divider). */}
                  <div aria-hidden className="absolute z-0 rounded-full box-border" style={storeFreeOfferPillStyle} />
                  {isDailyAllowanceMode ? (
                  <div
                    className="absolute z-[2] flex min-w-0 items-center justify-center gap-1 overflow-hidden px-2"
                    style={{
                      left: STORE_FREE_OFFER_PILL_LEFT_PX,
                      width: STORE_FREE_OFFER_PILL_WIDTH_PX,
                      top: '50%',
                      transform: `translateY(${STORE_FREE_OFFER_PILL_CENTER_Y})`,
                      height: STORE_FREE_OFFER_PILL_HEIGHT_PX,
                    }}
                  >
                    <img
                      src={dailyAllowance!.coinIconPath}
                      alt=""
                      className="object-contain flex-shrink-0"
                      style={{
                        width: STORE_FREE_OFFER_ALLOWANCE_COIN_IN_PILL_PX,
                        height: STORE_FREE_OFFER_ALLOWANCE_COIN_IN_PILL_PX,
                      }}
                    />
                    <span
                      className="font-black leading-none whitespace-nowrap text-center"
                      style={{ color: '#6c5851', fontSize: '13px' }}
                    >
                      {formatCompactNumber(dailyAllowance!.coinAmount)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div
                      aria-hidden
                      className="absolute z-[1] shrink-0"
                      style={{
                        left: STORE_FREE_OFFER_PILL_DIVIDER_LEFT_PX,
                        top: '50%',
                        transform: `translateY(${STORE_FREE_OFFER_PILL_CENTER_Y})`,
                        width: REWARD_PILL_DIVIDER_WIDTH_PX,
                        height: REWARD_PILL_DIVIDER_HEIGHT_PX,
                        backgroundColor: REWARD_PILL_DIVIDER_COLOR,
                        borderRadius: 1.5,
                      }}
                    />
                    <div
                      ref={freeOfferTitleBoxRef}
                      className="z-[2] flex min-w-0 items-center justify-center overflow-hidden rounded-[4px] px-1"
                      style={{
                        position: 'absolute',
                        left: STORE_FREE_OFFER_TITLE_BOX_LEFT_PX,
                        top: 0,
                        width: STORE_FREE_OFFER_TITLE_BOX_WIDTH_PX,
                        height: 28,
                        backgroundColor: 'transparent',
                      }}
                    >
                      <span
                        ref={freeOfferTitleTextRef}
                        className="font-black leading-none whitespace-nowrap text-center"
                        style={{
                          color: '#6c5851',
                          fontSize: `${freeOfferTitleFontPx}px`,
                          display: 'inline-block',
                        }}
                      >
                        {offer!.title}
                      </span>
                    </div>
                    <span
                      className="z-[2] font-black leading-none whitespace-nowrap"
                      style={{ ...yMid, left: 152, color: '#d3b07b', fontSize: '13px' }}
                    >
                      {durationLabel}
                    </span>
                  </>
                  )}
                </>
              </div>
            </div>

            {/* Button: yellow FREE (available) or MAX-style tan timer (cooldown) — ~0.9× scale */}
            <div
              className="absolute left-1/2 z-[2] flex justify-center"
              style={{
                bottom: 24,
                transform: 'translateX(-50%) scale(0.9)',
                transformOrigin: 'center bottom',
                pointerEvents: 'none',
              }}
            >
              <button
                type="button"
                disabled={isOnCooldown}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (!isOnCooldown) setPressed(true);
                }}
                onPointerUp={() => setPressed(false)}
                onPointerLeave={() => setPressed(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOnCooldown) {
                    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    const particleOriginRect = isDailyAllowanceMode
                      ? (headerIconRef.current ?? headerIconSlotRef.current)?.getBoundingClientRect()
                      : undefined;
                    onFreeClick?.(rect, particleOriginRect);
                  }
                }}
                className="flex items-center justify-center px-[10px] rounded-[9px] transition-all border outline outline-1 pointer-events-auto"
                style={{
                  height: 36,
                  backgroundColor: isOnCooldown
                    ? UPGRADE_MAX_BUTTON_BG
                    : isDailyAllowanceMode
                      ? pressed
                        ? DAILY_ALLOWANCE_FREE_BUTTON_ACTIVE_BG
                        : DAILY_ALLOWANCE_FREE_BUTTON_BG
                      : pressed
                        ? '#f0c840'
                        : '#ffd856',
                  borderColor: isOnCooldown
                    ? UPGRADE_MAX_BUTTON_DEPTH
                    : isDailyAllowanceMode
                      ? pressed
                        ? DAILY_ALLOWANCE_FREE_BUTTON_ACTIVE_BG
                        : DAILY_ALLOWANCE_FREE_BUTTON_DEPTH
                      : '#f59d42',
                  borderBottomWidth: pressed && !isOnCooldown ? 0 : 4,
                  marginBottom: pressed && !isOnCooldown ? 4 : 0,
                  outlineColor: isOnCooldown
                    ? UPGRADE_MAX_BUTTON_DEPTH
                    : isDailyAllowanceMode
                      ? pressed
                        ? DAILY_ALLOWANCE_FREE_BUTTON_ACTIVE_BG
                        : DAILY_ALLOWANCE_FREE_BUTTON_DEPTH
                      : '#f59d42',
                  minWidth: '114px',
                  transform: pressed && !isOnCooldown ? 'translateY(2px)' : 'translateY(0)',
                  boxShadow: isOnCooldown
                    ? 'inset 0 1px 2px rgba(0,0,0,0.12)'
                    : pressed
                      ? 'inset 0 2px 4px rgba(0,0,0,0.15)'
                      : 'inset 0 1px 1px rgba(255,255,255,0.4)',
                  cursor: isOnCooldown ? 'default' : 'pointer',
                }}
              >
                {isOnCooldown ? (
                  <span
                    className="text-[15px] font-black tracking-tight leading-none tabular-nums"
                    style={{ color: UPGRADE_MAX_BUTTON_FONT }}
                  >
                    {timerLabel}
                  </span>
                ) : isDailyAllowanceMode ? (
                  <span
                    className="text-[15px] font-black tracking-tight leading-none"
                    style={{ color: pressed ? DAILY_ALLOWANCE_FREE_BUTTON_ACTIVE_FONT : DAILY_ALLOWANCE_FREE_BUTTON_FONT }}
                  >
                    FREE
                  </span>
                ) : (
                  <>
                    <img
                      src={assetPath('/assets/icons/generic_buttons/icon_watchad.png')}
                      alt=""
                      className="object-contain flex-shrink-0"
                      style={{
                        width: '23px',
                        height: '23px',
                        filter:
                          'brightness(0) saturate(100%) invert(56%) sepia(67%) saturate(1000%) hue-rotate(346deg) brightness(97%) contrast(88%)',
                        marginRight: 5,
                      }}
                    />
                    <span
                      className="text-[15px] font-black tracking-tight leading-none"
                      style={{ color: '#e6803a' }}
                    >
                      FREE
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StoreScreenProps {
  money: number;
  walletFlashActive?: boolean;
  onAddMoney?: (amount: number) => void;
  onSettingsClick?: () => void;
  onFreeOfferClick?: (offerId: string, slotIndex: number, buttonRect: DOMRect, particleOriginRect?: DOMRect) => void;
  activeBoosts?: ActiveBoostData[];
  activeBoostAreaRef?: React.RefObject<HTMLDivElement | null>;
  headerLeftWrapperRef?: React.RefObject<HTMLDivElement | null>;
  onBoostComplete?: (id: string, rect?: DOMRect) => void;
  onBoostClick?: (boost: ActiveBoostData) => void;
  walletRef?: React.RefObject<HTMLButtonElement | null>;
  walletIconRef?: React.RefObject<HTMLElement | null>;
  /** Current offer id per slot (duration-only pool). */
  storeFreeOfferSlots?: [string, string];
  /** Per-slot 15m cooldown end (ms); 0 = ready for FREE. */
  storeSlotCooldownEnds?: [number, number];
  /** After cooldown + bounce: pick new offer for this slot. */
  onStoreSlotCooldownEnded?: (slotIndex: number) => void;
  /** Slot 0 daily allowance (replaces normal free offer until claimed today). */
  dailyAllowanceSlot0?: StoreDailyAllowanceDisplay | null;
  /** Slot 0: hide allowance large icon during post-claim hold (pill + timer button stay). */
  dailyAllowanceHideIcon?: boolean;
  /** Real-money coin pack row (IAP placeholder). */
  onStoreCoinPurchase?: (offerId: string) => void;
  /** Increment to animate scroll to the coin IAP section (e.g. Coin Boost floating button). */
  scrollToCoinSectionRequest?: number;
  /** When true, starter pack CTA shows Owned (row stays visible). */
  starterPackPurchased?: boolean;
  /** After level-4 unlock popup; enables the 24h countdown in store + farm FB. */
  starterPackUnlocked?: boolean;
  starterPackCountdownRefreshKey?: number;
  /** Garden 2+ level-4 limited bundle (same pattern as starter pack). */
  fieldPackPurchased?: boolean;
  fieldPackUnlocked?: boolean;
  fieldPackCountdownRefreshKey?: number;
  /** Design-space inset below notch; brown chrome bleeds above this, UI starts here. */
  safeTopInsetPx?: number;
}

export const StoreScreen: React.FC<StoreScreenProps> = ({
  money,
  walletFlashActive,
  onSettingsClick,
  onFreeOfferClick,
  activeBoosts = [],
  activeBoostAreaRef,
  headerLeftWrapperRef,
  onBoostComplete,
  onBoostClick,
  walletRef,
  walletIconRef,
  storeFreeOfferSlots = ['double_harvest', 'rapid_seeds'],
  storeSlotCooldownEnds = [0, 0],
  onStoreSlotCooldownEnded,
  dailyAllowanceSlot0 = null,
  dailyAllowanceHideIcon = false,
  onStoreCoinPurchase,
  scrollToCoinSectionRequest = 0,
  starterPackPurchased = false,
  starterPackUnlocked = false,
  starterPackCountdownRefreshKey = 0,
  fieldPackPurchased = false,
  fieldPackUnlocked = false,
  fieldPackCountdownRefreshKey = 0,
  safeTopInsetPx = 0,
}) => {
  const storeTopChromeBleedPx =
    safeTopInsetPx + STORE_PAGE_HEADER_HEIGHT_PX + STORE_TOP_CHROME_BELOW_HEADER_PX;
  const starterPackRemainingMs = useStarterPackCountdown(
    starterPackUnlocked,
    starterPackCountdownRefreshKey,
  );
  const fieldPackRemainingMs = useFieldPackCountdown(
    fieldPackUnlocked,
    fieldPackCountdownRefreshKey,
  );
  const removeAdsOwned = hasActiveRemoveAdsBoost(activeBoosts);
  const visibleBundleOffers = React.useMemo(
    () =>
      getVisibleStoreBundleOffers().filter((o) => {
        // Extra unlock/countdown gates (kill switch + purchased→Owned already in getVisibleStoreBundleOffers).
        if (o.id === STORE_IAP_OFFER_STARTER_PACK_ID) {
          if (starterPackPurchased) return true;
          return starterPackUnlocked && starterPackRemainingMs > 0;
        }
        if (o.id === STORE_IAP_OFFER_FIELD_PACK_ID) {
          if (fieldPackPurchased) return true;
          return fieldPackUnlocked && fieldPackRemainingMs > 0;
        }
        return true;
      }),
    [
      starterPackPurchased,
      starterPackUnlocked,
      starterPackRemainingMs,
      fieldPackPurchased,
      fieldPackUnlocked,
      fieldPackRemainingMs,
    ],
  );
  const visibleCoinOffers = React.useMemo(() => getVisibleStoreCoinOffers(), []);
  // Store scroll: reuse Shed/Barn-style momentum drag, but move the store top-ui list with transforms.
  // This avoids relying on native scroll (which isn't responding correctly on mobile in this screen).
  const storeScrollRef = useRef<HTMLDivElement | null>(null);
  const storeContentRef = useRef<HTMLDivElement | null>(null);
  const storeCoinSectionRef = useRef<HTMLDivElement | null>(null);

  const [storeScrollY, setStoreScrollY] = useState(0);
  const storeScrollYRef = useRef(0);
  storeScrollYRef.current = storeScrollY;

  const getStoreMaxScroll = () => {
    const el = storeScrollRef.current;
    const contentEl = storeContentRef.current;
    if (!el || !contentEl) return 0;
    return Math.max(0, contentEl.offsetHeight - el.clientHeight);
  };

  useEffect(() => {
    if (!scrollToCoinSectionRequest) return;

    let rafId: number | undefined;
    const timer = window.setTimeout(() => {
      const maxScroll = getStoreMaxScroll();
      const coinSection = storeCoinSectionRef.current;
      const viewportHeight = storeScrollRef.current?.clientHeight ?? 0;
      let targetScroll = maxScroll;
      if (coinSection && viewportHeight > 0) {
        const coinTop = coinSection.offsetTop;
        const coinHeight = coinSection.offsetHeight;
        targetScroll = Math.min(
          maxScroll,
          Math.max(0, coinTop - Math.max(0, viewportHeight - coinHeight)),
        );
      }

      const startScroll = storeScrollYRef.current;
      const distance = targetScroll - startScroll;
      if (Math.abs(distance) < 1) {
        storeScrollYRef.current = targetScroll;
        setStoreScrollY(targetScroll);
        return;
      }

      const startTime = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTime) / STORE_SCROLL_TO_COIN_SECTION_DURATION_MS);
        const eased = 1 - (1 - t) ** 3;
        const next = startScroll + distance * eased;
        storeScrollYRef.current = next;
        setStoreScrollY(next);
        if (t < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, STORE_SCROLL_TO_COIN_SECTION_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [scrollToCoinSectionRequest]);

  useEffect(() => {
    const el = storeScrollRef.current;
    const contentEl = storeContentRef.current;
    if (!el || !contentEl) return;

    let isDown = false;
    let startY = 0;
    let startScrollY = 0;
    let velocityY = 0;
    let lastY = 0;
    let lastTime = 0;
    let rafId: number | undefined;

    const getMaxScroll = () => {
      const viewportHeight = el.clientHeight;
      // contentEl is absolute; offsetHeight tends to be more reliable than getBoundingClientRect()
      // when other layers are added/stacked.
      const contentHeight = contentEl.offsetHeight;
      return Math.max(0, contentHeight - viewportHeight);
    };

    const updateScroll = (newValue: number) => {
      const maxScroll = getMaxScroll();
      const clamped = Math.max(0, Math.min(newValue, maxScroll));
      storeScrollYRef.current = clamped;
      setStoreScrollY(clamped);
    };

    const momentumLoop = () => {
      if (!isDown && Math.abs(velocityY) > 0.1) {
        const maxScroll = getMaxScroll();
        const newScroll = Math.max(0, Math.min(storeScrollYRef.current - velocityY, maxScroll));
        updateScroll(newScroll);
        velocityY *= 0.94;
        rafId = requestAnimationFrame(momentumLoop);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      velocityY = 0;
      startY = e.pageY;
      startScrollY = storeScrollYRef.current;
      lastY = e.pageY;
      lastTime = Date.now();
      if (rafId) cancelAnimationFrame(rafId);
      window.addEventListener('mousemove', handleMouseMoveGlobal);
      window.addEventListener('mouseup', handleMouseUpGlobal);
    };

    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!isDown) return;
      const dy = e.pageY - startY;
      const now = Date.now();
      if (now - lastTime > 0) velocityY = velocityY * 0.2 + (e.pageY - lastY) * 0.8;
      const maxScroll = getMaxScroll();
      const newScroll = Math.max(0, Math.min(startScrollY - dy, maxScroll));
      updateScroll(newScroll);
      lastY = e.pageY;
      lastTime = now;
    };

    const handleMouseUpGlobal = () => {
      if (!isDown) return;
      isDown = false;
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      if (Math.abs(velocityY) > 1) {
        rafId = requestAnimationFrame(momentumLoop);
      }
    };

    // Touch support (mobile)
    const handleTouchStart = (e: TouchEvent) => {
      isDown = true;
      velocityY = 0;
      startY = e.touches[0].pageY;
      startScrollY = storeScrollYRef.current;
      lastY = e.touches[0].pageY;
      lastTime = Date.now();
      if (rafId) cancelAnimationFrame(rafId);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      // Stop browser from treating the drag as a page/gesture scroll.
      // Stop the browser from consuming this gesture (important with global touch-action: manipulation).
      if (e.cancelable) e.preventDefault();
      const dy = e.touches[0].pageY - startY;
      const now = Date.now();
      if (now - lastTime > 0) velocityY = velocityY * 0.2 + (e.touches[0].pageY - lastY) * 0.8;
      const maxScroll = getMaxScroll();
      const newScroll = Math.max(0, Math.min(startScrollY - dy, maxScroll));
      updateScroll(newScroll);
      lastY = e.touches[0].pageY;
      lastTime = now;
    };

    const handleTouchEnd = () => {
      if (!isDown) return;
      isDown = false;
      if (Math.abs(velocityY) > 1) {
        rafId = requestAnimationFrame(momentumLoop);
      }
    };

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="relative h-full w-full flex flex-col overflow-x-visible">
      {/* Brown chrome + stroke: full bleed to physical top (extends under notch). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0 z-0"
        style={{
          height: storeTopChromeBleedPx,
          backgroundColor: STORE_TOP_CHROME_BROWN,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 2,
            bottom: STORE_MASK_LINE_ABOVE_SCROLL_PX,
            backgroundColor: STORE_MASK_LINE_COLOR,
          }}
        />
      </div>

      {/* Header + store rows: inset below notch; moves with top bar. */}
      <div
        className="relative flex flex-col flex-1 min-h-0 z-10"
        style={{ paddingTop: safeTopInsetPx }}
      >
      <PageHeader
        money={money}
        walletRef={walletRef}
        walletIconRef={walletIconRef}
        walletFlashActive={walletFlashActive}
        collapsePlayerLevel
        hidePlayerLevel
        hideFps
        centerTitle="Store"
        boostAreaLayout="afterCenterTitle"
        onPauseClick={onSettingsClick}
        activeBoosts={activeBoosts}
        activeBoostAreaRef={activeBoostAreaRef}
        activeBoostMinWidthPx={ACTIVE_BOOST_INDICATOR_SIZE_PX}
        headerLeftWrapperRef={headerLeftWrapperRef}
        onBoostComplete={onBoostComplete}
        onBoostClick={onBoostClick}
      />

      {STORE_TOP_CHROME_BELOW_HEADER_PX > 0 ? (
        <div
          aria-hidden
          className="relative shrink-0 pointer-events-none"
          style={{ height: STORE_TOP_CHROME_BELOW_HEADER_PX }}
        />
      ) : null}

      {/* Store top-ui viewport (sprites + pattern clipped). */}
      <div className="flex-grow overflow-hidden overflow-x-visible min-h-0 relative">
        {/* Sprite viewport (clipped at the top mask boundary) */}
        <div
          ref={storeScrollRef}
          className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Pattern background (clipped) - scrolls with store drag */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: -220,
              bottom: -220,
              zIndex: 0,
              pointerEvents: 'none',
              backgroundImage: `url(${assetPath('/assets/ui/ui_pattern.png')})`,
              backgroundRepeat: 'repeat',
              // Smaller tiles than the source texture.
              backgroundSize: '120px 120px',
              backgroundPosition: 'top left',
              transform: `translateY(${-storeScrollY}px)`,
              transformOrigin: 'top center',
            }}
          />

          <div
            ref={storeContentRef}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: `translateX(-50%) translateY(${-storeScrollY}px)`,
              transformOrigin: 'top center',
              /* Fits coin rows at 440×1.03 (widest product row) and two free offers at 214×1.05 (+ gap). */
              width: 453,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              // Keep children from affecting layout above the pinned top ui.
              pointerEvents: 'auto',
              zIndex: 1,
              paddingBottom: STORE_SCROLL_CONTENT_PADDING_BOTTOM_PX,
            }}
          >
            {/* Two store free offers side by side (scaled 1.05×; layout width stays 214 each) */}
            <div className="flex flex-row items-start justify-center gap-2 w-full mt-[10px] mb-2">
              <StoreFreeOffer
                slotIndex={0}
                offerId={dailyAllowanceSlot0 ? STORE_DAILY_ALLOWANCE_OFFER_ID : storeFreeOfferSlots[0]}
                dailyAllowance={dailyAllowanceSlot0}
                hideAllowanceIcon={dailyAllowanceHideIcon}
                onFreeClick={(buttonRect, particleOriginRect) =>
                  onFreeOfferClick?.(
                    dailyAllowanceSlot0 ? STORE_DAILY_ALLOWANCE_OFFER_ID : storeFreeOfferSlots[0],
                    0,
                    buttonRect,
                    particleOriginRect,
                  )
                }
                cooldownEndMs={storeSlotCooldownEnds[0]}
                onSlotCooldownEnded={onStoreSlotCooldownEnded}
              />
              <StoreFreeOffer
                slotIndex={1}
                offerId={storeFreeOfferSlots[1]}
                onFreeClick={(buttonRect) => onFreeOfferClick?.(storeFreeOfferSlots[1], 1, buttonRect)}
                cooldownEndMs={storeSlotCooldownEnds[1]}
                onSlotCooldownEnded={onStoreSlotCooldownEnded}
              />
            </div>

            {/* Purple divider between mediums and large */}
            <img
              src={assetPath('/assets/ui/popup_divider_purple.png')}
              alt=""
              className="w-[300px] max-w-none h-auto mt-1 mb-1"
            />

            {/* Store bundles (`ui_store_large`) — overlay layout matches coin booster rows. */}
            <div className="flex flex-col items-center gap-0 w-full mt-0">
              {visibleBundleOffers.map((config) => (
                <StoreBundleOffer
                  key={config.id}
                  config={config}
                  onPurchase={onStoreCoinPurchase}
                  owned={
                    (config.id === STORE_IAP_OFFER_STARTER_PACK_ID && starterPackPurchased) ||
                    (config.id === STORE_IAP_OFFER_FIELD_PACK_ID && fieldPackPurchased)
                  }
                  limitedOfferCountdownEnabled={
                    config.id === STORE_IAP_OFFER_STARTER_PACK_ID
                      ? starterPackUnlocked && !starterPackPurchased
                      : config.id === STORE_IAP_OFFER_FIELD_PACK_ID
                        ? fieldPackUnlocked && !fieldPackPurchased
                        : true
                  }
                  limitedOfferCountdownRefreshKey={
                    config.id === STORE_IAP_OFFER_STARTER_PACK_ID
                      ? starterPackCountdownRefreshKey
                      : config.id === STORE_IAP_OFFER_FIELD_PACK_ID
                        ? fieldPackCountdownRefreshKey
                        : 0
                  }
                />
              ))}
            </div>

            {/* Divider between large and small */}
            <img
              src={assetPath('/assets/ui/popup_divider.png')}
              alt=""
              className="w-[300px] max-w-none h-auto mt-1 mb-1"
            />

            {/* Coin IAP rows — filtered by remote-config IAP kill switches. */}
            <div ref={storeCoinSectionRef} className="flex flex-col items-center gap-0 w-full mt-0">
              {visibleCoinOffers.map((config) => (
                <StoreCoinOffer
                  key={config.id}
                  config={config}
                  onPurchase={onStoreCoinPurchase}
                  owned={config.id === STORE_IAP_OFFER_REMOVE_ADS_ID && removeAdsOwned}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
