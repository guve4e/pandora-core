/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  root: rootDir,
  cacheDir: resolve(rootDir, '../../node_modules/.vite/admin'),

  server: {
    port: 4201,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [vue()],

  build: {
    outDir: resolve(rootDir, 'dist'),
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
    outDir: '../../admin/dist',
    emptyOutDir: true,
  },

  test: {
    name: '@org/admin',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: resolve(rootDir, 'test-output/vitest/coverage'),
      provider: 'v8',
    },
  },
}));
