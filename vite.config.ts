/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH permite publicar en GitHub Pages (https://<usuario>.github.io/tailor-test/).
// En local se sirve desde la raíz.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Tailor-test · Tests a medida',
        short_name: 'Tailor-test',
        description:
          'Prepara exámenes tipo test de cualquier materia: razonamiento verbal, numérico, abstracto y tus propios temas.',
        lang: 'es',
        theme_color: '#1f4e79',
        background_color: '#f7f8fa',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
