import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { assetPath } from '../utils/assetPath';
import { getGardenPreloadAssetPaths, getCollectionBonusIconPreloadPaths, getCollectionGardenSectionIconPreloadPaths, getGardenPickerIconPreloadPaths } from '../utils/gardenAssets';
import { preloadSfxAssets, SFX_PRELOAD_STEP_COUNT, applySavedAudioSettingsEarly } from '../utils/sfx';

applySavedAudioSettingsEarly();

interface LoadingScreenProps {
  onLoadComplete: () => void;
  /** Returning player: skip splash, black screen while preloading then fade out. */
  variant?: 'splash' | 'quick';
  /** Called when quick preload finishes, before black fades (hydrate game under overlay). */
  onQuickResumeHydrate?: () => void;
}

/** Base padding below safe-area for splash chrome (logo top, progress bottom). */
const SPLASH_LOGO_PAD_PX = 28;
const SPLASH_PROGRESS_PAD_PX = 72;

/** Original splash progress pill (50% of 448px design width × 38px tall). */
const SPLASH_PROGRESS_DESIGN_WIDTH = 224;
const SPLASH_PROGRESS_DESIGN_HEIGHT = 38;
const SPLASH_PROGRESS_DESIGN_BORDER = 3;
const SPLASH_PROGRESS_DESIGN_FONT_PX = 14;

