import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': r('src/shared'),
      '@entities': r('src/entities'),
      '@features': r('src/features'),
      '@widgets': r('src/widgets'),
      '@pages': r('src/pages'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
