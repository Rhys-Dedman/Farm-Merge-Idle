import { assetPath } from './assetPath';
import { loadUserPrefs } from './userPrefs';

export const SFX_IDS = {
  music: 'sfx_music',
  uiConfirmNormal: 'sfx_ui_confirm_normal',
  uiConfirmReward: 'sfx_ui_confirm_reward',
  uiDecline: 'sfx_ui_decline',
  uiUnlockUpgrade: 'sfx_ui_unlockupgrade',
  popupLevelUp: 'sfx_popup_levelup',
  popupPlantDiscovery: 'sfx_popup_plantdiscovery',
  popupNormal: 'sfx_popup_normal',
  coinImpact: 'sfx_coin_impact',
  gameplaySeed: 'sfx_gameplay_seed',
  gameplayNoCharges: 'sfx_gameplay_nocharges',
  gameplayMergeCoins: 'sfx_gameplay_mergecoins',
  gameplayMergeCrops: 'sfx_gameplay_mergecrops',
  gameplayHarvest: 'sfx_gameplay_harvest',
  gameplayPlantSpawn: 'sfx_gameplay_plantspawn',
  gameplayMovePlant: 'sfx_gameplay_moveplant',
  gameplayDeletePlant: 'sfx_gameplay_deleteplant',
  goalImpact: 'sfx_goal_impact',
  goalImpactComplete: 'sfx_goal_impact_complete',
  goalClaim: 'sfx_goal_claim',
  goalSpawnNormal: 'sfx_goal_spawnnormal',
  goalSpawnUndiscovered: 'sfx_goal_spawnundiscovered',
} as const;

export type SfxId = (typeof SFX_IDS)[keyof typeof SFX_IDS];

const SFX_PATHS: Record<SfxId, string> = {
  [SFX_IDS.music]: '/assets/sfx/sfx_music.mp3',
  [SFX_IDS.uiConfirmNormal]: '/assets/sfx/sfx_ui_confirm_normal.wav',
  [SFX_IDS.uiConfirmReward]: '/assets/sfx/sfx_ui_confirm_reward.wav',
  [SFX_IDS.uiDecline]: '/assets/sfx/sfx_ui_decline.wav',
  [SFX_IDS.uiUnlockUpgrade]: '/assets/sfx/sfx_ui_unlockupgrade.wav',
  [SFX_IDS.popupLevelUp]: '/assets/sfx/sfx_popup_levelup.wav',
  [SFX_IDS.popupPlantDiscovery]: '/assets/sfx/sfx_popup_plantdiscovery.wav',
  [SFX_IDS.popupNormal]: '/assets/sfx/sfx_popup_normal.wav',
  [SFX_IDS.coinImpact]: '/assets/sfx/sfx_coin_impact.wav',
  [SFX_IDS.gameplaySeed]: '/assets/sfx/sfx_gameplay_seed.wav',
  [SFX_IDS.gameplayNoCharges]: '/assets/sfx/sfx_gameplay_nocharges.wav',
  [SFX_IDS.gameplayMergeCoins]: '/assets/sfx/sfx_gameplay_mergecoins.wav',
  [SFX_IDS.gameplayMergeCrops]: '/assets/sfx/sfx_gameplay_mergecrops.wav',
  [SFX_IDS.gameplayHarvest]: '/assets/sfx/sfx_gameplay_harvest.wav',
  [SFX_IDS.gameplayPlantSpawn]: '/assets/sfx/sfx_gameplay_plantspawn.wav',
  [SFX_IDS.gameplayMovePlant]: '/assets/sfx/sfx_gameplay_moveplant.wav',
  [SFX_IDS.gameplayDeletePlant]: '/assets/sfx/sfx_gameplay_deleteplant.wav',
  [SFX_IDS.goalImpact]: '/assets/sfx/sfx_goal_impact.wav',
  [SFX_IDS.goalImpactComplete]: '/assets/sfx/sfx_goal_impact_complete.wav',
  [SFX_IDS.goalClaim]: '/assets/sfx/sfx_goal_claim.wav',
  [SFX_IDS.goalSpawnNormal]: '/assets/sfx/sfx_goal_spawnnormal.wav',
  [SFX_IDS.goalSpawnUndiscovered]: '/assets/sfx/sfx_goal_spawnundiscovered.wav',
};

