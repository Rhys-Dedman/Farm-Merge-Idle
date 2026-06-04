import type { RewardedOffer } from '../components/UpgradeList';
import type { LimitedOfferConfig } from '../offers';

/** How long a soft limited-offer row stays in the upgrade panel. */
export const REWARDED_OFFER_PANEL_DURATION_MS = 60 * 1000;

export function getRewardedOfferExpiresAtMs(
  offer: RewardedOffer,
  atTimeMs: number,
): number | null {
  if (typeof offer.expiresAtMs === 'number' && Number.isFinite(offer.expiresAtMs)) {
    return offer.expiresAtMs;
  }
  if (typeof offer.timeRemaining === 'number' && Number.isFinite(offer.timeRemaining)) {
    return atTimeMs + Math.max(0, offer.timeRemaining) * 1000;
  }
  return null;
}

export function getRewardedOfferTimeRemainingSec(
  offer: RewardedOffer,
  atTimeMs = Date.now(),
): number {
  const expiresAtMs = getRewardedOfferExpiresAtMs(offer, atTimeMs);
  if (expiresAtMs == null) return 0;
  return Math.max(0, Math.ceil((expiresAtMs - atTimeMs) / 1000));
}

export function isRewardedOfferExpired(
  offer: RewardedOffer,
  atTimeMs = Date.now(),
): boolean {
  const expiresAtMs = getRewardedOfferExpiresAtMs(offer, atTimeMs);
  if (expiresAtMs == null) return true;
  return expiresAtMs <= atTimeMs;
}

export function normalizeRewardedOfferForSave(
  offer: RewardedOffer,
  atTimeMs = Date.now(),
): RewardedOffer {
  const expiresAtMs = getRewardedOfferExpiresAtMs(offer, atTimeMs);
  if (expiresAtMs == null) return offer;
  const { timeRemaining: _legacy, ...rest } = offer;
  return { ...rest, expiresAtMs };
}

/** Hydrate saves: wall-clock expiry, drop expired rows, keep at most one active offer. */
export function normalizeRewardedOffersForLoad(
  offers: RewardedOffer[],
  atTimeMs = Date.now(),
): RewardedOffer[] {
  const active = offers
    .map((o) => normalizeRewardedOfferForSave(o, atTimeMs))
    .filter((o) => !isRewardedOfferExpired(o, atTimeMs));
  if (active.length === 0) return [];
  active.sort(
    (a, b) =>
      (getRewardedOfferExpiresAtMs(b, atTimeMs) ?? 0) -
      (getRewardedOfferExpiresAtMs(a, atTimeMs) ?? 0),
  );
  return [active[0]];
}

export function hasActiveRewardedOfferInPanel(
  offers: readonly RewardedOffer[],
  atTimeMs = Date.now(),
): boolean {
  return offers.some((o) => !isRewardedOfferExpired(o, atTimeMs));
}

export function pruneExpiredRewardedOffers(
  offers: RewardedOffer[],
  atTimeMs = Date.now(),
  protectedOfferId?: string | null,
): RewardedOffer[] {
  return offers.filter((o) => {
    if (protectedOfferId != null && o.id === protectedOfferId) return true;
    return !isRewardedOfferExpired(o, atTimeMs);
  });
}

export function createRewardedOfferPanelEntry(
  config: Pick<LimitedOfferConfig, 'id' | 'title' | 'headerIcon' | 'description' | 'upgradeTab'>,
  atTimeMs = Date.now(),
): RewardedOffer {
  return {
    id: config.id,
    name: config.title,
    icon: config.headerIcon,
    description: config.description,
    tab: config.upgradeTab,
    expiresAtMs: atTimeMs + REWARDED_OFFER_PANEL_DURATION_MS,
  };
}
