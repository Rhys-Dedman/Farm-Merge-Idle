/**
 * Special Deliveries panel + door layout in source art pixels.
 * Panel displays at {@link COLLECTION_SPECIAL_DELIVERY_PANEL_WIDTH_PX} × scale;
 * door overlays use % of the panel box so they stay locked to the same scale.
 */

export const SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX = 1100;
export const SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX = 1300;
/** Full door texture size (`specialdelivery_door_*.png`); visible door is inset with transparency. */
export const SPECIAL_DELIVERY_DOOR_ART_SIZE_PX = 512;

/**
 * Door cell centers in panel art space (row-major, top-left → bottom-right).
 * Nudges are in screen px at panel scale 1.5 (art ≈ screen × 1100/480).
 */
export const SPECIAL_DELIVERY_DOOR_CELL_CENTERS_ART_PX: ReadonlyArray<readonly [number, number]> = [
  [301, 602],
  [548, 602],
  [796, 602],
  [301, 827],
  [548, 827],
  [796, 827],
  [301, 1052],
  [548, 1052],
  [796, 1052],
];

/** Tap / hole hitbox size in panel art px (smaller than the door sprite). Tune with hitbox overlay. */
export const SPECIAL_DELIVERY_DOOR_HIT_WIDTH_ART_PX = 216;
export const SPECIAL_DELIVERY_DOOR_HIT_HEIGHT_ART_PX = 193;

/** Closed sprite: scaleX 1 → 0.9 (open), or 0.8 → 1 (close). */
export const SPECIAL_DELIVERY_DOOR_CLOSED_SQUASH_MS = 50;
/** Opening mid-frame on open: scaleX 1 → 0.8. */
export const SPECIAL_DELIVERY_DOOR_OPENING_HOLD_MS = 25;
/** Opening mid-frame on close: scaleX 0.5 → 1. */
export const SPECIAL_DELIVERY_DOOR_CLOSING_MID_MS = 50;
/** Opened sprite settle on open: full bounce. */
export const SPECIAL_DELIVERY_DOOR_OPENED_SCALE_X_MS = 500;
/** Opened sprite on close: scaleX 1 → 1.4 → 1.1. */
export const SPECIAL_DELIVERY_DOOR_OPENED_CLOSE_SCALE_X_MS = 200;

/**
 * Transform origins (fraction of door box). Vertical mid for all.
 * Closed / opening share hinge 0.3; opened uses 0.33.
 */
export const SPECIAL_DELIVERY_DOOR_CLOSED_PIVOT_X = 0.3;
export const SPECIAL_DELIVERY_DOOR_OPENING_PIVOT_X = 0.3;
export const SPECIAL_DELIVERY_DOOR_OPENED_PIVOT_X = 0.33;
export const SPECIAL_DELIVERY_DOOR_PIVOT_Y = 0.5;

/** @deprecated Prefer {@link SPECIAL_DELIVERY_DOOR_OPENED_PIVOT_X} */
export const SPECIAL_DELIVERY_DOOR_OPENED_PIVOT_Y = SPECIAL_DELIVERY_DOOR_PIVOT_Y;

/** Debug: dotted outline of each door’s tap area. */
export const SPECIAL_DELIVERY_SHOW_DOOR_HITBOXES = false;
/** Debug: dot at the active door pivot. */
export const SPECIAL_DELIVERY_SHOW_DOOR_PIVOT = false;
/** Debug: dot at the lock overlay pivot. */
export const SPECIAL_DELIVERY_SHOW_LOCK_PIVOT = false;
/** Debug: magenta dot at each reward icon pivot. */
export const SPECIAL_DELIVERY_SHOW_REWARD_PIVOTS = false;

/**
 * Lock overlay on closed doors — native art size (not stretched to door box),
 * same panel scale as other special-delivery sprites.
 * Sprite is centered on the door; transform-origin uses these pivots.
 */
