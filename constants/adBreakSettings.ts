/**
 * Interstitial / ad-break tuning — edit values here.
 *
 * ## Triggers (`AdBreakTriggerId`)
 * | ID | When |
 * |----|------|
 * | `discovery_add` | Player taps **Add to Collection** on the discovery popup |
 * | `level_up_continue` | Player taps the primary button on the level-up popup (skipped before mini-FTUE / upgrade-panel unlock flows) |
 * | `leave_store` | Navbar switches **Store → Garden (Farm)** (mid nav slide) |
 * | `leave_collection` | Navbar switches **Collection → Garden (Farm)** (mid nav slide) |
 * | `switch_garden` | Player finishes switching to another garden |
 * | `collection_bonus_close` | Player closes the golden-pot bonuses popup after an unlock reveal |
 * | `fallback_idle` | Max-interval failsafe when no trigger fired for too long |
 *
 * ## Blockers (`adBreakBlockers` in `utils/adBreak/evaluateAdBreak.ts`)
 * | Blocker | Reason |
 * |---------|--------|
 * | No-ads boost active | Player purchased / has Remove Ads |
 * | Unlock gate | Below min level **and** below min active playtime |
 * | Main FTUE | `activeFtueStage !== null` or FTUE 11 queued |
 * | Collection FTUE | Collection tutorial in progress |
 * | Tasks FTUE | Daily tasks tutorial in progress |
 * | Gardens FTUE | Gardens floating-button tutorial in progress |
 * | New garden FTUE | Post-purchase garden tutorial in progress |
 * | Holding a plant | `dragState !== null` |
 * | Ad already showing | Rewarded fade, ad-break intro, or fake ad visible |
 * | Loading | Game still loading |
 * | Garden switch overlay | Garden transition in progress |
 * | Offline earnings open | Welcome-back popup visible |
 * | Return grace | Same-session returns under max interval: `returnGraceMs` (covers near-ready cooldowns) |
 * | In Store | Never show interstitial ads on the Store screen (wait until they leave) |
 * | Pause / dev tools open | Settings or debugger open |
 * | Other blocking popups | IAP, purchase success, rate-us, fake review, limited offer, daily tasks |
 * | Discovery popup open | Blocks other triggers (not `discovery_add`) |
 * | Level-up popup open | Blocks other triggers (not `level_up_continue`) |
 * | Golden-pot bonuses open | Blocks other triggers (not `collection_bonus_close`) |
 *
 * ## Cooldowns (global — not per garden)
 * | Setting | Value | Role |
 * |---------|-------|------|
 * | `cooldownMs` | 3 min | Minimum time since last ad break |
 * | `rewardedBufferMs` | 2 min | Minimum time since last rewarded ad |
 * | `maxIntervalMs` | omitted → 2× cooldown (6 min) | Failsafe: flag fallback if no ad for this long |
 * | `returnGraceMs` | 60s | Same-session return buffer (any away under max interval) |
 *
 * **Return policy (away time vs last background):**
 * - Away at least max interval → **new session**: no grace; stamp `lastAdBreakAt = now` so full cooldown applies
 * - Away under max interval → **same session**: apply `returnGraceMs` (even if cooldown is almost ready)
 *
 * First ad break only after **minPlayerLevel** OR **minActivePlaytimeMs** (whichever comes first).
 * No daily cap.
 */

export type AdBreakTriggerId =
  | 'discovery_add'
  | 'level_up_continue'
  | 'leave_store'
  | 'leave_collection'
  | 'switch_garden'
  | 'collection_bonus_close'
  | 'fallback_idle';

export const AD_BREAK_SETTINGS = {
  /** Minimum time between ad breaks. */
  cooldownMs: 3 * 60 * 1000,
  /** Extra buffer after a rewarded ad before an ad break may show. */
  rewardedBufferMs: 2 * 60 * 1000,
  /** Failsafe when `maxIntervalMs` is omitted: cooldownMs × this multiplier. */
  maxIntervalCooldownMultiplier: 2,
  /** Ad breaks disabled until player reaches this level… */
  minPlayerLevel: 5,
  /** …or accumulates this much active playtime (ms). */
  minActivePlaytimeMs: 8 * 60 * 1000,
  /** How often to re-check fallback while playing. */
  fallbackPollMs: 5 * 1000,
  /**
   * Short same-session break buffer only (see `applyAdBreakReturnPolicy`).
   * Not used for long absences / new sessions.
   */
  returnGraceMs: 60 * 1000,
} as const;
