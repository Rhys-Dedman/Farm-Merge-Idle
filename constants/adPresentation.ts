/** Ad break intro dim backdrop (~85% opaque; ~2× less transparent than the old 70%). */
export const POPUP_BACKDROP_RGBA = 'rgba(0, 0, 0, 0.85)';

/** Black fade before a rewarded fake ad appears. */
export const AD_REWARDED_FADE_IN_MS = 500;

/** Fade black out after rewarded loading plate closes. */
export const AD_REWARDED_FADE_OUT_MS = 500;

/** Ad break intro: popup-style dim backdrop 0 → full. */
export const AD_BREAK_INTRO_BACKDROP_FADE_MS = 500;

/** Ad break intro: icon bounce 0.75 → 1.2 → 0.9 → 1 (starts invisible). */
export const AD_BREAK_INTRO_ICON_BOUNCE_MS = 1500;

/** Ad break intro: full-black layer fades in above the icon. */
export const AD_BREAK_INTRO_BLACK_FADE_MS = 1000;

export const AD_BREAK_INTRO_TOTAL_MS =
  AD_BREAK_INTRO_ICON_BOUNCE_MS + AD_BREAK_INTRO_BLACK_FADE_MS;

/** Fade black out after the ad break fake ad closes. */
export const AD_BREAK_OUTRO_FADE_MS = 1000;

/** Must match screen carousel `duration-700` in App.tsx (store/collection → garden). */
export const SCREEN_NAV_TRANSITION_MS = 700;

/** When to start ad-break after store/collection → garden (halfway through slide). */
export const SCREEN_NAV_AD_BREAK_DELAY_MS = SCREEN_NAV_TRANSITION_MS / 2;

/**
 * After claiming a Special Delivery upgrade/boost, block interstitial ads long enough
 * for garden return FX (nav slide + boost particle / upgrade green blink).
 */
export const SPECIAL_DELIVERY_REWARD_AD_GRACE_MS = 15000;

/** Leaf burst particle count when the ad-break icon appears. */
export const AD_BREAK_ICON_LEAF_BURST_COUNT = 10;

/** Burst radius multiplier vs icon half-size (2 = twice the icon radius). */
export const AD_BREAK_ICON_LEAF_BURST_RADIUS_MULTIPLIER = 2;
/** Tablet ad-break leaf sprites are 30% smaller than phone (burst radius unchanged). */
export const AD_BREAK_ICON_LEAF_PARTICLE_SIZE_SCALE_TABLET = 0.7;

/** Ad-break intro icon size on phones (matches current look). */
export const AD_BREAK_ICON_SIZE_PHONE_PX = 250;
/** Tablet: floor / ceiling and fraction of viewport width. */
export const AD_BREAK_ICON_SIZE_TABLET_MIN_PX = 360;
export const AD_BREAK_ICON_SIZE_TABLET_MAX_PX = 480;
export const AD_BREAK_ICON_TABLET_VIEWPORT_FRAC = 0.36;
/** Match App.tsx `mobileBreakpoint` — below this, use phone icon size. */
export const AD_BREAK_ICON_PHONE_BREAKPOINT_PX = 500;

export function getAdBreakIconSizePx(viewportWidth: number): number {
  if (viewportWidth < AD_BREAK_ICON_PHONE_BREAKPOINT_PX) {
    return AD_BREAK_ICON_SIZE_PHONE_PX;
  }
  return Math.min(
    Math.max(viewportWidth * AD_BREAK_ICON_TABLET_VIEWPORT_FRAC, AD_BREAK_ICON_SIZE_TABLET_MIN_PX),
    AD_BREAK_ICON_SIZE_TABLET_MAX_PX,
  );
}

/** Ad-break loading plate: circular progress duration before escape button. */
export const AD_BREAK_LOADING_PROGRESS_MS = 10_000;

/** Ad-break loading plate: fade between loading UI and Return To Game. */
export const AD_BREAK_LOADING_UI_FADE_MS = 400;

export type FakeAdVariant = 'rewarded' | 'adBreak';
