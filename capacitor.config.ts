import type { CapacitorConfig } from '@capacitor/cli';
import { APP_NAME, BUNDLE_ID } from './constants/appIdentity';

const config: CapacitorConfig = {
  appId: BUNDLE_ID,
  appName: APP_NAME,
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