/** Global game audio master volume (applies to all SFX now and future callers of playSfx). */
export const MASTER_AUDIO_VOLUME = 0.5;

const audioTemplateById = new Map<SfxId, HTMLAudioElement>();
const audioBufferById = new Map<SfxId, AudioBuffer>();
let musicAudio: HTMLAudioElement | null = null;
let musicEnabled = true;
let sfxEnabled = true;
/** True while the app/tab is backgrounded, locked, or otherwise not focused. */
let visibilityAudioSuspended = false;
/** True while a fake/real ad presentation is active. */
let adAudioSuspended = false;
let preloadPromise: Promise<void> | null = null;
let audioCtx: AudioContext | null = null;
let unlockHandlersAttached = false;
let appAudioLifecycleInstalled = false;

function isAppAudioSuspended(): boolean {
  return visibilityAudioSuspended || adAudioSuspended;
}

function applyAppAudioSuspendState(): void {
  if (isAppAudioSuspended()) {
    if (musicAudio && !musicAudio.paused) {
      musicAudio.pause();
    }
    if (audioCtx && audioCtx.state === 'running') {
      void audioCtx.suspend().catch(() => {});
    }
    return;
  }
  tryResumeAudioContext();
  tryPlayMusic();
}

function createTemplate(id: SfxId): HTMLAudioElement {
  const audio = new Audio(assetPath(SFX_PATHS[id]));
  audio.preload = 'auto';
  return audio;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function tryResumeAudioContext(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
}

function attachAudioUnlockHandlers(): void {
  if (unlockHandlersAttached || typeof window === 'undefined') return;
  unlockHandlersAttached = true;
  const unlock = () => {
    tryResumeAudioContext();
    tryPlayMusic();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('keydown', unlock);
    unlockHandlersAttached = false;
  };
  window.addEventListener('pointerdown', unlock, { passive: true, once: true });
  window.addEventListener('touchstart', unlock, { passive: true, once: true });
  window.addEventListener('keydown', unlock, { passive: true, once: true });
}

function getMusicAudio(): HTMLAudioElement {
  if (!musicAudio) {
    musicAudio = new Audio(assetPath(SFX_PATHS[SFX_IDS.music]));
    musicAudio.preload = 'auto';
    musicAudio.loop = true;
    musicAudio.volume = MASTER_AUDIO_VOLUME;
  }
  return musicAudio;
}

function tryPlayMusic(): void {
  if (!musicEnabled || isAppAudioSuspended()) return;
  const music = getMusicAudio();
  music.volume = MASTER_AUDIO_VOLUME;
  if (music.paused) {
    void music.play().catch(() => {});
  }
}

/** Pause music + Web Audio while backgrounded (home, lock, alt-tab, app switcher). */
export function suspendAppAudio(): void {
  if (visibilityAudioSuspended) return;
  visibilityAudioSuspended = true;
  applyAppAudioSuspendState();
}

/** Restore audio after returning to the foreground (respects music/SFX prefs + ad mute). */
export function resumeAppAudio(): void {
  if (!visibilityAudioSuspended) return;
  visibilityAudioSuspended = false;
  applyAppAudioSuspendState();
}

/** Pause music + SFX for the duration of an ad (intro / slot / fade plate). */
export function setAdAudioSuspended(suspended: boolean): void {
  if (adAudioSuspended === suspended) return;
  adAudioSuspended = suspended;
  applyAppAudioSuspendState();
}

/**
 * Mute/unmute with document visibility + page lifecycle so Cap WebView / browser
 * stops audio when the app isn't in focus.
 */
export function installAppAudioLifecycle(): void {
  if (appAudioLifecycleInstalled || typeof document === 'undefined') return;
  appAudioLifecycleInstalled = true;

  const syncFromVisibility = () => {
    if (document.visibilityState === 'hidden') suspendAppAudio();
    else resumeAppAudio();
  };

  document.addEventListener('visibilitychange', syncFromVisibility);
  window.addEventListener('pagehide', () => suspendAppAudio());
  window.addEventListener('pageshow', () => {
    if (document.visibilityState === 'visible') resumeAppAudio();
  });
  // Chromium Page Lifecycle (Android WebView / Chrome) — freeze while suspended.
  document.addEventListener('freeze', () => suspendAppAudio());
  document.addEventListener('resume', () => {
    if (document.visibilityState === 'visible') resumeAppAudio();
  });

  syncFromVisibility();
}

const sfxIds = Object.values(SFX_IDS) as SfxId[];
/** Number of SFX load steps tracked by the loading bar. */
export const SFX_PRELOAD_STEP_COUNT = sfxIds.length;

export function preloadSfxAssets(onStepDone?: () => void): Promise<void> {
  if (preloadPromise) return preloadPromise;
  installAppAudioLifecycle();
  attachAudioUnlockHandlers();
  preloadPromise = Promise.all(
    sfxIds.map((id) => {
      return new Promise<void>((resolve) => {
        const audio = createTemplate(id);
        audioTemplateById.set(id, audio);
        const done = () => { onStepDone?.(); resolve(); };
        audio.addEventListener('canplaythrough', done, { once: true });
        audio.addEventListener('error', done, { once: true });
        audio.load();
      });
    })
  )
    .then(() => {
      // Decode SFX into AudioBuffers in the background (low-latency optimisation).
      // Not awaited — game works fine with HTMLAudio fallback until decode finishes.
      const ctx = getAudioContext();
      if (!ctx) return;
      void Promise.all(
        sfxIds.map(async (id) => {
          try {
            const resp = await fetch(assetPath(SFX_PATHS[id]));
            if (!resp.ok) return;
            const arr = await resp.arrayBuffer();
            const buf = await ctx.decodeAudioData(arr.slice(0));
            audioBufferById.set(id, buf);
          } catch {
            // Keep HTMLAudio fallback if decode/fetch fails.
          }
        })
      );
    })
    .then(() => undefined);
  return preloadPromise;
}

export function playSfx(id: SfxId, volume = 1, pitch = 1): void {
  if (isAppAudioSuspended()) return;
  if (id !== SFX_IDS.music && !sfxEnabled) return;
  tryResumeAudioContext();
  const ctx = getAudioContext();
  const gainVolume = Math.max(0, Math.min(1, volume * MASTER_AUDIO_VOLUME));
  const playbackRate = Math.max(0.25, Math.min(4, pitch));
  const decoded = ctx ? audioBufferById.get(id) : undefined;
  if (ctx && decoded) {
    try {
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.playbackRate.value = playbackRate;
      const gain = ctx.createGain();
      gain.gain.value = gainVolume;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
      return;
    } catch {
      // Fall through to HTMLAudio fallback.
    }
  }

  const template = audioTemplateById.get(id) ?? createTemplate(id);
  if (!audioTemplateById.has(id)) {
    audioTemplateById.set(id, template);
  }
  const playback = template.cloneNode(true) as HTMLAudioElement;
  playback.volume = gainVolume;
  playback.playbackRate = playbackRate;
  playback.currentTime = 0;
  void playback.play().catch(() => {});
}

export function setAudioSettings(next: { musicEnabled?: boolean; sfxEnabled?: boolean }): void {
  if (typeof next.musicEnabled === 'boolean') musicEnabled = next.musicEnabled;
  if (typeof next.sfxEnabled === 'boolean') sfxEnabled = next.sfxEnabled;
  if (!musicEnabled) {
    const music = musicAudio;
    if (music && !music.paused) {
      music.pause();
      music.currentTime = 0;
    }
    return;
  }
  tryPlayMusic();
}

export function playMusicLoop(): void {
  installAppAudioLifecycle();
  attachAudioUnlockHandlers();
  tryResumeAudioContext();
  tryPlayMusic();
}

/**
 * Read saved music/sfx preference from localStorage before the full game save is
 * hydrated so that audio unlock handlers respect the player's mute setting during
 * the splash screen.  Also returns the values so React state can initialise from them.
 */
export function applySavedAudioSettingsEarly(): { musicEnabled: boolean; sfxEnabled: boolean } {
  installAppAudioLifecycle();
  const prefs = loadUserPrefs();
  musicEnabled = prefs.musicEnabled;
  sfxEnabled = prefs.sfxEnabled;
  return { musicEnabled: prefs.musicEnabled, sfxEnabled: prefs.sfxEnabled };
}
