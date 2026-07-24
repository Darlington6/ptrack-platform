import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      devOptions: { enabled: true, type: 'module' },
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
        // Exclude large assets that bloat the precache
        globIgnores: ['**/node_modules/**', '**/__tests__/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'pTrack — Plastic Waste Tracker',
        short_name: 'pTrack',
        description: 'Track, report, and reduce plastic waste in Kigali',
        theme_color: '#16A34A',
        background_color: '#FFFFFF',
        id: '/dashboard',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/dashboard',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Report Waste',
            url: '/report',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Log Recycling',
            url: '/dashboard?action=recycling',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Leaderboard',
            url: '/leaderboard',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        // Share target — Android users can share photos directly to pTrack
        share_target: {
          action: '/report',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            files: [{ name: 'image', accept: ['image/*'] }],
          },
        },
      } as ManifestOptions & Record<string, unknown>,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 60, functions: 60, branches: 50, statements: 60 },
      exclude: ['node_modules/**', 'src/test/**', '**/*.d.ts', 'src/sw.ts', 'src/vite-env.d.ts'],
    },
  },
});
