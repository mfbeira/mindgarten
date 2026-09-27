import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/health': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/ready': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
