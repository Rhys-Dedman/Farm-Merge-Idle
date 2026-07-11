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
  plugins: {
    LocalNotifications: {
      /** Android status-bar icon (drawable name, no extension). Same art as app icon. */
      smallIcon: 'ic_stat_pocket_garden',
      iconColor: '#92c14c',
    },
  },
};

export default config;
