
import React, { useEffect, useRef, useState } from 'react';
import { PageHeader } from './PageHeader';
import { assetPath } from '../utils/assetPath';

interface StoreScreenProps {
  money: number;
  walletFlashActive?: boolean;
  onAddMoney?: (amount: number) => void;
  onSettingsClick?: () => void;
}

export const StoreScreen: React.FC<StoreScreenProps> = ({ money, walletFlashActive, onSettingsClick }) => {
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
    <div className="h-full w-full flex flex-col overflow-x-visible">
      <PageHeader
        money={money}
        walletFlashActive={walletFlashActive}
        collapsePlayerLevel
        hidePlayerLevel
        hideFps
        centerTitle="Store"
        onPauseClick={onSettingsClick}
      />

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

          {/* 4px divider at the clipping boundary */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 2,
              backgroundColor: '#422e29',
              zIndex: 2,
              pointerEvents: 'none',
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
              width: 440,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              // Keep children from affecting layout above the pinned top ui.
              pointerEvents: 'auto',
              zIndex: 1,
            }}
          >
            {/* Large at top */}
            <img
              src={assetPath('/assets/topui/ui_store_large.png')}
              alt=""
              className="w-[440px] max-w-none h-auto mt-[10px]"
            />

            {/* Yellow divider between large and small */}
            <img
              src={assetPath('/assets/popups/popup_divider_yellow.png')}
              alt=""
              className="w-[300px] max-w-none h-auto mt-1 mb-1"
            />

            {/* 5x small items */}
            <div className="flex flex-col items-center gap-0 w-full mt-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <img
                  key={i}
                  src={assetPath('/assets/topui/ui_store_small.png')}
                  alt=""
                  className="w-[440px] max-w-none h-auto"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
