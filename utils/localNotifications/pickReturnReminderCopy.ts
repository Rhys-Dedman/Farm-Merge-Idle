/**
 * Pick return-reminder copy from slot pools.
 * Avoids the same category twice in a row and recently used bodies.
 */
import {
  REMINDER_COPY_POOLS,
  REMINDER_COPY_POOLS_BY_SLOT,
  RETURN_REMINDER_RECENT_BODY_LIMIT,
  RETURN_REMINDER_TITLE,
  type ReminderCopyCategory,
  type ReminderCopySlot,
} from '../../constants/localNotificationSettings';

export interface PickedReturnReminderCopy {
  category: ReminderCopyCategory;
  title: string;
  body: string;
}

function isReminderCopyCategory(value: string): value is ReminderCopyCategory {
  return value in REMINDER_COPY_POOLS;
}

/** Prefer categories that still have fresh lines; fall back gracefully. */
export function pickReturnReminderCopy(opts: {
  slot: ReminderCopySlot;
  lastCategory: ReminderCopyCategory | null;
  recentBodies: readonly string[];
}): PickedReturnReminderCopy {
  const preferred = REMINDER_COPY_POOLS_BY_SLOT[opts.slot];
  const recentSet = new Set(opts.recentBodies);

  const tryCategories = (categories: readonly ReminderCopyCategory[], requireFreshBody: boolean) => {
    for (const category of categories) {
      const pool = REMINDER_COPY_POOLS[category];
      const fresh = requireFreshBody ? pool.filter((body) => !recentSet.has(body)) : [...pool];
      if (fresh.length === 0) continue;
      // Rotate through fresh lines using recent length as a stable-ish offset.
      const index = opts.recentBodies.length % fresh.length;
      return { category, title: RETURN_REMINDER_TITLE, body: fresh[index]! };
    }
    return null;
  };

  const withoutLast = preferred.filter((c) => c !== opts.lastCategory);
  return (
    tryCategories(withoutLast, true) ??
    tryCategories(preferred, true) ??
    tryCategories(withoutLast, false) ??
    tryCategories(preferred, false) ?? {
      category: 'anytime',
      title: RETURN_REMINDER_TITLE,
      body: REMINDER_COPY_POOLS.anytime[0]!,
    }
  );
}

export function appendRecentReminderBody(
  recentBodies: readonly string[],
  body: string,
  limit: number = RETURN_REMINDER_RECENT_BODY_LIMIT,
): string[] {
  const next = [...recentBodies.filter((b) => b !== body), body];
  return next.slice(-limit);
}

export function parseReminderCopyCategory(raw: unknown): ReminderCopyCategory | null {
  if (typeof raw !== 'string') return null;
  return isReminderCopyCategory(raw) ? raw : null;
}