export const SPECIAL_DELIVERY_LOCK_ART_SIZE_PX = 128;
export const SPECIAL_DELIVERY_LOCK_PIVOT_X = 0.5;
export const SPECIAL_DELIVERY_LOCK_PIVOT_Y = 0.2;
/** Lock swing / lock shake settle (reusable). Starts at 0°. */
export const SPECIAL_DELIVERY_LOCK_SWING_MS = 500;
/** Large lock placed over the crossed vines on the locked Special Deliveries panel. */
export const SPECIAL_DELIVERY_LARGE_LOCK_ART_SIZE_PX = 256;
export const SPECIAL_DELIVERY_LARGE_LOCK_CENTER_ART_PX = [550, 800] as const;
/** Panel-local nudge; inherited Collection barnScale keeps it aligned on phones. */
export const SPECIAL_DELIVERY_LARGE_LOCK_NUDGE_DOWN_PX = 10;

export const SPECIAL_DELIVERY_DOOR_CLOSED_SRC = '/assets/collection/specialdelivery_door_closed.png';
export const SPECIAL_DELIVERY_DOOR_OPENING_SRC = '/assets/collection/specialdelivery_door_opening.png';
export const SPECIAL_DELIVERY_DOOR_OPENED_SRC = '/assets/collection/specialdelivery_door_opened.png';
export const SPECIAL_DELIVERY_LOCK_SRC = '/assets/collection/specialdelivery_lock.png';
export const SPECIAL_DELIVERY_LARGE_LOCK_SRC =
  '/assets/collection/specialdelivery_lock_large.png';
export const SPECIAL_DELIVERY_UNLOCK_SRC = '/assets/collection/specialdelivery_unlock.png';
export const SPECIAL_DELIVERY_LARGE_UNLOCK_SRC =
  '/assets/collection/specialdelivery_unlock_large.png';
/** DOM id for the locked-panel vine lock (manual FTUE hole / measure). */
export const SPECIAL_DELIVERY_LOCKED_FTUE_LOCK_ID = 'special-delivery-locked-ftue-lock';
/** DOM id for the locked Level button (manual FTUE reset control). */
export const SPECIAL_DELIVERY_LOCKED_FTUE_LEVEL_BUTTON_ID =
  'special-delivery-locked-ftue-level-button';
/** Locked panel begins fading immediately after the vine lock knock-off. */
export const SPECIAL_DELIVERY_LOCKED_PANEL_FADE_DELAY_MS = 0;
export const SPECIAL_DELIVERY_LOCKED_PANEL_CROSSFADE_MS = 250;
/** Normal panel art appears quickly beneath the fading locked panel. */
export const SPECIAL_DELIVERY_LOCKED_FTUE_PANEL_FADE_IN_MS = 50;
/** Closed doors appear alongside the normal panel art. */
export const SPECIAL_DELIVERY_LOCKED_FTUE_DOORS_FADE_MS = 50;

/** Key particle: pot wallet → lock (coin-style trail). */
export const SPECIAL_DELIVERY_KEY_FLIGHT_MS = 150;
/** Unlock knock-off (pop up-left then fall) duration. */
export const SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_MS = 933;
/** Ballistic launch (px/s) — tuned with gravity so the path matches the 1400ms arc at 1.5× speed. */
export const SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VX = -210;
export const SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VY0 = -630;
export const SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_GRAVITY = 3263;
/** Hit point sits this many design-px below lock center (key sweeps underneath). */
export const SPECIAL_DELIVERY_KEY_HIT_BELOW_LOCK_CENTER_PX = 6;

/** Reward icon size in panel art px (behind door). Base art 112 × 1.25. */
export const SPECIAL_DELIVERY_REWARD_ART_SIZE_PX = Math.round(112 * 1.25);
/** Visual / bounce pivot on the reward icon (normalized). */
export const SPECIAL_DELIVERY_REWARD_PIVOT_X = 0.5;
export const SPECIAL_DELIVERY_REWARD_PIVOT_Y = 0.8;
/** Nudge reward down from door-cell center (design px). */
export const SPECIAL_DELIVERY_REWARD_OFFSET_Y_PX = 25;
/** Reward drop-shadow sprite (same size/pivot as reward). */
export const SPECIAL_DELIVERY_REWARD_SHADOW_SRC = '/assets/icons/upgrades/icon_reward_shadow.png';
/** Extra Y below the reward for the shadow sprite (design px). */
export const SPECIAL_DELIVERY_REWARD_SHADOW_OFFSET_Y_PX = 7;
/** Center cell of the 3×3 (match-3 gather target). */
export const SPECIAL_DELIVERY_CENTER_DOOR_INDEX = 4;
/** Match-3 gather flight. */
export const SPECIAL_DELIVERY_MATCH3_MS = 375;
/** Door-open reward punch (1→1.5→1). */
export const SPECIAL_DELIVERY_MATCH3_PUNCH_MS = 300;
/** Center reveal after collide (single anim): 1.5→4.5→5→5→2.5→3.25→3. */
export const SPECIAL_DELIVERY_MATCH3_REVEAL_MS = 800;
/** Reveal scale keyframes (equal timing). */
export const SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES = [1.5, 4.5, 5, 5, 2.5, 3.25, 3] as const;
/** Final hold scale (last reveal keyframe). */
export const SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END =
  SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES[SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES.length - 1]!;
