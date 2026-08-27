/**
 * Debug Menu mutations live here as a typed handler contract.
 * UI (DebugMenu.tsx) only wires buttons — no inline game mutations.
 */
import type { DebugMenuTabId } from '../constants/debugMenu';

export type DebugRuleMode = 'normal' | 'force';

export type DebugActionDef = {
  id: string;
  tab: DebugMenuTabId;
  label: string;
  /** Search keywords */
  keywords?: string;
  mode: DebugRuleMode;
  /** Requires a second tap to confirm */
  destructive?: boolean;
  /** Handler key on DebugHandlers */
  run: keyof DebugHandlers;
  /** Hide when handler missing / returns false from enabled() */
  enabled?: (h: DebugHandlers) => boolean;
};

/**
 * All Dev Tools side-effects App must provide.
 * Keep implementations in App (or helpers it owns); this file only types + catalogs them.
 */
export type DebugHandlers = {
  exitDebugMode: () => void;
  disableDevTools: () => void;

  // Profiles / diagnostics
  saveNamedProfile: (name: string) => void;
  reloadFreshPostFtue: () => void;
  copySaveJson: () => void;
  copyReproSummary: () => void;
  importSaveJsonPrompt: () => void;

  // Economy
  addCoins: (amount: number) => void;
  clearCoins: () => void;
  addKeys: (amount: number) => void;
  clearKeys: () => void;

  // Progress
  levelUp: () => void;
  unlockPlant: () => void;
  goldenPot: () => void;
  skipTutorial: () => void;
  completeNextDaily: () => void;
  resetDailies: () => void;
  clearShed: () => void;
  clearBoosts: () => void;
  cycleGarden: () => void;
  completeFtueForce: () => void;

  // Ads
  toggleInterstitialBypass: () => void;
  getInterstitialBypass: () => boolean;
  testAdBreak: () => void;
  openRewardedOffer: () => void;
  resetAdCooldowns: () => void;
  grantStarterPack: () => void;
  grantFieldPack: () => void;
  grantRemoveAds: () => void;
  resetPurchasedIaps: () => void;

  // Popups
  previewCorruptSave: () => void;
  clearRatingFlags: () => void;
  openRateUs: () => void;
  openDailyTasks: () => void;
  openGardenPicker: () => void;
  openOfflineEarnings: () => void;
  openStarterPackOffer: () => void;
  openFieldPackOffer: () => void;
  openNoAdsOffer: () => void;
  openLevelUpPopup: () => void;

  // Rewards
  completeAllDailies: () => void;
  claimReadyDailies: () => void;

  // Notifications
  forceReturnReminderIn2Min: () => void;

  // Haptics
  toggleHaptics: () => void;
  getHapticsEnabled: () => boolean;
  fireHapticTap: () => void;
  fireHapticSoft: () => void;
  fireHapticSuccess: () => void;
  startHapticHeartbeat: () => void;
  stopHapticHeartbeat: () => void;

  // Performance
  togglePerformanceMode: () => void;
  getPerformanceMode: () => boolean;
  setFpsCap: (fps: number | null) => void;
  getFpsCap: () => number | null;
  toggleFakeNotch: () => void;
  getFakeNotch: () => boolean;

  // Remote config
  resetRemoteConfig: () => void;
  copyRemoteConfigJson: () => void;
  refetchRemoteConfig: () => void;

  // Presets
  applyPresetFreshPostOnboarding: () => void;
  applyPresetMidgame: () => void;
  applyPresetAdLab: () => void;

  // Progress reset
  clearProgressKeepFtueDone: () => void;
  wipeAllProgressFullFtue: () => void;
};

