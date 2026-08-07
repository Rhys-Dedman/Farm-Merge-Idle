/**
 * Golden pots are no longer bought on the collection screen — they come from Special Delivery
 * trophies — so the `collection_upgrade` daily task can never be completed and never rolls.
 */
export function canRollGoldenPotDailyTask(
  _garden1PlayerLevel: number,
  _goldenPotUpgradeableCount: number,
): boolean {
  return false;
}
