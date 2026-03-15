import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [vue()],
  server: {
    port: 4301,
    host: 'localhost',
  },
  build: {
    outDir: resolve(rootDir, 'dist'),
    emptyOutDir: true,
  },
});
