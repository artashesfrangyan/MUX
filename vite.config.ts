import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const fsdAliases = {
  '@app': r('src/app'),
  '@pages': r('src/pages'),
  '@widgets': r('src/widgets'),
  '@features': r('src/features'),
  '@entities': r('src/entities'),
  '@shared': r('src/shared'),
};

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: fsdAliases,
  },
  server: {
    port: 5173,
    host: true,
  },
});