const ASSETS_TO_PRELOAD = [
  ...getGardenPreloadAssetPaths(),
  ...getCollectionBonusIconPreloadPaths(),
  ...getCollectionGardenSectionIconPreloadPaths(),
  ...getGardenPickerIconPreloadPaths(),
  // Icons
  '/assets/icons/floating_buttons/icon_tasks.png',
  '/assets/icons/generic_buttons/icon_barn.png',
  '/assets/icons/generic_buttons/icon_farm.png',
  '/assets/icons/generic_buttons/icon_market.png',
  '/assets/icons/upgrades/icon_harvest.png',
  '/assets/icons/generic_buttons/icon_watchad.png',
  '/assets/icons/generic_buttons/icon_watchad_large.png',
  '/assets/ui/generic/ui_adbreak.png',
  '/assets/icons/coins/icon_coin_watchad.png',
  '/assets/ui/ui_logo.png',
  '/assets/icons/generic_buttons/icon_lock.png',
  '/assets/icons/upgrades/icon_seedstorm.png',
  '/assets/icons/upgrades/icon_seedproduction.png',
  '/assets/icons/upgrades/icon_seedquality.png',
  '/assets/icons/upgrades/icon_seedstorage.png',
  '/assets/icons/upgrades/icon_seedsurplus.png',
  '/assets/icons/upgrades/icon_luckyseed.png',
  '/assets/icons/upgrades/icon_cropmerge.png',
  '/assets/icons/upgrades/icon_plotexpansion.png',
  '/assets/icons/upgrades/icon_mergeharvest.png',
  '/assets/icons/upgrades/icon_fetilesoil.png',
  '/assets/icons/upgrades/icon_luckymerge.png',
  '/assets/icons/upgrades/icon_harvestspeed.png',
  '/assets/icons/upgrades/icon_cropvalue.png',
  '/assets/icons/upgrades/icon_harvestboost.png',
  '/assets/icons/upgrades/icon_cropsynergy.png',
  '/assets/icons/upgrades/icon_luckyharvest.png',
  '/assets/icons/upgrades/icon_harvestspeed.png',
  '/assets/icons/upgrades/icon_customerspeed.png',
  '/assets/icons/upgrades/icon_marketvalue.png',
  '/assets/icons/upgrades/icon_surplussales.png',
  '/assets/icons/upgrades/icon_happycustomer.png',
  '/assets/icons/upgrades/icon_premiumorders.png',
  // Backgrounds
  '/assets/collection/background_collection.png',
  '/assets/background/background_loading.png',
  // Barn
  '/assets/collection/collection_shelf.png',
  '/assets/collection/collection_shelf_upgrade.png',
  '/assets/collection/collection_roof.png',
  '/assets/collection/collection_tools.png',
  '/assets/ui/generic/ui_collection_garden.png',
  '/assets/ui/generic/ui_collection_icon_locked.png',
  '/assets/ui/generic/ui_gardens_unlocked.png',
  '/assets/ui/generic/ui_gardens_selected.png',
  '/assets/ui/generic/ui_gardens_owned.png',
  '/assets/ui/generic/ui_gardens_pots.png',
  '/assets/ui/generic/ui_gardens_locked.png',
  // Popups
  '/assets/ui/popup_header.png',
  '/assets/ui/popup_header_yellow.png',
  '/assets/ui/popup_header_blue.png',
  '/assets/ui/popup_divider.png',
  '/assets/ui/popup_divider_yellow.png',
  '/assets/ui/popup_divider_blue.png',
  // VFX (all leaf variants for popups + bursts)
  '/assets/vfx/particle_leaf_green_1.png',
  '/assets/vfx/particle_leaf_green_2.png',
  '/assets/vfx/particle_leaf_yellow_1.png',
  '/assets/vfx/particle_leaf_yellow_2.png',
  '/assets/vfx/particle_leaf_blue_1.png',
  '/assets/vfx/particle_leaf_blue_2.png',
  '/assets/vfx/particle_leaf_background_shadow.png',
  '/assets/vfx/particle_leaf_red_1.png',
  '/assets/vfx/particle_leaf_red_2.png',
  '/assets/vfx/particle_leaf_purple_1.png',
  '/assets/vfx/particle_leaf_purple_2.png',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoadComplete,
  variant = 'splash',
  onQuickResumeHydrate,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [phase, setPhase] = useState<'boot' | 'fadeIn' | 'loading' | 'ready' | 'fadeOut' | 'quickFade' | 'done'>(() =>
    variant === 'quick' ? 'loading' : 'boot'
  );
  const [blackOpacity, setBlackOpacity] = useState(1);
  const readViewportSize = () => {
    const vv = window.visualViewport;
    if (vv) {
      return {
        width: Math.min(vv.width, window.innerWidth),
        height: vv.height,
      };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  };
  const [viewportSize, setViewportSize] = useState(readViewportSize);

  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const progressRafRef = useRef(0);
  const allDoneRef = useRef(false);

  // Smooth progress RAF: displayed value chases targetProgressRef
  useEffect(() => {
    if (variant === 'quick') return;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const target = targetProgressRef.current;
      const cur = displayProgressRef.current;

      if (allDoneRef.current) {
        displayProgressRef.current = 99;
        setDisplayProgress(99);
        return;
      }

      if (cur < target) {
        const gap = target - cur;
        const speed = Math.max(8, gap * 3);
        const next = Math.min(target, cur + speed * dt);
        displayProgressRef.current = next;
        setDisplayProgress(Math.round(next));
      }
      progressRafRef.current = requestAnimationFrame(tick);
    };
    progressRafRef.current = requestAnimationFrame(tick);
    return () => { if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current); };
  }, [variant]);

  const splashUiMetrics = useMemo(() => {
    const w = viewportSize.width;
    // Scale with viewport width so tablets (e.g. iPad Pro) don't look tiny vs iPad Mini.
    // Not DPR — both were hitting the same px caps (340 / 240) on any tablet width ≥ ~650.
    const logoMaxWidth = Math.min(Math.max(w * 0.44, 260), 520);
    const progressWidth = Math.min(Math.max(w * 0.38, 200), 400);
    const progressScale = progressWidth / SPLASH_PROGRESS_DESIGN_WIDTH;
    return {
      logoMaxWidth,
      progressWidth,
      progressHeight: SPLASH_PROGRESS_DESIGN_HEIGHT * progressScale,
      progressFontPx: SPLASH_PROGRESS_DESIGN_FONT_PX * progressScale,
      progressBorderPx: SPLASH_PROGRESS_DESIGN_BORDER * progressScale,
      progressShadowY: 4 * progressScale,
      progressShadowBlur: 12 * progressScale,
    };
  }, [viewportSize]);

  // Listen for viewport resize (visualViewport on mobile / device emulation)
  useEffect(() => {
    const handleResize = () => setViewportSize(readViewportSize());
    handleResize();
    window.addEventListener('resize', handleResize);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (vv) vv.removeEventListener('resize', handleResize);
    };
  }, []);

  const preloadCriticalSplashAssets = useCallback(async () => {
    const critical = [
      '/assets/background/background_loading.png',
      '/assets/ui/ui_logo.png',
    ];
    const loadImage = (src: string): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = assetPath(src);
      });
    await Promise.all(critical.map(loadImage));
  }, []);

  const preloadAssets = useCallback(async () => {
    const total = ASSETS_TO_PRELOAD.length + SFX_PRELOAD_STEP_COUNT;
    let loaded = 0;

    const bump = () => {
      loaded++;
      targetProgressRef.current = Math.min(99, (loaded / total) * 100);
    };

    const loadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { bump(); resolve(); };
        img.onerror = () => { bump(); resolve(); };
        img.src = assetPath(src);
      });
    };

    await Promise.all([
      Promise.all(ASSETS_TO_PRELOAD.map(loadImage)),
      preloadSfxAssets(bump),
    ]);
    if (variant === 'quick') {
      setPhase('quickFade');
    } else {
      allDoneRef.current = true;
      if (progressRafRef.current) { cancelAnimationFrame(progressRafRef.current); progressRafRef.current = 0; }
      setDisplayProgress(99);
      setPhase('ready');
    }
  }, [variant]);

  useEffect(() => {
    if (variant === 'quick') return;
    if (phase === 'boot') {
      void preloadCriticalSplashAssets().then(() => {
        setPhase('fadeIn');
      });
      return;
    }
    if (phase === 'fadeIn') {
      const fadeInDuration = 500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newOpacity = Math.max(0, 1 - elapsed / fadeInDuration);
        setBlackOpacity(newOpacity);
        
        if (elapsed < fadeInDuration) {
          requestAnimationFrame(animate);
        } else {
          setBlackOpacity(0);
          setPhase('loading');
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [phase, variant, preloadCriticalSplashAssets]);

  const quickFadeStartedRef = useRef(false);
  // Quick resume: fade black out then hand off to App (dismiss loading + fade game in)
  useEffect(() => {
    if (phase !== 'quickFade') return;
    if (quickFadeStartedRef.current) return;
    quickFadeStartedRef.current = true;
    setBlackOpacity(1);
    onQuickResumeHydrate?.();
    const fadeMs = 340;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newOpacity = Math.max(0, 1 - elapsed / fadeMs);
      setBlackOpacity(newOpacity);
      if (elapsed < fadeMs) {
        requestAnimationFrame(animate);
      } else {
        setBlackOpacity(0);
        setPhase('done');
        onLoadComplete();
      }
    };
    requestAnimationFrame(animate);
  }, [phase, onLoadComplete, onQuickResumeHydrate]);

  useEffect(() => {
    if (phase === 'loading') {
      preloadAssets();
    }
  }, [phase, preloadAssets]);

  useEffect(() => {
    if (phase === 'fadeOut') {
      const fadeOutDuration = 500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newOpacity = Math.min(1, elapsed / fadeOutDuration);
        setBlackOpacity(newOpacity);
        
        if (elapsed < fadeOutDuration) {
          requestAnimationFrame(animate);
        } else {
          setBlackOpacity(1);
          setPhase('done');
          onLoadComplete();
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [phase, onLoadComplete]);

  const handleTap = () => {
    if (variant === 'quick') return;
    if (phase === 'ready') {
      setPhase('fadeOut');
    }
  };

  if (phase === 'done') return null;

  if (variant === 'quick') {
    return (
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#050608]"
        style={{ cursor: 'default', pointerEvents: 'auto' }}
      >
        <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: blackOpacity }} />
      </div>
    );
  }

  const splashBackgroundUrl = assetPath('/assets/background/background_loading.png');

  return (
    <div 
      className="fixed inset-0 z-[1000] overflow-hidden"
      onClick={handleTap}
      style={{ cursor: phase === 'ready' ? 'pointer' : 'default', backgroundColor: '#2a4a28' }}
    >
      {/* Full-viewport background — cover (zoom/crop), no letterbox bars */}
      <div
        className="absolute inset-0 pointer-events-none bg-no-repeat"
        style={{
          backgroundImage: `url(${splashBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
        }}
        aria-hidden
      />

      {/* Logo — pinned to top of viewport (safe-area + padding) */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{
          top: 0,
          paddingTop: `max(${SPLASH_LOGO_PAD_PX}px, env(safe-area-inset-top, 0px))`,
        }}
      >
        <img
          src={assetPath('/assets/ui/ui_logo.png')}
          alt="Logo"
          className="object-contain select-none"
          draggable={false}
          style={{
            width: splashUiMetrics.logoMaxWidth,
            maxWidth: '78vw',
            height: 'auto',
          }}
        />
      </div>

      {/* Progress / tap — pinned to bottom of viewport (safe-area + padding) */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{
          bottom: 0,
          paddingBottom: `max(${SPLASH_PROGRESS_PAD_PX}px, env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <div
          className="relative rounded-full overflow-hidden shrink-0"
          style={{
            width: splashUiMetrics.progressWidth,
            height: splashUiMetrics.progressHeight,
            border: `${splashUiMetrics.progressBorderPx}px solid rgba(14, 63, 53, 0.5)`,
            backgroundColor: 'rgba(0,0,0,0.4)',
            boxShadow: `0 ${splashUiMetrics.progressShadowY}px ${splashUiMetrics.progressShadowBlur}px rgba(0,0,0,0.25)`,
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              // Stay full after loading — `displayProgress` stops at 99; reverting on fadeOut caused a visible shrink on tap.
              width: `${phase === 'loading' ? displayProgress : 100}%`,
              background: 'linear-gradient(to bottom, #fcea3f, #f7911d)',
              boxShadow: `inset 0 0 0 ${splashUiMetrics.progressBorderPx}px rgba(239, 71, 35, 0.5)`,
              transition: phase === 'ready' ? 'width 200ms ease-out' : 'none',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {phase === 'loading' && (
              <p
                className="font-bold tracking-wide"
                style={{
                  color: '#ffffff',
                  fontSize: `${splashUiMetrics.progressFontPx}px`,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                LOADING {displayProgress}%
              </p>
            )}
            {phase === 'ready' && (
              <p
                className="font-bold tracking-wide animate-pulse"
                style={{
                  color: '#ce6232',
                  fontSize: `${splashUiMetrics.progressFontPx}px`,
                }}
              >
                TAP TO CONTINUE
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Full-viewport fade (tap-to-continue → game handoff) */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ opacity: blackOpacity }}
        aria-hidden
      />
    </div>
  );
};
