/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(), 
    VitePWA({ 
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/entrenadores/me/team'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pokemon-team-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 24 * 60 * 60, // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/auth/me'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pokemon-profile-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 24 * 60 * 60, // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
      manifest: {
        name: 'Pokémon Trainer App',
        short_name: 'PokéTrainer',
        description: 'Aplica para entrenar y capturar Pokémon usando códigos QR',
        theme_color: '#3b82f6',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['games', 'entertainment'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
});