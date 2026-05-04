import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ViteImageOptimizer({
      jpg:  { quality: 80 },
      jpeg: { quality: 80 },
      png:  { quality: 80 },
      webp: { lossless: false, quality: 80, alphaQuality: 90 },
      avif: { lossless: false, quality: 65, speed: 4 },
      svg: {
        plugins: [
          { name: 'removeDoctype' },
          { name: 'removeComments' },
          { name: 'removeMetadata' },
          { name: 'removeUselessDefs' },
          { name: 'cleanupIds' },
        ],
      },
      logStats: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui':     ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-recharts':['recharts'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover',
          ],
        },
      },
    },
  },

  // ── Vitest Configuration ──────────────────────────────────────────────────
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/api/**/*.ts',
        'src/app/hooks/**/*.ts',
        'src/app/context/**/*.tsx',
      ],
      exclude: [
        'src/api/api.ts',          // interceptors difficiles à tester
        'src/api/translations.ts', // données statiques
        'node_modules/**',
        'src/test/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },

  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
