# Pocket Garden — Arena handoff plan

**Game:** Pocket Garden · **Bundle:** `com.infinitygames.pocketgarden` · **Version:** see `constants/appVersion.ts`  
**Creator handoff doc** — one place for north-star, monetisation, notifications, and analytics (Prompt 1).  
See **Things different from Notion’s checklist** for intentional deltas; italic notes elsewhere call out the same.

---

## Quick access — Debug Menu

1. Open **Settings** (gear).
2. Tap the version label at the bottom (`vX.Y.Z`) **7 times** within ~2.5 seconds.
3. A red **Dev Tools** pill appears (top-left of Settings).
4. Tap **Dev Tools** to open the full Debug Menu (tabs, stats, search, Normal Rules / Force State).

Unlock lasts for the session (and while Dev Tools stays enabled). From Debug → Profiles you can **Disable Dev Tools unlock**.  
While the offline / VPN gate is up, the same 7× version tap on the gate’s dim version text also unlocks / opens Dev Tools.

Release flag-gating of Debug is 🔵 Genesis; prototype access is Settings version taps only.

---

## Identity — Bundle ID & IAP uniformization

| Field | Value |
|---|---|
| `GAME_KEY` | `pocketgarden` |
| `APP_NAME` | `Pocket Garden` |
| `BUNDLE_ID` | `com.infinitygames.pocketgarden` |
| `APP_ID` (IAP prefix) | `com.infinitygames.pocketgarden` |

**Source of truth:** `constants/appIdentity.ts`  
**IAP SKU helper:** `utils/iapProducts.ts` — every store id is `` `${APP_ID}.<snake_case>` ``.

### Bundle ID locations (must stay identical)

1. `capacitor.config.ts` → `appId` (imports `BUNDLE_ID`)  
2. `android/app/build.gradle` → `namespace` + `applicationId`  
3. `android/app/src/main/res/values/strings.xml` → `package_name` + `custom_url_scheme`  
4. iOS `PRODUCT_BUNDLE_IDENTIFIER` — **N/A** (no iOS project yet)  
5. IAP `APP_ID` in `constants/appIdentity.ts` / `utils/iapProducts.ts`

### Play / App Store IAP SKUs (create these in consoles)

| Display | Internal offer id | Android / iOS store SKU |
|---|---|---|
| Coin Boost | `store_coin_boost` | `com.infinitygames.pocketgarden.coin_boost` |
| Coin Mega Boost | `store_coin_mega_boost` | `com.infinitygames.pocketgarden.coin_mega_boost` |
| Coin Ultra Boost | `store_coin_ultra_boost` | `com.infinitygames.pocketgarden.coin_ultra_boost` |
| Remove Ads | `store_no_ads` | `com.infinitygames.pocketgarden.remove_ads` |
| Starter Pack | `store_bundle_starter_pack` | `com.infinitygames.pocketgarden.starter_pack` |
| Field Pack | `store_bundle_field_pack` | `com.infinitygames.pocketgarden.field_pack` |
| Harvester Pack | `store_bundle_harvesters_pack` | `com.infinitygames.pocketgarden.harvesters_pack` |

### Analytics / Facebook keys

Placeholders in `constants/appIdentity.ts` → `ANALYTICS_KEYS` and empty `facebook_*` strings in `strings.xml`.  
**Need from Arena/Genesis before live:** AppsFlyer Android/iOS keys, devtodev app ids, Facebook app id + client token, iOS App Store numeric id.

### Manual / binary swaps (cannot be done from this prompt)

- `android/app/google-services.json` (+ future `GoogleService-Info.plist`) — new Firebase project  
- App icon (`GameIcon_1024x1024.png` + mipmaps / iOS catalog) and splash  
- Signing keystore (`android.jks`), per game  
- AdMob / AppLovin app IDs and ad-unit IDs  

---

## Things different from Notion’s checklist

Bullet summary of intentional deltas / rules we did **not** follow as written. Full detail lives in the numbered sections. Timed/mixed IAPs also remain in **§6 / §13 / §14**.

### Rate Us (prefer ours)
- **Not** “rating unlocks / gates the first interstitial.”
- First auto show after **Daily Tasks FTUE** claim closes; soft retry **max 3 × ~24h**; Settings Rate Us after soft dismiss until rated.
- **60s cooldown after ads** before Rate Us (ads-first courtesy), instead of rating-before-interstitial.
- No reward for rating (checklist-aligned).