/**
 * Y bounce (0→peak→0) runs from the first keyframe through this keyframe index
 * (scale 2.5 at index 4). After that, Y stays at 0.
 */
export const SPECIAL_DELIVERY_MATCH3_REVEAL_Y_END_KEYFRAME = 4;
/** Reveal Y bounce peak (px; positive = up). */
export const SPECIAL_DELIVERY_MATCH3_REVEAL_Y_PX = 15;
/**
 * FX (gradients / beams / sparkles) fade in from this scale keyframe (2.5)
 * through the final keyframe (3).
 */
export const SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_START_KEYFRAME = 4;
export const SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_END_KEYFRAME =
  SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES.length - 1;
/**
 * Title / subtitle / description / claim stagger starts when reveal scale
 * hits this value on the slam-down (between keyframe scales 5 → 2.5).
 */
export const SPECIAL_DELIVERY_MATCH3_REVEAL_COPY_START_SCALE = 3;
/** Match-3 gather scales: 1 → 2 → 1.5. */
export const SPECIAL_DELIVERY_MATCH3_SCALE_START = 1;
export const SPECIAL_DELIVERY_MATCH3_SCALE_PEAK = 2;
export const SPECIAL_DELIVERY_MATCH3_SCALE_END = 1.5;
/** Fullscreen dim (matches popup backdrop). */
export const SPECIAL_DELIVERY_MATCH3_OVERLAY_OPACITY = 0.95;
/** Quick fade for title / subtitle / description / claim / glow FX on claim. */
export const SPECIAL_DELIVERY_MATCH3_CHROME_FADE_MS = 200;
/** Coin reward icon fade on claim — clears the center for the coin burst. */
export const SPECIAL_DELIVERY_MATCH3_COIN_ICON_FADE_MS = 50;
/** Black overlay (+ reward icon) fade-out after claim (coins start fading immediately). */
export const SPECIAL_DELIVERY_MATCH3_DISMISS_MS = 1000;
/** After claim, wait this long before doors start closing (lets reward FX read). */
export const SPECIAL_DELIVERY_MATCH3_DOOR_CLOSE_DELAY_MS = 500;
/** Upgrade / booster fly-to-Garden-nav scale keyframes (equal timing). */
export const SPECIAL_DELIVERY_MATCH3_FLY_SCALES = [3, 2, 1, 0.75, 1] as const;
/** Fly duration = knockoff MS / this (2 = twice as fast). */
export const SPECIAL_DELIVERY_MATCH3_FLY_SPEED_MUL = 2;

/**
 * Trophy claim: the revealed trophy stays up while the collection auto-scrolls to the shelf that
 * trophy belongs on; the black overlay starts fading as soon as that scroll begins.
 */
export const SPECIAL_DELIVERY_TROPHY_SCROLL_MS = 500;
/**
 * Where the target slot lands in the barn viewport (0 = top, 1 = bottom). Kept near the bottom
 * so the trophy has a long, readable run from the reveal position down into the slot.
 */