export const DEBUG_ACTION_CATALOG: DebugActionDef[] = [
  // Profiles
  { id: 'exit', tab: 'profiles', label: 'Exit debug mode', mode: 'normal', run: 'exitDebugMode' },
  { id: 'disable', tab: 'profiles', label: 'Disable Dev Tools unlock', mode: 'force', run: 'disableDevTools' },
  { id: 'fresh', tab: 'profiles', label: 'Reset to fresh post-FTUE', mode: 'force', destructive: true, run: 'reloadFreshPostFtue' },
  { id: 'import', tab: 'profiles', label: 'Import save JSON…', mode: 'force', destructive: true, run: 'importSaveJsonPrompt' },

  // Economy
  { id: 'coins1m', tab: 'economy', label: '+1M coins', mode: 'force', run: 'addCoins', keywords: 'money wallet' },
  { id: 'coins0', tab: 'economy', label: 'Reset coins to 0', mode: 'force', destructive: true, run: 'clearCoins' },
  { id: 'keys10', tab: 'economy', label: '+10 keys', mode: 'force', run: 'addKeys' },
  { id: 'keys0', tab: 'economy', label: 'Reset keys to 0', mode: 'force', destructive: true, run: 'clearKeys' },

  // Progress
  { id: 'lvl', tab: 'progress', label: 'Level up (+1 XP goal)', mode: 'normal', run: 'levelUp', keywords: 'xp player' },
  { id: 'plant', tab: 'progress', label: 'Unlock next plant', mode: 'force', run: 'unlockPlant' },
  { id: 'pot', tab: 'progress', label: 'Complete golden pot segment', mode: 'force', run: 'goldenPot' },
  { id: 'skipftue', tab: 'progress', label: 'Skip / complete tutorial', mode: 'force', destructive: true, run: 'skipTutorial' },
  { id: 'ftueforce', tab: 'progress', label: 'Force FTUE complete (no reload)', mode: 'force', run: 'completeFtueForce' },
  { id: 'dailynext', tab: 'progress', label: 'Complete next daily task', mode: 'normal', run: 'completeNextDaily' },
  { id: 'dailyreset', tab: 'progress', label: 'Reset daily tasks', mode: 'force', run: 'resetDailies' },
  { id: 'shed', tab: 'progress', label: 'Clear shed unlocks', mode: 'force', destructive: true, run: 'clearShed' },
  { id: 'boosts', tab: 'progress', label: 'Clear boosts / offers', mode: 'force', run: 'clearBoosts' },
  { id: 'garden', tab: 'progress', label: 'Cycle active garden', mode: 'force', run: 'cycleGarden' },

  // Ads
  { id: 'bypass', tab: 'ads', label: 'Toggle interstitial bypass', mode: 'force', run: 'toggleInterstitialBypass' },
  { id: 'adbreak', tab: 'ads', label: 'Force interstitial now', mode: 'force', run: 'testAdBreak' },
  { id: 'rewarded', tab: 'ads', label: 'Open rewarded offer', mode: 'normal', run: 'openRewardedOffer' },
  { id: 'adcd', tab: 'ads', label: 'Reset ad cooldowns', mode: 'force', run: 'resetAdCooldowns' },
  { id: 'gstarter', tab: 'ads', label: 'Grant Starter Pack', mode: 'force', run: 'grantStarterPack' },
  { id: 'gfield', tab: 'ads', label: 'Grant Field Pack', mode: 'force', run: 'grantFieldPack' },
  { id: 'gnoads', tab: 'ads', label: 'Grant Remove Ads boost', mode: 'force', run: 'grantRemoveAds' },
  { id: 'riap', tab: 'ads', label: 'Reset purchased IAP packs', mode: 'force', destructive: true, run: 'resetPurchasedIaps' },

  // Popups
  { id: 'corrupt', tab: 'popups', label: 'Corrupt save popup', mode: 'force', run: 'previewCorruptSave' },
  { id: 'clearrate', tab: 'popups', label: 'Clear Rate Us flags', mode: 'force', run: 'clearRatingFlags' },
  { id: 'rateus', tab: 'popups', label: 'Open Rate Us', mode: 'force', run: 'openRateUs' },
  { id: 'dailypop', tab: 'popups', label: 'Open Daily Tasks', mode: 'force', run: 'openDailyTasks' },
  { id: 'picker', tab: 'popups', label: 'Open Garden Picker', mode: 'force', run: 'openGardenPicker' },
  { id: 'offline', tab: 'popups', label: 'Open Offline Earnings', mode: 'force', run: 'openOfflineEarnings' },
  { id: 'ostarter', tab: 'popups', label: 'Open Starter Pack offer', mode: 'force', run: 'openStarterPackOffer' },
  { id: 'ofield', tab: 'popups', label: 'Open Field Pack offer', mode: 'force', run: 'openFieldPackOffer' },
  { id: 'onoads', tab: 'popups', label: 'Open Remove Ads offer', mode: 'force', run: 'openNoAdsOffer' },
  { id: 'olvl', tab: 'popups', label: 'Open Level Up popup', mode: 'force', run: 'openLevelUpPopup' },

  // Rewards
  { id: 'alldaily', tab: 'rewards', label: 'Complete all dailies', mode: 'force', run: 'completeAllDailies' },
  { id: 'claimdaily', tab: 'rewards', label: 'Claim ready dailies (Normal Rules)', mode: 'normal', run: 'claimReadyDailies' },

  // Notifications
  { id: 'notif2', tab: 'notifications', label: 'Force return reminder (2 min)', mode: 'force', run: 'forceReturnReminderIn2Min' },

  // Haptics
  { id: 'haptog', tab: 'haptics', label: 'Toggle haptics (mirrors Settings)', mode: 'normal', run: 'toggleHaptics' },
  { id: 'haptap', tab: 'haptics', label: 'Fire tap', mode: 'force', run: 'fireHapticTap' },
  { id: 'hapsoft', tab: 'haptics', label: 'Fire soft impact', mode: 'force', run: 'fireHapticSoft' },
  { id: 'hapsucc', tab: 'haptics', label: 'Fire success', mode: 'force', run: 'fireHapticSuccess' },
  { id: 'hapheart', tab: 'haptics', label: 'Start heartbeat loop', mode: 'force', run: 'startHapticHeartbeat' },
  { id: 'hapstop', tab: 'haptics', label: 'Stop heartbeat', mode: 'force', run: 'stopHapticHeartbeat' },

  // Presets
  { id: 'pfresh', tab: 'presets', label: 'Preset: fresh post-onboarding', mode: 'force', destructive: true, run: 'applyPresetFreshPostOnboarding' },
  { id: 'pmid', tab: 'presets', label: 'Preset: midgame', mode: 'force', destructive: true, run: 'applyPresetMidgame' },
  { id: 'pad', tab: 'presets', label: 'Preset: ad lab', mode: 'force', destructive: true, run: 'applyPresetAdLab' },

  // Remote
  { id: 'rreset', tab: 'remote', label: 'Reset remote config to defaults', mode: 'force', run: 'resetRemoteConfig' },
  { id: 'rcopy', tab: 'remote', label: 'Copy remote config JSON', mode: 'normal', run: 'copyRemoteConfigJson' },
  { id: 'rrefetch', tab: 'remote', label: 'Re-fetch remote config', mode: 'normal', run: 'refetchRemoteConfig' },

  // Game-specific
  { id: 'notch', tab: 'game', label: 'Toggle fake notch preview', mode: 'force', run: 'toggleFakeNotch' },

  // Diagnostics
  { id: 'copysave', tab: 'diagnostics', label: 'Copy current save JSON', mode: 'normal', run: 'copySaveJson' },
  { id: 'copyrepro', tab: 'diagnostics', label: 'Copy repro summary', mode: 'normal', run: 'copyReproSummary' },

  // Reset
  { id: 'clearprog', tab: 'reset', label: 'Clear progress (keep FTUE done)', mode: 'force', destructive: true, run: 'clearProgressKeepFtueDone' },
  { id: 'wipe', tab: 'reset', label: 'Wipe all + full FTUE restart', mode: 'force', destructive: true, run: 'wipeAllProgressFullFtue' },
];

export function actionsForTab(tab: DebugMenuTabId, query: string, handlers: DebugHandlers): DebugActionDef[] {
  const q = query.trim().toLowerCase();
  return DEBUG_ACTION_CATALOG.filter((a) => {
    if (a.tab !== tab) return false;
    if (a.enabled && !a.enabled(handlers)) return false;
    if (!q) return true;
    const hay = `${a.label} ${a.keywords ?? ''} ${a.id}`.toLowerCase();
    return hay.includes(q);
  });
}