### Ads / timing
- Interstitial unlock: **level ≥ 5 OR ≥ 8 min** play — not template’s aggressive early cadence / 60s-min style.
- Cadence: **3 min** between interstitials (**2 min** after rewarded); **6 min** overdue fallback; **60s** return grace.
- **Banner / interstitial / rewarded** = placeholders (no real SDK creatives). **When to show is fully wired** — Genesis only fills bridges / banner mount (§3b).

### IAPs (also in catalog §§)
- **Timed Remove Ads** (7d standalone; 24h in packs) — Notion §11 wants no time-based IAP; we ship timed **boosts**, not subscriptions. See **§13**.
- **Mixed packs** (Remove Ads + Double Coins + Rapid Harvest) — Notion §11 says don’t mix remove-ads with currency; we keep Starter / Field / Harvester as conversion hooks. See **§14**.
- Prototype billing is still **local grant** (real Play Billing = Genesis).

### Notifications (now Notion-aligned on drip + silence)
- Day **0–15 weighted drip** + **silent / LOW** channel — implemented (see **§9**). Earlier prototype used a lighter 2-shot HIGH channel; that delta is closed.

### Other
- **Remote config** = local defaults only (Firebase fetch not wired).
- **Debug Menu** = Settings version 7× taps (flag-gated release hide = Genesis).
- **Offline / VPN gate** = Discovery-style blocking popup (not in Notion checklist; ship behaviour).
- Analytics Prompt 1 stubs + CSV only; Prompt 2/3 = Genesis / Arena.

---

## 0 · North-star first-session goal

**Discover plants and expand your garden.**

Measured in-session by: first plant discoveries + player level progress on garden 1 (FTUE teach-by-doing → merge → goals → level-ups).

---

## 1 · Monetisation model

**Model:** Freemium — hybrid ads (interstitial + rewarded + bottom banner reserve) + one-off / pack IAPs (prototype billing is local grant).

**Primary revenue driver (prototype intent):** Rewarded ads throughout early/mid session; IAP packs at emotional peaks (level 4 Starter / Field; Remove Ads CTA always available on farm).

**IAP intent (prototype):** Ads-led early; packs + Remove Ads as conversion hooks. Exact revenue split TBD after live ads/IAP.

> Template suggested rating-before-first-interstitial and banner-from-minute-0.  
> **We keep our timings** (see **Things different from Notion’s checklist** + §§4–5). Banner layout reserve is live under the navbar (placeholder).

---

## 2 · Core loop ↔ monetisation map

| Loop beat | Monetisation moment | Type |
|---|---|---|
| Merge / grow plants / complete goals | Soft rewarded limited offers (level ≥ 2) | Rewarded |
| Discover plant → Add to Collection | Interstitial candidate (`discovery_add`) | Interstitial |
| Level-up Continue | Interstitial candidate (`level_up_continue`); L4 force Starter/Field pack | Interstitial / IAP |
| Leave Store / Collection / switch garden | Interstitial candidates | Interstitial |
| Idle overdue | Fallback interstitial (`fallback_idle`) | Interstitial |
| Coin goal / offline bank / store free slot / daily 2× | Rewarded | Rewarded |
| Always on farm | Remove Ads floating button + Store IAPs | IAP |
| Early win (Daily Tasks FTUE close) | Rate Us (no reward) | Rating |

---

## 3 · Ad placements

### Status — placeholders vs game wiring (read this first)

**All three ad surfaces are placeholders today — no real AdMob / AppLovin MAX / mediation creative yet.**

| Surface | Player sees now | Game wiring |
|---|---|---|
| **Banner** | Magenta “Banner Ad” strip under navbar | Show/hide + height reclaim done (`showBannerAdSlot`, Remove Ads, `ads.enabled`) |
| **Interstitial** | Fade → loading plate → “Return To Game” escape (`FakeAdPopup` ad-break variant) | Triggers, cadence, blockers, intro/outro fully live |
| **Rewarded** | Fade → loading plate → claim path (`FakeAdPopup` rewarded variant) | Placements + reward grant path fully live |

