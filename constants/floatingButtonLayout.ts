/** Page header block: pt-4 + pb-2 + inner row min-h 44 + py-2. */
export const FLOATING_BUTTON_TOP_UI_HEIGHT_PX = 84;
/** Goals row height in the farm column. */
export const FLOATING_BUTTON_GOALS_HEIGHT_PX = 85;
/** Gap between goals and the first floating button. */
export const FLOATING_BUTTON_STACK_GAP_BELOW_GOALS_PX = 4;
/** Extra vertical offset applied after header + goals (negative moves the stack up). */
export const FLOATING_BUTTON_STACK_TOP_NUDGE_PX = -32;
/** Left inset for the floating button stack (matches header cluster). */
export const FLOATING_BUTTON_STACK_LEFT_PX = 4;
/** Right inset for the floating button stack. */
export const FLOATING_BUTTON_STACK_RIGHT_PX = 4;
/** Vertical spacing between stacked floating buttons. */
export const FLOATING_BUTTON_STACK_ITEM_GAP_PX = 8;

export const FLOATING_BUTTON_STACK_TOP_PX =
  FLOATING_BUTTON_TOP_UI_HEIGHT_PX +
  FLOATING_BUTTON_GOALS_HEIGHT_PX +
  FLOATING_BUTTON_STACK_GAP_BELOW_GOALS_PX +
  FLOATING_BUTTON_STACK_TOP_NUDGE_PX;
