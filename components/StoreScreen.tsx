import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PageHeader } from './PageHeader';
import { assetPath } from '../utils/assetPath';
import type { ActiveBoostData } from './ActiveBoostIndicator';
import { ACTIVE_BOOST_INDICATOR_SIZE_PX } from './ActiveBoostIndicator';
import { getOfferById, STORE_BUNDLE_OFFERS, STORE_COIN_OFFERS, STORE_FREE_OFFER_HEADER_ICON_PX } from '../offers';
import { StoreBundleOffer } from './StoreBundleOffer';
import { StoreCoinOffer } from './StoreCoinOffer';

/** Matches upgrade panel MAX / disabled purchase button (UpgradeList). */
const UPGRADE_MAX_BUTTON_BG = '#e3c28c';
const UPGRADE_MAX_BUTTON_DEPTH = '#c7a36e';
const UPGRADE_MAX_BUTTON_FONT = '#a68e64';

const FREE_OFFER_TITLE_FONT_MAX_PX = 13;
const FREE_OFFER_TITLE_FONT_MIN_PX = 7;

/** Visual scale for `ui_store_medium` free-offer cards (layout width fixed below). */
const STORE_FREE_OFFER_SCALE = 1.05;
const STORE_FREE_OFFER_LAYOUT_W_PX = 214;

/** Match `PageHeader` total block height (pt-4 + bar + pb-2) so brown can sit flush under the bar art. */
const STORE_PAGE_HEADER_HEIGHT_PX = 68;
/** Brown band below the header (above scroll); 0 = scroll sits flush under header bar. */
const STORE_TOP_CHROME_BELOW_HEADER_PX = 10;
/** Horizontal rule inset above the scroll clip (gap between line bottom and scroll top). */
const STORE_MASK_LINE_ABOVE_SCROLL_PX = 3;
const STORE_TOP_CHROME_BROWN = '#432f2a';
const STORE_MASK_LINE_COLOR = '#775041';