**What is already “as ready as possible” before Genesis:** when to show, when to block, Remove Ads mute for forced ads (banner + interstitial), loading-plate timing contract, and plug-in bridge slots. **What Genesis still does:** native SDK + app/ad-unit IDs + fill the bridge stubs (and swap banner placeholder for a real banner view).

Do **not** re-time ads in App when wiring SDK — only fill the bridges / banner mount (see **§3b Genesis ad wiring**).

### Banner
**Status:** Layout reserve live under the **Navbar** (bottom-most chrome in `#game-container`). Magenta “Banner Ad” placeholder until real SDK. Height `BANNER_AD_RESERVE_HEIGHT_PX` = 50.  
**Placement:** Flex child **below** Navbar — always on screen across Store / Garden / Collection (same persistence as nav). Z ~90 (above nav tabs; below FTUE 100 / popups 220).  
**Hidden / height reclaimed when:** Remove Ads boost active, `ads.enabled` false, or loading.  
**FTUE-safe:** Slot stays mounted through FTUEs so layout / hole targets don’t jump; FTUE portals cover the strip.  
**Also covered by:** full-screen network gate, fake ads, modals (z above banner).

### Interstitials
**Fires at natural breaks** (never mid-drag / mid-FTUE). Triggers: `discovery_add`, `level_up_continue`, `leave_store`, `leave_collection`, `switch_garden`, `collection_bonus_close`, `fallback_idle`.

**First interstitial gate (ours):** player level ≥ **5** **OR** active playtime ≥ **8 minutes**, then cadence rules.  
**Pauses gameplay:** yes (fake loading plate today / real SDK later via bridge).

Skipped on specific level-up Continues that start FTUE (Tasks L6, Collection/SD L7, Gardens L10).

### Rewarded ads
Reward grants only after completion (prototype FakeAd claim path / real SDK later via bridge). Remove Ads does **not** mute rewarded (forced ads only).

| Placement | Where | Reward | Cap / notes |
|---|---|---|---|
| Limited offer pool | Auto popup / upgrade row / farm | Timed boosts (seed storm, rapid seeds, double harvest, special delivery, rapid harvest, rush orders, happiest customers) | Intro cycle then soft hints; min gap 90s |
| Store free slots | Store top free offers | Same boost family | 15 min cooldown / slot |
| Coin goal | Goals strip | Coins | L≥2; visibility/respawn timers |
| Offline earnings | Offline popup Double Coins | 2× offline bank | Once per open |
| Daily Tasks claim 2× | Daily Tasks | 2× claim | Per claim flow |
| Upgrade list ads | Shed/upgrade rows | Offer-specific | |

---

## 3b · Genesis ad wiring (where to put real ads)

**Goal:** drop in SDK without redesigning when ads fire. App already owns timing; bridges own creatives.

### Do not change (unless product asks)
- `utils/adBreak/evaluateAdBreak.ts` — blockers / cadence  
- `constants/remoteConfigDefaults.ts` → `ads.*` — live numbers  
- `App.tsx` open paths (`openAdBreakFakeAd`, `openRewardedFakeAd`, trigger call sites)  
- Banner visibility rule: `showBannerAdSlot` in `App.tsx` (Remove Ads / `areAdsEnabled` / loading)

### Wire here

| Ad type | Mount / UI slot (leave in place) | **Replace stub implementation** |
|---|---|---|
| Interstitial | `components/InterstitialAdLayer.tsx` (called after fade-to-black; loading plate underneath) | `utils/adBreak/interstitialAdBridge.ts` → `show` / `cancel` |
| Rewarded | `components/RewardedAdLayer.tsx` (same timing contract) | `utils/adBreak/rewardedAdBridge.ts` → `show` / `cancel` |
| Banner | `#banner-ad-slot` / `components/BannerAdPlaceholder.tsx` under Navbar in `App.tsx` | Swap placeholder for native/web banner view; keep `BANNER_AD_RESERVE_HEIGHT_PX` (or match SDK height) |

### Bridge contract (interstitial + rewarded)
1. App fades to black → shows loading plate → activates layer → calls `bridge.show({ onOpened, onClosed })`.  
2. When creative is on-screen: `onOpened()`.  
3. When finished / failed / skipped / no-fill: `onClosed(result)` — App tears down plate + fades gameplay (and grants reward only on rewarded success path).  
4. Player escape on plate calls `bridge.cancel()` — App owns UI teardown; do not double-close.  
5. Stub today intentionally never opens/closes so the FakeAd plate remains the prototype UX.

