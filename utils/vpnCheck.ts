import { Capacitor, registerPlugin } from '@capacitor/core';

interface VpnCheckPlugin {
  isVpnActive(): Promise<{ active: boolean }>;
}

const VpnCheck = registerPlugin<VpnCheckPlugin>('VpnCheck');

/** Native-only: true when any active network uses TRANSPORT_VPN. */
export async function isVpnActive(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { active } = await VpnCheck.isVpnActive();
    return active === true;
  } catch {
    return false;
  }
}