export const SPECIAL_DELIVERY_TROPHY_SCROLL_FOCUS_RATIO = 0.85;
/** Flight launches this long before the scroll settles ("almost finished"). */
export const SPECIAL_DELIVERY_TROPHY_FLIGHT_LEAD_MS = 120;
/** Trophy flight from the reveal center into its shelf slot. */
export const SPECIAL_DELIVERY_TROPHY_FLIGHT_MS = 450;
/** Trophy lob rises this much higher than the Garden-nav flight before falling in. */
export const SPECIAL_DELIVERY_TROPHY_FLIGHT_PEAK_RISE_SCALE = 4;
/**
 * Launch direction per shelf slot (left → right): up-left, up-up-left, up-up-right, up-right.
 * −1 is the widest left launch, +1 the widest right; the sign follows the slot's side of the shelf.
 */
export const SPECIAL_DELIVERY_TROPHY_FLIGHT_LAUNCH_BIAS_BY_SLOT: readonly number[] = [
  -1, -0.42, 0.42, 1,
];
/** Overlay clears during the flight so the shelf reveal reads on impact. */
export const SPECIAL_DELIVERY_TROPHY_OVERLAY_FADE_MS = 750;
/**
 * Flight ends at this multiple of the shelf slot's on-screen size. Scale stays roughly flat
 * (no nav-bar pulse) — just a gentle settle into the slot.
 */
export const SPECIAL_DELIVERY_TROPHY_FLIGHT_END_SCALE_OF_SLOT = 1;

/**
 * TEMPORARY: deal only trophies (3 distinct winnable ones) so the trophy claim flow can be
 * play-tested without waiting on weighted trophy rolls.
 */
export const SPECIAL_DELIVERY_DEAL_TROPHIES_ONLY_DEBUG = false;
/** How many distinct reward types (×3 copies each = 9 doors). */
export const SPECIAL_DELIVERY_REWARD_TYPE_COUNT = 3;
export const SPECIAL_DELIVERY_REWARD_COPIES_EACH = 3;

/**
 * Relative likelihood of each reward *type* being selected into a board's 3 slots.
 * (Not independent probabilities — used as weights for sampling without replacement.)
 * Trophy weight is ignored when no trophies are winnable.
 */
export const SPECIAL_DELIVERY_REWARD_TYPE_WEIGHTS = {
  coins: 50,
  booster: 30,
  trophy: 30,
  upgrade: 30,
  keys: 15,
} as const;

/** Keys awarded when a Special Delivery keys reward is claimed. */
export const SPECIAL_DELIVERY_KEY_REWARD_AMOUNT = 10;
export const SPECIAL_DELIVERY_KEY_REWARD_ICON =
  '/assets/icons/coins/icon_key.png';

/**
 * Booster ↔ upgrade icon pairs that look too similar to show on the same board.
 * Filenames only (matched case-insensitively against the path basename).
 */
export const SPECIAL_DELIVERY_LOOKALIKE_ICON_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['icon_happiestcustomers.png', 'icon_happycustomer.png'],
  ['icon_doubleharvest.png', 'icon_cropvalue.png'],
  ['icon_rapidseeds.png', 'icon_seedproduction.png'],
  ['icon_rushorders.png', 'icon_customerspeed.png'],
  ['icon_rapidharvest.png', 'icon_harvestspeed.png'],
];

/**
 * Garden-upgrade icons (Seeds / Crops / Harvest tabs).
 * Combined with duration boosters + garden coins in {@link dealSpecialDeliveryRewards}.
 * Excludes non-upgrade icons (e.g. harvest button).
 */
export const SPECIAL_DELIVERY_REWARD_ICON_POOL: readonly string[] = [
  '/assets/icons/upgrades/icon_seedproduction.png',
  '/assets/icons/upgrades/icon_seedquality.png',
  '/assets/icons/upgrades/icon_luckyseed.png',
  '/assets/icons/upgrades/icon_harvestspeed.png',
  '/assets/icons/upgrades/icon_plotexpansion.png',
  '/assets/icons/upgrades/icon_luckymerge.png',
  '/assets/icons/upgrades/icon_cropvalue.png',
  '/assets/icons/upgrades/icon_customerspeed.png',
  '/assets/icons/upgrades/icon_marketvalue.png',
  '/assets/icons/upgrades/icon_seedsurplus.png',
  '/assets/icons/upgrades/icon_happycustomer.png',
];