### Also needed from Genesis / store consoles
- AdMob / AppLovin app IDs + **banner / interstitial / rewarded** ad-unit IDs  
- Native SDK in Android (and later iOS)  
- Respect existing `ads.enabled` kill switch and Remove Ads for **forced** ads (interstitial + banner); leave rewarded opt-in unless product changes

---

## 4 · Ad timing & gating config (our live values)

Source of truth: `constants/remoteConfigDefaults.ts` → `ads` (facade `AD_BREAK_SETTINGS`).

| Constant (ours) | Meaning | Value |
|---|---|---|
| `interstitialMinPlayerLevel` | Soft unlock by level | **5** |
| `interstitialMinActivePlaytimeMs` | Soft unlock by playtime | **8 min** |
| `interstitialCooldownMs` | Min between interstitials | **3 min** |
| `interstitialCooldownAfterRewardedMs` | Extra buffer after rewarded | **2 min** |
| `interstitialMaxIntervalMs` | Fallback overdue window | **6 min** |
| `interstitialGracePeriodMs` | Return grace (short away) | **60 s** |
| Away ≥ 6 min | Treated as new session (cooldown reset) | **6 min** |
| `specialOffer.minGapMs` | Min between special-offer popups | **90 s** |
| `specialOffer.anytimeFallbackMs` | Anytime offer fallback | **120 s** |
| `specialOffer.quietAfterCloseMs` | Quiet after close | **10 s** |
| `specialOffer.storeFreeOfferCooldownMs` | Store free slot cooldown | **15 min** |
| Rate Us post-ad cooldown | No Rate Us for N ms after ads | **60 s** |

**Interstitial trigger logic:** A “qualifying break” is one of the trigger ids above when blockers are clear (not in store/collection/FTUE/popups/drag/no-ads boost/dev tools, etc.). Fallback polls every 5s while playing.

> Template used 60s interstitial min + rating-unlocks-first-interstitial.  
> **We intentionally keep longer early grace (L5 / 8 min) and do not hard-gate interstitials behind Rate Us.**

---

## 5 · Rating screen plan

**Trigger:** First auto show after Daily Tasks FTUE claim popup closes (`forceFirstShow`). Soft retries after dismiss (max 3, 24h delay). Settings → Rate Us until permanently rated (button appears after first soft dismiss).

**Reward offered:** none (checklist-compliant).

**Gate vs ads (intentional):** **60s after ads before Rate Us**. We do **not** use “rate before first interstitial” — see **Things different from Notion’s checklist**.

**Copy / store URL:** Play Store package link for `com.infinitygames.pocketgarden`.

---

## 6 · IAP catalog (prototype)

Prices from remote config / `offers.ts`. Billing is stubbed (`completePremiumStorePurchase`).  
**Store SKUs** use Infinity uniformization: `` `${APP_ID}.<suffix>` `` — see **Identity** section above and `utils/iapProducts.ts`.

| Product / offer id | Store SKU suffix | Display | Type (prototype) | Price tier | Contents | Offered when |
|---|---|---|---|---|---|---|
| `store_bundle_starter_pack` | `starter_pack` | Starter Pack | Limited pack | $9.99 (was $49.99) | Remove Ads 24h + Double Coins 2h + Rapid Harvest 30m | Garden 1 · level 4 force popup · 24h countdown · Owned after buy |
| `store_bundle_field_pack` | `field_pack` | Field Pack | Limited pack | $9.99 | Same style grants | Garden 2+ · level 4 · 24h countdown · Owned after buy |
| `store_bundle_harvesters_pack` | `harvesters_pack` | Harvester Pack | Bundle | $29.99 | Longer remove-ads + boosts | Store |
| `store_no_ads` | `remove_ads` | Remove Ads | Timed boost IAP | $5.99 | Remove forced ads **7d** · Owned while active | Farm FB + Store |
| `store_coin_boost` / `mega` / `ultra` | `coin_boost` / `coin_mega_boost` / `coin_ultra_boost` | Coin boosts | Consumable boost | $5.99 / $9.99 / $79.99 | Double Coins durations | Store |

**Open with Arena:** see **§13 Time-based IAP** and **§14 Mixed IAPs** — Notion §11 policy documented for handoff.

