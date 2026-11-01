import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command }) => ({
  // Served from whalegames.net/drunken-robot/ (a component of the whalegames app, which holds every static game), so
  // every built URL carries that prefix. Dev (`vite`) and tests still run at the root.
  base: command === 'build' ? '/drunken-robot/' : '/',
  resolve: {
    alias: {
      '@audio': fileURLToPath(new URL('./src/audio', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url)),
      '@state': fileURLToPath(new URL('./src/state', import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      output: {
        // Keep the two big vendor libraries in their own long-cached chunks.
        codeSplitting: {
          groups: [
            { name: 'phaser', test: /node_modules[\\/]phaser[\\/]/ },
            {
              name: 'tone',
              test: /node_modules[\\/](tone|standardized-audio-context|automation-events)[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
}));