/** Icon path → upgrade id for Special Delivery upgrade rewards. */
export const SPECIAL_DELIVERY_UPGRADE_ID_BY_ICON: Readonly<Record<string, string>> = {
  '/assets/icons/upgrades/icon_seedproduction.png': 'seed_production',
  '/assets/icons/upgrades/icon_seedquality.png': 'double_seeds',
  '/assets/icons/upgrades/icon_luckyseed.png': 'bonus_seeds',
  '/assets/icons/upgrades/icon_harvestspeed.png': 'harvest_speed',
  '/assets/icons/upgrades/icon_plotexpansion.png': 'plot_expansion',
  '/assets/icons/upgrades/icon_luckymerge.png': 'wild_growth',
  '/assets/icons/upgrades/icon_cropvalue.png': 'crop_value',
  '/assets/icons/upgrades/icon_customerspeed.png': 'customer_speed',
  '/assets/icons/upgrades/icon_marketvalue.png': 'market_value',
  '/assets/icons/upgrades/icon_seedsurplus.png': 'seed_surplus',
  '/assets/icons/upgrades/icon_happycustomer.png': 'happy_customer',
};

/** Headline (category) + subtitle (name) + description for match-3 reveal. */
export const SPECIAL_DELIVERY_REWARD_COPY: Readonly<
  Record<string, { headline: string; title: string; description: string; amountLabel: string }>
> = {
  '/assets/icons/upgrades/icon_seedproduction.png': {
    headline: 'Garden Upgrade',
    title: 'Production Speed',
    description: 'Increase how fast seeds are produced',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_seedquality.png': {
    headline: 'Garden Upgrade',
    title: 'Double Seeds',
    description: 'Increase chance to spawn 2 seeds at a time',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_luckyseed.png': {
    headline: 'Garden Upgrade',
    title: 'Lucky Seed',
    description: 'Increase chance to produce a bonus higher level seed',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_harvestspeed.png': {
    headline: 'Garden Upgrade',
    title: 'Harvest Speed',
    description: 'Increase automatic harvest cycle speed',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_plotexpansion.png': {
    headline: 'Garden Upgrade',
    title: 'Garden Expansion',
    description: 'Unlock additional plots in the garden',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_luckymerge.png': {
    headline: 'Garden Upgrade',
    title: 'Wild Growth',
    description: 'Plants automatically duplicate over time',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_cropvalue.png': {
    headline: 'Garden Upgrade',
    title: 'Crop Yield',
    description: 'Plants produce more crops per harvest',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_customerspeed.png': {
    headline: 'Garden Upgrade',
    title: 'Order Speed',
    description: 'Reduce the time it takes for new orders to appear',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_marketvalue.png': {
    headline: 'Garden Upgrade',
    title: 'Market Value',
    description: 'Increase the coins earned when completing orders',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_seedsurplus.png': {
    headline: 'Garden Upgrade',
    title: 'Surplus Recharges',
    description: 'Extra Harvest & Seed recharges sell for more coins',
    amountLabel: '+1 FREE',
  },
  '/assets/icons/upgrades/icon_happycustomer.png': {
    headline: 'Garden Upgrade',
    title: 'Happy Customer',
    description: 'Increase chance that customers pay double for orders',
    amountLabel: '+1 FREE',
  },
};

export type SpecialDeliveryDoorPhase = 'closed' | 'opening' | 'opened';

export function specialDeliveryDoorSrcForPhase(phase: SpecialDeliveryDoorPhase): string {
  switch (phase) {
    case 'opening':
      return SPECIAL_DELIVERY_DOOR_OPENING_SRC;
    case 'opened':
      return SPECIAL_DELIVERY_DOOR_OPENED_SRC;
    case 'closed':
    default:
      return SPECIAL_DELIVERY_DOOR_CLOSED_SRC;
  }
}

export function specialDeliveryDoorPivotX(phase: SpecialDeliveryDoorPhase): number {
  switch (phase) {
    case 'opening':
      return SPECIAL_DELIVERY_DOOR_OPENING_PIVOT_X;
    case 'opened':
      return SPECIAL_DELIVERY_DOOR_OPENED_PIVOT_X;
    case 'closed':
    default:
      return SPECIAL_DELIVERY_DOOR_CLOSED_PIVOT_X;
  }
}