/** Store free offer — tiny version of rewarded ad. Rotates to a new pool offer after cooldown (with bounce). */
const StoreFreeOffer: React.FC<{
  slotIndex: number;
  offerId: string;
  onFreeClick?: () => void;
  cooldownEndMs?: number;
  onSlotCooldownEnded?: (slotIndex: number) => void;
}> = ({ slotIndex, offerId, onFreeClick, cooldownEndMs = 0, onSlotCooldownEnded }) => {
  const [pressed, setPressed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [bounceActive, setBounceActive] = useState(false);
  const prevOnCooldownRef = useRef(false);
  const cooldownEndHandledRef = useRef(false);
  const freeOfferTitleBoxRef = useRef<HTMLDivElement>(null);
  const freeOfferTitleTextRef = useRef<HTMLSpanElement>(null);
  const [freeOfferTitleFontPx, setFreeOfferTitleFontPx] = useState(FREE_OFFER_TITLE_FONT_MAX_PX);
  const offer = getOfferById(offerId);

  const isOnCooldown = cooldownEndMs > now;
  const remainingMs = Math.max(0, cooldownEndMs - now);
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
  }, [isOnCooldown, cooldownEndMs]);

  useEffect(() => {
    if (isOnCooldown) cooldownEndHandledRef.current = false;
  }, [isOnCooldown]);

  // When slot cooldown ends: bounce, swap offer mid-animation, then FREE again
  useEffect(() => {
    const justEnded = prevOnCooldownRef.current && !isOnCooldown && cooldownEndMs > 0;
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
  }, [isOnCooldown, cooldownEndMs, slotIndex, onSlotCooldownEnded]);

  // Title: never above 13px; shrink only until text fits in the title box
  useLayoutEffect(() => {
    const box = freeOfferTitleBoxRef.current;
    const text = freeOfferTitleTextRef.current;
    if (!offer || !box || !text) return;

    const cs = getComputedStyle(box);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const availW = Math.max(1, box.clientWidth - padX);
    const availH = Math.max(1, box.clientHeight - padY);

    let px = FREE_OFFER_TITLE_FONT_MAX_PX;
    text.style.fontSize = `${px}px`;
    while (px > FREE_OFFER_TITLE_FONT_MIN_PX && (text.scrollWidth > availW || text.scrollHeight > availH)) {
      px -= 0.5;
      text.style.fontSize = `${px}px`;
    }
    setFreeOfferTitleFontPx(px);
  }, [offerId, offer?.title]);

  const rowBandStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 28,
    marginTop: 9,
  };
  const yMid: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)' };

  if (!offer) return null;

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
            src={assetPath('/assets/topui/ui_store_medium.png')}
            alt=""
            className="w-full h-auto block pointer-events-none select-none"
          />
          <div className="absolute inset-0 flex flex-col pointer-events-none select-none">
            {/* Large offer icon — top center */}
            <div className="flex justify-center shrink-0 pt-6 pb-1">
              {/* Reserve 108px height like the original icon so title/duration band stays aligned to the art */}
              <div className="flex items-center justify-center shrink-0" style={{ height: 108, width: '100%' }}>
                <img
                  src={assetPath(offer.headerIcon)}
                  alt=""
                  className="object-contain"
                  style={{
                    width: STORE_FREE_OFFER_HEADER_ICON_PX,
                    height: STORE_FREE_OFFER_HEADER_ICON_PX,
                    transform: 'translateY(2px)',
                  }}
                />
              </div>
            </div>

            {/* Title box (centered text); duration fixed at left:152 (may overlap) */}
            <div className="flex-1 flex items-start justify-center min-h-0 w-full">
              <div style={rowBandStyle}>
                <div
                  ref={freeOfferTitleBoxRef}
                  className="flex min-w-0 items-center justify-center overflow-hidden rounded-[4px] px-1"
                  style={{
                    position: 'absolute',
                    left: 30,
                    top: 0,
                    width: 110,
                    height: 28,
                    backgroundColor: 'transparent',
                  }}
                >
                  <span
                    ref={freeOfferTitleTextRef}
                    className="min-w-0 max-w-full font-black leading-none whitespace-nowrap text-center"
                    style={{ color: '#6c5851', fontSize: `${freeOfferTitleFontPx}px` }}
                  >
                    {offer.title}
                  </span>
                </div>
                <span
                  className="font-black leading-none whitespace-nowrap"
                  style={{ ...yMid, left: 152, color: '#d3b07b', fontSize: '13px' }}
                >
                  {durationLabel}
                </span>
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
                  if (!isOnCooldown) onFreeClick?.();
                }}
                className="flex items-center justify-center px-[10px] rounded-[9px] transition-all border outline outline-1 pointer-events-auto"
                style={{
                  height: 36,
                  backgroundColor: isOnCooldown ? UPGRADE_MAX_BUTTON_BG : pressed ? '#f0c840' : '#ffd856',
                  borderColor: isOnCooldown ? UPGRADE_MAX_BUTTON_DEPTH : '#f59d42',
                  borderBottomWidth: pressed && !isOnCooldown ? 0 : 4,
                  marginBottom: pressed && !isOnCooldown ? 4 : 0,
                  outlineColor: isOnCooldown ? UPGRADE_MAX_BUTTON_DEPTH : '#f59d42',
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
                ) : (
                  <>
                    <img
                      src={assetPath('/assets/icons/icon_watchad.png')}
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
  onFreeOfferClick?: (offerId: string, slotIndex: number) => void;
  activeBoosts?: ActiveBoostData[];
  activeBoostAreaRef?: React.RefObject<HTMLDivElement | null>;
  headerLeftWrapperRef?: React.RefObject<HTMLDivElement | null>;
  onBoostComplete?: (id: string, rect?: DOMRect) => void;
  onBoostClick?: (boost: ActiveBoostData) => void;
  walletRef?: React.RefObject<HTMLButtonElement | null>;
  /** Current offer id per slot (duration-only pool). */
  storeFreeOfferSlots?: [string, string];
  /** Per-slot 15m cooldown end (ms); 0 = ready for FREE. */
  storeSlotCooldownEnds?: [number, number];
  /** After cooldown + bounce: pick new offer for this slot. */
  onStoreSlotCooldownEnded?: (slotIndex: number) => void;
  /** Real-money coin pack row (IAP placeholder). */
  onStoreCoinPurchase?: (offerId: string) => void;
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
  storeFreeOfferSlots = ['double_harvest', 'rapid_seeds'],
  storeSlotCooldownEnds = [0, 0],
  onStoreSlotCooldownEnded,
  onStoreCoinPurchase,
}) => {
  // Store scroll: reuse Shed/Barn-style momentum drag, but move the store top-ui list with transforms.
  // This avoids relying on native scroll (which isn't responding correctly on mobile in this screen).
  const storeScrollRef = useRef<HTMLDivElement | null>(null);
  const storeContentRef = useRef<HTMLDivElement | null>(null);

  const [storeScrollY, setStoreScrollY] = useState(0);
  const storeScrollYRef = useRef(0);
  storeScrollYRef.current = storeScrollY;

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
      {/* Brown to top of store column, behind PageHeader (same color as band below). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0 z-0"
        style={{
          height: STORE_PAGE_HEADER_HEIGHT_PX,
          backgroundColor: STORE_TOP_CHROME_BROWN,
        }}
      />

      <PageHeader
        money={money}
        walletRef={walletRef}
        walletFlashActive={walletFlashActive}
        collapsePlayerLevel
        hidePlayerLevel
        hideFps
        centerTitle="Store"
        onPauseClick={onSettingsClick}
        activeBoosts={activeBoosts}
        activeBoostAreaRef={activeBoostAreaRef}
        activeBoostMinWidthPx={ACTIVE_BOOST_INDICATOR_SIZE_PX}
        headerLeftWrapperRef={headerLeftWrapperRef}
        onBoostComplete={onBoostComplete}
        onBoostClick={onBoostClick}
      />

      {/* Brown below header (optional height); line lives here when height > 0. */}
      {STORE_TOP_CHROME_BELOW_HEADER_PX > 0 ? (
        <div
          aria-hidden
          className="relative z-0 w-full shrink-0 pointer-events-none"
          style={{
            height: STORE_TOP_CHROME_BELOW_HEADER_PX,
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
              zIndex: 2,
            }}
          />
        </div>
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
              backgroundImage: `url(${assetPath('/assets/topui/ui_pattern.png')})`,
              backgroundRepeat: 'repeat',
              // Smaller tiles than the source texture.
              backgroundSize: '120px 120px',
              backgroundPosition: 'top left',
              transform: `translateY(${-storeScrollY}px)`,
              transformOrigin: 'top center',
            }}
          />

          {STORE_TOP_CHROME_BELOW_HEADER_PX === 0 && (
            <div
              aria-hidden
              className="pointer-events-none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: STORE_MASK_LINE_ABOVE_SCROLL_PX + 2,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2,
                  backgroundColor: STORE_MASK_LINE_COLOR,
                }}
              />
            </div>
          )}

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
            }}
          >
            {/* Two store free offers side by side (scaled 1.05×; layout width stays 214 each) */}
            <div className="flex flex-row items-start justify-center gap-2 w-full mt-[10px] mb-2">
              <StoreFreeOffer
                slotIndex={0}
                offerId={storeFreeOfferSlots[0]}
                onFreeClick={() => onFreeOfferClick?.(storeFreeOfferSlots[0], 0)}
                cooldownEndMs={storeSlotCooldownEnds[0]}
                onSlotCooldownEnded={onStoreSlotCooldownEnded}
              />
              <StoreFreeOffer
                slotIndex={1}
                offerId={storeFreeOfferSlots[1]}
                onFreeClick={() => onFreeOfferClick?.(storeFreeOfferSlots[1], 1)}
                cooldownEndMs={storeSlotCooldownEnds[1]}
                onSlotCooldownEnded={onStoreSlotCooldownEnded}
              />
            </div>

            {/* Blue divider between mediums and large */}
            <img
              src={assetPath('/assets/popups/popup_divider_blue.png')}
              alt=""
              className="w-[300px] max-w-none h-auto mt-1 mb-1"
            />

            {/* Store bundles (`ui_store_large`) — overlay layout matches coin booster rows. */}
            <div className="flex flex-col items-center gap-0 w-full mt-0">
              {STORE_BUNDLE_OFFERS.map((config) => (
                <StoreBundleOffer key={config.id} config={config} onPurchase={onStoreCoinPurchase} />
              ))}
            </div>

            {/* Divider between large and small */}
            <img
              src={assetPath('/assets/popups/popup_divider.png')}
              alt=""
              className="w-[300px] max-w-none h-auto mt-1 mb-1"
            />

            {/* Coin IAP rows — order = `STORE_COIN_OFFERS` in offers.ts (shuffle freely). */}
            <div className="flex flex-col items-center gap-0 w-full mt-0">
              {STORE_COIN_OFFERS.map((config) => (
                <StoreCoinOffer key={config.id} config={config} onPurchase={onStoreCoinPurchase} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
