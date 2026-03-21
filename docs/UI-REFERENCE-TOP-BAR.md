# UI Reference: Top Bar (PageHeader)

**Locked as correct behaviour** — use this as the reference for size, position, and layout. If top bar or boost UI regresses, compare against this state (this commit / file set).

## Scope

- **PageHeader** (`components/PageHeader.tsx`) — coin wallet, player level, active boosts row, settings
- **ActiveBoostIndicator** (`components/ActiveBoostIndicator.tsx`) — single boost circle (radial progress, stroke, icon)
- **BoostParticle** (`components/BoostParticle.tsx`) — particle from “Activate Reward” to boost slot (rendered inside header left wrapper)
- **App** — Farm: `headerLeftWrapperRef` + `activeBoostAreaRef`; Store: `storeHeaderLeftWrapperRef` + `storeActiveBoostAreaRef` (same boost strip layout as Farm). Boost particles portal into the matching header wrapper.
- **index.html** — `.boost-slide` transition for boost removal

## Key behaviour

- Left section: `marginLeft: 10`, `gap: 18`, `transform: scale(0.88)`, `transformOrigin: 'left center'`, `flex: 1`, `minWidth: 0`, **`overflow: visible`** (coin icon `-ml-3` must not be clipped)
- Bar row: **`padding-right`** reserves width for the absolute FPS + settings dock (no `max-width` / `overflow-x: clip` on the whole cluster — that hid boosts 3–5)
- Store (no level pill): invisible **155×22 spacer** same width as the level bar so the boost strip lines up with Farm
- FPS: **absolute** to the left of the gear, **`z-index: 20`** (below boosts `z-30` so overlapping boosts paint on top; FPS label still clickable via `pointer-events-auto`)
- Settings: **absolute** `right: 12px`, **`z-index: 40`**
- Visible boosts: always up to **5** (`min(active.length, 5)`); extras stay on hidden timers until a slot frees
- Coin panel: wallet **85×22px**; coin amount `pl-[12px]`; icon `-ml-3`; text cream `#fcf0c7`, `text-xs`
- Player level: **155×22px**; goals text `X/X` centered over bar, cream, black stroke 50%, `text-xs`, `z-10`
- Boost area: `marginLeft: -10`, `height: 22`, absolute slots at `left: index * 28` (26px indicator + 2px gap), slide on remove (350ms)
- Boost indicator: 26×26px; pixel offsets; tap opens limited offer in "active" view (brown button, countdown)
- Particle: portal into farm or store `*HeaderLeftWrapperRef`; start/target in wrapper-local coords; target = `boostArea.offsetLeft + slotIndex * 28 + 13`, `offsetTop + 11`. Fake ad: from Activate Reward center. Premium purchase: from Collect button **right** edge (see `App.tsx` `onCollect`).

## Boost system (this save point)

- Tap boost opens LimitedOfferPopup in "active" mode (brown "Active: XXs", X/backdrop close only). `getLimitedOfferContent(offerId)` in App.

## Commit to restore / compare

When locking: commit with message like  
`chore(ui): save point — top bar UI + boost system (wallet 85, level 155, goals X/X, tap boost → active popup)`

Use that commit (or this doc + listed files) as the “correct UI” baseline.
