import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Story 0.3 — Sentry source maps upload (no-op se SENTRY_AUTH_TOKEN ausente)
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sentryAuthToken && sentryOrg && sentryProject
      ? sentryVitePlugin({
          authToken: sentryAuthToken,
          org: sentryOrg,
          project: sentryProject,
          release: { name: process.env.VITE_RELEASE ?? 'dev' },
          sourcemaps: {
            // upload + delete local após upload — não servir .map publicamente
            filesToDeleteAfterUpload: '**/*.map',
          },
          telemetry: false,
        })
      : undefined,
    VitePWA({
      // Remove the legacy app-wide service worker so public customer links never open stale builds.
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'mx-logo.png'],
      manifest: {
        name: 'MX PERFORMANCE',
        short_name: 'MX PERFORMANCE',
        description: 'Plataforma operacional da MX Consultoria para visitas e sincronizacao autorizada com Google Calendar',
        theme_color: '#0D3B2E',
        background_color: '#0D3B2E',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        categories: ['business', 'productivity'],
        icons: [
          { src: '/mx-logo.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/mx-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: 'Fechamento Diário', short_name: 'Fechamento', url: '/lancamento-diario', description: 'Registrar fechamento diário' },
          { name: 'Classificação', short_name: 'Classificação', url: '/classificacao', description: 'Ver classificação ao vivo' },
          { name: 'Home', short_name: 'Home', url: '/home', description: 'Tela inicial' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        globIgnores: ['**/vendor-html2pdf*.js', '**/vendor-html2canvas*.js', '**/vendor-jspdf*.js', '**/vendor-charts*.js', '**/vendor-export*.js'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/pre-cadastro(?:\/|$)/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('supabase.co') && url.pathname.includes('/storage/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/assets/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'static-assets' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // Source maps necessários para Sentry decoder; arquivo .map é uploadado e removido do output público
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('react-router-dom') || /node_modules\/react\//.test(id)) return 'vendor-react';
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) return 'vendor-utils';
          if (id.includes('lucide-react') || id.includes('motion') || id.includes('sonner')) return 'vendor-ui';
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('xlsx')) return 'vendor-export';
          if (id.includes('html2canvas')) return 'vendor-html2canvas';
          if (id.includes('html2pdf.js')) return 'vendor-html2pdf';
          if (id.includes('jspdf')) return 'vendor-jspdf';
          if (id.includes('@supabase/supabase-js')) return 'vendor-supabase';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
