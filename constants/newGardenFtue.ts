/** First garden purchase FTUE — shown once when the player buys garden 2. */
export type NewGardenFtuePhase = 'picker_view' | 'welcome' | 'point_gardens_fb';

const PHASES: NewGardenFtuePhase[] = ['picker_view', 'welcome', 'point_gardens_fb'];

export function parseNewGardenFtuePhase(raw: unknown): NewGardenFtuePhase | null {
  if (typeof raw !== 'string') return null;
  return PHASES.includes(raw as NewGardenFtuePhase) ? (raw as NewGardenFtuePhase) : null;
}

/** View button in garden picker (FTUE 1). */
export const NEW_GARDEN_FTUE_VIEW_BUTTON_ID = 'new-garden-ftue-view-button';

/** Gardens floating button wrapper (FTUE 3). */
export { GARDENS_FTUE_FLOATING_BUTTON_ID as NEW_GARDEN_FTUE_GARDENS_BUTTON_ID } from './gardensFtue';

/** Block input outside the FTUE hole without dimming the picker. */
export const NEW_GARDEN_FTUE_PICKER_BLOCKER_TINT = 'rgba(0, 0, 0, 0)';

export const NEW_GARDEN_FTUE_WELCOME_TITLE = 'Fruit Garden';
/** Prescale title rem — 4.5rem × 0.5 scale = 2.25rem, matching Settings popup title. */
export const NEW_GARDEN_FTUE_WELCOME_TITLE_FONT_SIZE_REM = 4.5;
export const NEW_GARDEN_FTUE_WELCOME_DESCRIPTION =
  'Fresh soil, fruity surprises, and a whole new crop of plants waiting to be discovered!';
export const NEW_GARDEN_FTUE_GARDENS_TEXT =
  'You can swap between your gardens anytime here';
