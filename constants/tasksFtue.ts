/** DOM id on the tasks floating button wrapper — used for FTUE hole measurement. */
export const TASKS_FTUE_FLOATING_BUTTON_ID = 'tasks-ftue-floating-button';

/** Claim FTUE — green Claim button on a task row (`taskId` suffix). */
export function getTasksFtueClaimButtonId(taskId: string): string {
  return `tasks-ftue-claim-button-${taskId}`;
}

/** Claim FTUE — orange Claim 2x button on a task row (`taskId` suffix). */
export function getTasksFtueClaim2xButtonId(taskId: string): string {
  return `tasks-ftue-claim-2x-button-${taskId}`;
}

/** Legacy single-row ids (L6 intro claim still uses these when only one target). */
export const TASKS_FTUE_CLAIM_BUTTON_ID = 'tasks-ftue-claim-button';
export const TASKS_FTUE_CLAIM_2X_BUTTON_ID = 'tasks-ftue-claim-2x-button';
