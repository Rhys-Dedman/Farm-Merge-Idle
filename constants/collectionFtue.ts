/** Collection FTUE blocker tint: transparent (blocks input but doesn't dim). */
export const COLLECTION_FTUE_BLOCKER_TINT = 'rgba(0, 0, 0, 0)';

/** Visible dim for the post-upgrade “whole row” bonuses FTUE step. */
export const COLLECTION_FTUE_BONUSES_BLOCKER_TINT = 'rgba(0, 0, 0, 0.55)';

/** Copy + button on the post-upgrade bonuses step. */
export const COLLECTION_FTUE_BONUSES_MESSAGE =
  'Upgrading the whole row will unlock a powerful bonus.';

export const COLLECTION_FTUE_PANEL_COPY_ID = 'collection-ftue-panel-copy';
export const COLLECTION_FTUE_BONUSES_CTA_ID = 'collection-ftue-bonuses-cta';
export const COLLECTION_FTUE_SHELF0_REWARD_ICON_ID = 'collection-ftue-shelf0-reward-icon';

export type CollectionFtuePhase =
  | 'intro_cta'
  | 'point_unlock'
  | 'popup_free'
  | 'wait_reveal'
  | 'point_bonuses'
  | 'point_garden_nav';

const PHASES: CollectionFtuePhase[] = [
  'intro_cta',
  'point_unlock',
  'popup_free',
  'wait_reveal',
  'point_bonuses',
  'point_garden_nav',
];

export function parseCollectionFtuePhase(raw: unknown): CollectionFtuePhase | null {
  if (typeof raw !== 'string') return null;
  return PHASES.includes(raw as CollectionFtuePhase) ? (raw as CollectionFtuePhase) : null;
}
