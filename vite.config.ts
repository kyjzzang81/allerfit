import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/logo.png', '_redirects'],
      manifest: {
        name: '알러핏 AllerFit',
        short_name: '알러핏',
        description:
          '설정한 알레르기 성분을 기준으로 프랜차이즈 메뉴를 확인하는 서비스입니다.',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        categories: ['food', 'health', 'lifestyle'],
        icons: [
          {
            src: '/assets/logo.png',
            sizes: '1254x1254',
            type: 'image/png',
          },
          {
            src: '/assets/logo.png',
            sizes: '1254x1254',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        globIgnores: ['**/assets/menus/**', '**/assets/brands/**'],
        runtimeCaching: [
          {
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin &&
              (url.pathname.startsWith('/assets/menus/') ||
                url.pathname.startsWith('/assets/brands/')),
            handler: 'CacheFirst',
            options: {
              cacheName: 'allerfit-food-images',
              expiration: {
                maxEntries: 160,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'allerfit-supabase-rest',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 6,
              },
            },
          },
        ],
      },
    }),
  ],
});
