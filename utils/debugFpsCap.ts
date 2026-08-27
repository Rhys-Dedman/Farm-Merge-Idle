/**
 * Optional Debug Menu FPS cap (20–60). null = normal (perf mode 30 / else 60).
 */
let debugFpsCap: number | null = null;

export function getDebugFpsCap(): number | null {
  return debugFpsCap;
}

export function setDebugFpsCap(fps: number | null): void {
  if (fps == null) {
    debugFpsCap = null;
    return;
  }
  const stepped = Math.round(fps / 5) * 5;
  debugFpsCap = Math.max(20, Math.min(60, stepped));
}

export function getEffectiveFrameMs(): number {
  const cap = debugFpsCap;
  if (cap != null && cap > 0) return 1000 / cap;
  return 0; // caller uses default path
}
