import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.infinitygames.pocketgarden',
  appName: 'Pocket Garden',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    // Keep bundled assets in the APK; do not point at the Vite dev server for release builds.
    androidScheme: 'https',
  },
};

export default config;
