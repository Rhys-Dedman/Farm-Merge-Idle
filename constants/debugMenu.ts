/**
 * Debug Menu — Infinity Arena horizontal-tabbed QA panel.
 * Flag gating for release builds is 🔵 Genesis; creator unlock is Settings version taps.
 */

export const DEBUG_MENU_TABS = [
  'profiles',
  'performance',
  'economy',
  'progress',
  'ads',
  'popups',
  'rewards',
  'notifications',
  'haptics',
  'presets',
  'remote',
  'game',
  'diagnostics',
  'reset',
] as const;

export type DebugMenuTabId = (typeof DEBUG_MENU_TABS)[number];

export const DEBUG_MENU_TAB_LABELS: Record<DebugMenuTabId, string> = {
  profiles: 'Profiles',
  performance: 'Performance',
  economy: 'Economy',
  progress: 'Progress',
  ads: 'Ads',
  popups: 'Popups',
  rewards: 'Rewards',
  notifications: 'Notifications',
  haptics: 'Haptics',
  presets: 'Presets',
  remote: 'Remote Config',
  game: 'Game-Specific',
  diagnostics: 'Diagnostics',
  reset: 'Progress Reset',
};

/** Tabs with long action lists show a search field. */
export const DEBUG_MENU_SEARCHABLE_TABS: ReadonlySet<DebugMenuTabId> = new Set([
  'economy',
  'progress',
  'ads',
  'popups',
  'rewards',
  'game',
  'presets',
]);
