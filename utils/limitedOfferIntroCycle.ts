import {
  LIMITED_OFFERS,
  type LimitedOfferConfig,
  isCoinMultiplierBoostId,
  isStorePremiumOnlyOfferId,
} from '../offers';

/** Popup-offer ids the player must see once before repeats / soft-only mode (excludes IAP-only rows). */
export const LIMITED_OFFER_INTRO_CYCLE_SEEN_IDS_KEY = 'limited_offer_intro_popup_seen_ids_v1';
export const LIMITED_OFFER_INTRO_CYCLE_COMPLETE_KEY = 'limited_offer_intro_cycle_complete_v1';

/**
 * Rewarded-ad offers that participate in the intro popup cycle and post-intro soft hints.
 * Add/remove entries in `LIMITED_OFFERS` — IAP-only and coin-multiplier rows stay excluded here.
 */
export function getLimitedOfferAutoPopupPool(): LimitedOfferConfig[] {
  return LIMITED_OFFERS.filter(
    (o) => !isStorePremiumOnlyOfferId(o.id) && !isCoinMultiplierBoostId(o.id),
  );
}

function getLimitedOfferAutoPopupPoolIds(): Set<string> {
  return new Set(getLimitedOfferAutoPopupPool().map((o) => o.id));
}

function pruneSeenIdsToPool(seen: Set<string>, poolIds: Set<string>): Set<string> {
  return new Set([...seen].filter((id) => poolIds.has(id)));
}

export function markLimitedOfferIntroCycleComplete(): void {
  try {
    localStorage.setItem(LIMITED_OFFER_INTRO_CYCLE_COMPLETE_KEY, '1');
  } catch {
    /* ignore */
  }
}

function clearLimitedOfferIntroCycleCompleteFlag(): void {
  try {
    localStorage.removeItem(LIMITED_OFFER_INTRO_CYCLE_COMPLETE_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated Prefer `isLimitedOfferIntroCycleComplete()` — flag alone can be stale after catalog changes. */
export function readLimitedOfferIntroCycleComplete(): boolean {
  try {
    return localStorage.getItem(LIMITED_OFFER_INTRO_CYCLE_COMPLETE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * True when every offer in the **current** auto-popup pool has been shown once.
 * Recomputed from catalog + seen ids so new/removed offers do not require manual migration.
 */
export function isLimitedOfferIntroCycleComplete(): boolean {
  const pool = getLimitedOfferAutoPopupPool();
  if (pool.length === 0) return true;
  const poolIds = getLimitedOfferAutoPopupPoolIds();
  const seen = pruneSeenIdsToPool(readLimitedOfferIntroSeenIds(), poolIds);
  return pool.every((o) => seen.has(o.id));
}

/** Prune stale seen ids and sync the persisted complete flag with the current pool. */
export function syncLimitedOfferIntroCyclePersistedState(): void {
  const poolIds = getLimitedOfferAutoPopupPoolIds();
  const seen = pruneSeenIdsToPool(readLimitedOfferIntroSeenIds(), poolIds);
  writeLimitedOfferIntroSeenIds(seen);
  if (isLimitedOfferIntroCycleComplete()) {
    markLimitedOfferIntroCycleComplete();
  } else {
    clearLimitedOfferIntroCycleCompleteFlag();
  }
}

/** First intro popup not yet shown, in catalog order (triggers ignored during intro). */
export function getNextLimitedOfferIntroPopup(): LimitedOfferConfig | null {
  const pool = getLimitedOfferAutoPopupPool();
  const poolIds = getLimitedOfferAutoPopupPoolIds();
  const seen = pruneSeenIdsToPool(readLimitedOfferIntroSeenIds(), poolIds);
  return pool.find((o) => !seen.has(o.id)) ?? null;
}

export function readLimitedOfferIntroSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIMITED_OFFER_INTRO_CYCLE_SEEN_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function writeLimitedOfferIntroSeenIds(seen: Set<string>): void {
  try {
    localStorage.setItem(LIMITED_OFFER_INTRO_CYCLE_SEEN_IDS_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

/** Call when the limited-offer popup is shown (notification counts; activation does not). */
export function markLimitedOfferIntroPopupSeen(offerId: string): void {
  const poolIds = getLimitedOfferAutoPopupPoolIds();
  if (!poolIds.has(offerId)) return;
  const seen = pruneSeenIdsToPool(readLimitedOfferIntroSeenIds(), poolIds);
  seen.add(offerId);
  writeLimitedOfferIntroSeenIds(seen);
  syncLimitedOfferIntroCyclePersistedState();
}

export function clearLimitedOfferIntroCycle(): void {
  try {
    localStorage.removeItem(LIMITED_OFFER_INTRO_CYCLE_SEEN_IDS_KEY);
    localStorage.removeItem(LIMITED_OFFER_INTRO_CYCLE_COMPLETE_KEY);
  } catch {
    /* ignore */
  }
}
