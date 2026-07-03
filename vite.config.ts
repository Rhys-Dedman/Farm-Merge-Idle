import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const repoFromEnv = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
    const prodBase = repoFromEnv ? `/${repoFromEnv}/` : '/';
    const base =
      mode === 'capacitor'
        ? './'
        : mode === 'production'
          ? prodBase
          : '/';
    return {
      // GitHub Pages "project" sites are served at /<repo>/.
      // Capacitor APK uses relative base (`./`) so assets load from the WebView.
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
