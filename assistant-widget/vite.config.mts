import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/assistant-widget.js',
        chunkFileNames: 'assets/assistant-widget.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/assistant-widget.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
