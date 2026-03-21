# Coin income sources & Double Coins buff

When **Double Coins** is active (`hasActiveDoubleCoinsBoost` in `offers.ts`), **`applyDoubleCoinsVisualAmount`** (also in `offers.ts`) scales **displayed** amounts and flying-coin `value` fields (×2, rounded). **Wallet handlers add the particle/panel value as-is** — no second multiply at impact.

Detection uses numeric **`endTime`**, case-insensitive **`offerId`**, **or** coin-multiplier **icon** paths. `setActiveBoosts` uses **`flushSync`** so the ref matches boosts before same-tick rAF wallet batches.

## Credited at face value (number already includes Double Coins when buff was on at spawn)

| Source | Mechanism |
|--------|-----------|
| **Seed / harvest surplus** | `CoinPanel` `value` set with `applyDoubleCoinsVisualAmount` → `onImpact` adds total |
| **Surplus sales / merge-harvest coins** | same |
| **Plant order completion** | Completed goal label + `GoalCoinParticle` `value` use visual 2× → `onImpact` adds `finalValue` (happy-customer roll may still ×2 wallet) |
| **Discovery popup** | `rewardAmount` + particle `value` use visual 2× → `onImpact` adds value |
| **Coin goal (watch-ad tile)** | *Excluded* — base × happiest only, no shop Double Coins on label or particle |

## Explicitly excluded from shop Double Coins

| Source | Reason |
|--------|--------|
| **Offline earnings** (welcome-back bank) | No ×2 **at collect** from the *current* header buff. Offline **simulation** already adds 2× surplus per event when Double Coins was active at that simulated time (`hasActiveDoubleCoinsBoostAt` in `offlineSimulate.ts`) |
| **Rewarded coin goal** (5th slot) | `skipDoubleCoinsMultiplier` spawn path; label/particle stay base × happiest only |
| **Pause menu “Add money” / dev `onAddMoney`** | Raw amount (cheat) |

## Offline note

`pendingOfflineEarnings` is the total from save + offline simulation. Surplus lines in the sim use the same per-coin base as live play and apply **2× when Double Coins was active** at each simulated recharge time. The popup/collect path does **not** apply the *current* header buff again on the whole bank.