---

## 7 · Player conversion plan

**Toward rewarded ads**
- Limited offers from level 2 at natural pain/power moments  
- Store free slots always visible with cooldowns  
- Offline Double Coins + Daily Tasks 2× + coin goal  

**Toward IAP**
- Starter/Field at level 4 (high motivation / limited countdown)  
- Permanent Remove Ads CTA on farm  
- Store bundles + coin boosts for spenders  

**First-purchase hook:** Level-4 Starter/Field pack (timed offer + clear value stack).

---

## 8 · First-session monetisation timeline (ours)

Approximate; FTUE length varies.

1. **0:00** — install, splash, FTUE teach-by-doing (no ads).  
2. **~FTUE end** — notification permission soft ask; play continues.  
3. **Level ≥ 2** — rewarded limited-offer cycle can begin.  
4. **Level 4** — Starter Pack force popup (garden 1).  
5. **Daily Tasks FTUE complete** — Rate Us (no reward).  
6. **Level ≥ 5 or ~8 min play** — interstitials eligible; then ≥3 min cadence (2 min after rewarded).  
7. Ongoing — Remove Ads FB, store IAPs, rewarded placements.

Banner reserve sits under the Navbar on all screens; hidden when Remove Ads is active.

---

## 9 · Notifications plan

**Implemented:** Android local return reminders (`constants/localNotificationSettings.ts`, `@capacitor/local-notifications`). Day **0–15 weighted drip** + **silent** channel (Notion-aligned).

| Setting | Value |
|---|---|
| Day 0 | Soft ping **~4h** after leave (bumped out of quiet hours) |
| Days 1–15 | Weighted morning (**09:00**) / evening (**19:00**) drip — heavier early, taper later (`RETURN_REMINDER_DRIP_PLAN`) |
| Quiet hours | **22:00–08:00** local |
| Cap | **Max 2 / local day** (delivered + pending) |
| Title | `Pocket Garden` |
| Channel | `pocket_garden_return_v2_silent` · importance **LOW (2)** · no vibration (silent shade) |
| Copy | Pools: offline, daily_tasks, anytime, morning, evening (no same category twice in a row; daily-tasks morning-preferred) |
| Icon | App icon / `ic_stat_pocket_garden` |
| Permission | Once after main FTUE; Settings → Notifications toggle |

**Drip sketch** (`RETURN_REMINDER_DRIP_PLAN`): D0 soft · D1–4 morning+evening · D5 morning · D6 both · D7 evening · then single slots through D15 (mostly morning). Edit the plan table in code to rebalance without touching schedule plumbing.

---

## 10 · Remote config (local now → Firebase later)

**Status:** Fully wired in-game to **local defaults**. **Not** fetching from Firebase Remote Config yet (🔵 Genesis / Firebase project).

| File | Role |
|---|---|
| `constants/remoteConfigDefaults.ts` | Typed defaults — edit numbers here |
| `utils/remoteConfig.ts` | `getRemoteConfig()` / `applyRemoteConfigOverrides()` / reset |
| Debug → Remote Config | Reset / copy JSON / re-fetch stub |

**Pattern:** APK always works offline on defaults. Later: fetch Firebase (or JSON) → `applyRemoteConfigOverrides(partial)`.

### Key inventory (shipped defaults)

**Ads**
| Key | Default |
|---|---|
| `ads.enabled` | `true` (kill switch) |
| `ads.interstitialMinPlayerLevel` | `5` |
| `ads.interstitialMinActivePlaytimeMs` | `8 min` |
| `ads.interstitialCooldownMs` | `3 min` |
| `ads.interstitialCooldownAfterRewardedMs` | `2 min` |
| `ads.interstitialMaxIntervalMs` | `6 min` |
| `ads.interstitialGracePeriodMs` | `60 s` |
| `ads.specialOffer.minGapMs` | `90 s` |
| `ads.specialOffer.anytimeFallbackMs` | `120 s` |
| `ads.specialOffer.quietAfterCloseMs` | `10 s` |
| `ads.specialOffer.storeFreeOfferCooldownMs` | `15 min` |

**Monetization**
| Key | Notes |
|---|---|
| `monetization.prices.*` | Display price strings per store offer id |
| `monetization.iapEnabled.*` | Per-IAP kill switches (`true` = shown) |

