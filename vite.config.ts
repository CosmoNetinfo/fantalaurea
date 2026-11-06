import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    injectRegister: null,
    includeAssets: ['favicon.svg', 'favicon.ico', 'icons/*.png', 'brand/*.svg'],
    manifest: {
      id: '/', name: 'FantaLaurea', short_name: 'FantaLaurea', lang: 'it',
      description: 'Il fantasy della tua laurea: squadre, capitani e momenti da ricordare.',
      start_url: '/?source=installed', scope: '/', display: 'standalone',
      background_color: '#faf9f6', theme_color: '#171717', categories: ['games', 'entertainment'],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        { name: 'Le mie lauree', url: '/organizza', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        { name: 'Regolamento', url: '/regole', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      cleanupOutdatedCaches: true,
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/auth\//, /^\/rest\//],
      // Auth, database requests and party data are never cached by the worker.
    },
  })],
  build: { rollupOptions: { output: { manualChunks: { supabase: ['@supabase/supabase-js'] } } } },
  test: { include: ['tests/**/*.test.ts'] },
});
