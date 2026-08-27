/**
 * Offline / VPN gate — Arena §10: don't allow play offline or on VPN;
 * show a friendly reminder to keep internet ON.
 */
import { Capacitor } from '@capacitor/core';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { isVpnActive } from './vpnCheck';

export type NetworkGateReason = 'offline' | 'vpn' | 'unreachable' | null;

export type NetworkGateSnapshot = {
  blocked: boolean;
  reason: NetworkGateReason;
};

const REACHABILITY_URL = 'https://www.gstatic.com/generate_204';
const REACHABILITY_TIMEOUT_MS = 4500;
const POLL_MS = 4000;
const BYPASS_KEY = 'pg_network_gate_bypass';

type Listener = (snap: NetworkGateSnapshot) => void;

let listeners = new Set<Listener>();
let started = false;
let pollTimer: number | null = null;
let networkListenerHandle: { remove: () => Promise<void> } | null = null;
let lastSnap: NetworkGateSnapshot = { blocked: false, reason: null };
let bypassEnabled = false;

function readBypass(): boolean {
  try {
    return localStorage.getItem(BYPASS_KEY) === '1';
  } catch {
    return false;
  }
}

export function getNetworkGateBypass(): boolean {
  return bypassEnabled;
}

export function setNetworkGateBypass(enabled: boolean): void {
  bypassEnabled = enabled;
  try {
    if (enabled) localStorage.setItem(BYPASS_KEY, '1');
    else localStorage.removeItem(BYPASS_KEY);
  } catch {
    /* ignore */
  }
  void refreshNetworkGate();
}

async function probeReachable(): Promise<boolean> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), REACHABILITY_TIMEOUT_MS);
  try {
    const res = await fetch(REACHABILITY_URL, {
      method: 'GET',
      cache: 'no-store',
      mode: 'no-cors',
      signal: ctrl.signal,
    });
    // no-cors → opaque; reaching here without throw means the request left the device.
    void res;
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(t);
  }
}

function emit(snap: NetworkGateSnapshot): void {
  lastSnap = snap;
  listeners.forEach((fn) => {
    try {
      fn(snap);
    } catch {
      /* ignore */
    }
  });
}

async function evaluate(): Promise<NetworkGateSnapshot> {
  if (!Capacitor.isNativePlatform()) {
    return { blocked: false, reason: null };
  }
  if (bypassEnabled) {
    return { blocked: false, reason: null };
  }

  let status: ConnectionStatus | null = null;
  try {
    status = await Network.getStatus();
  } catch {
    status = null;
  }

  const offline =
    !status ||
    status.connected !== true ||
    status.connectionType === 'none';

  if (offline) {
    return { blocked: true, reason: 'offline' };
  }

  let vpn = false;
  try {
    vpn = await isVpnActive();
  } catch {
    vpn = false;
  }
  if (vpn) {
    return { blocked: true, reason: 'vpn' };
  }

  const reachable = await probeReachable();
  if (!reachable) {
    return { blocked: true, reason: 'unreachable' };
  }

  return { blocked: false, reason: null };
}

export async function refreshNetworkGate(): Promise<NetworkGateSnapshot> {
  const snap = await evaluate();
  emit(snap);
  return snap;
}

export function getNetworkGateSnapshot(): NetworkGateSnapshot {
  return lastSnap;
}

export function subscribeNetworkGate(listener: Listener): () => void {
  listeners.add(listener);
  listener(lastSnap);
  return () => {
    listeners.delete(listener);
  };
}

/** Start native monitoring (no-op on web/desktop Vite). */
export async function startNetworkGateMonitor(): Promise<void> {
  if (started) return;
  started = true;
  bypassEnabled = readBypass();

  if (!Capacitor.isNativePlatform()) {
    emit({ blocked: false, reason: null });
    return;
  }

  try {
    networkListenerHandle = await Network.addListener('networkStatusChange', () => {
      void refreshNetworkGate();
    });
  } catch {
    networkListenerHandle = null;
  }

  await refreshNetworkGate();
  pollTimer = window.setInterval(() => {
    void refreshNetworkGate();
  }, POLL_MS);
}

export function stopNetworkGateMonitor(): void {
  if (pollTimer != null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
  if (networkListenerHandle) {
    void networkListenerHandle.remove();
    networkListenerHandle = null;
  }
  started = false;
}