**Boosts**
| Key | Notes |
|---|---|
| `boosts.specialOfferDurationSeconds.*` | Rewarded limited-offer lengths (seconds) |
| `boosts.iapDurationMs.*` | IAP / pack grant durations + starter/field countdown lengths |

**Currency / costs**
| Key | Default / notes |
|---|---|
| `currency.upgradeCosts.*` | Curve: `initialCostBase`, `unlockLevelMultiplier`, per-upgrade `scaleByUpgradeId`, plot expansion |
| `currency.goldenPotUnlockCostByPlant` | Plant tiers 1–20 (shared across gardens) |
| `currency.newGardenUnlockCost` | `250_000` |
| `currency.maxOfflineEarningsHours` | `3` |

> Rate Us soft-dismiss / post-ad cooldown and notification timing live in dedicated modules (`utils/rateUsDismiss.ts`, `constants/localNotificationSettings.ts`), not this remote-config object — call out if Genesis should fold them in.

---

## 11 · Analytics (Prompt 1)

**Plan + CSV:** `docs/analytics/pocket_garden_analytics_events.csv`  
**Stubs:** `utils/analytics.ts`, `constants/analyticsEvents.ts`

**Progress rule:** single parameterized `level_complete` with `level` + `milestone` boolean.  
**Purchases / ad revenue:** never via AppsFlyer `logEvent` (noted in CSV).  
**Prompt 2:** Genesis wires AF + FB + Firebase into the stub sink.  
**Prompt 3:** Arena adds devtodev + TikTok after live.

---

## 12 · Open questions / notes

- Banner / interstitial / rewarded = **placeholders** (timing + bridges ready; real SDK = Genesis — see **§3** / **§3b**).  
- Bundle ID / IAP uniformization applied (`pocketgarden`); analytics/Facebook keys still empty placeholders.  
- Remote config Firebase fetch not wired — local defaults only until Genesis.  
- Rate Us vs interstitial policy: intentional — see **Things different from Notion’s checklist**.  
- Time-based / mixed IAP policy: see **§13** and **§14** (also listed in divergences).  
- Notifications day 0–15 + silent channel: **done** (§9).

---

## 13 · Time-based IAP (Notion §11)

**Notion guideline:** time-based IAP must be **absent** (no subscriptions / no selling timed access as the product).

**What Pocket Garden ships (prototype):**
| Offer | What the player buys | Duration |
|---|---|---|
| `store_no_ads` / Remove Ads | Forced-ads mute as a **boost** | **7 days** (`boosts.iapDurationMs.store_iap_remove_ads`) |
| Starter / Field pack grants | Remove Ads portion of pack | **24 hours** |
| Harvester / coin boosts | Timed Double Coins (etc.) | 30m / 2h / 24h / pack tables |

**Handoff stance for the next person:**  
These are **timed boost grants**, not Play Billing subscriptions. Notion still flags “time-based IAP” — for live store SKUs, prefer a **permanent** Remove Ads non-consumable (or confirm with Arena that timed mute boosts are allowed in this prototype). Documented here so QA / Arena don’t treat it as an accidental miss.

**Code:** `offers.ts`, `constants/remoteConfigDefaults.ts` → `boosts.iapDurationMs`, Owned CTA while boost active.

---

## 14 · Mixed IAPs — remove-ads + currency/boosts (Notion §11)

**Notion guideline:** do **not** mix permanent remove-ads with currency (or other rewards) in **one** store product.

**What Pocket Garden ships (prototype):**
| Offer | Contents |
|---|---|
| Starter Pack | Remove Ads **+** Double Coins **+** Rapid Harvest |
| Field Pack | Same mixed stack |
| Harvester Pack | Longer Remove Ads **+** boosts |

Standalone `store_no_ads` is remove-ads only (OK). Coin boost rows are currency/boost only (OK).

**Handoff stance for the next person:**  
Mixed packs are intentional soft-launch conversion hooks. For Notion §11 Pass on live products, split into separate SKUs (e.g. permanent Remove Ads vs coin packs) **or** get an Arena prototype exception in writing. Until then, keep the current pack UX; do not silently delete packs without product sign-off.

**Code:** `offers.ts` → `iapBoostGrants` / bundle configs; store SKUs in `utils/iapProducts.ts`.
