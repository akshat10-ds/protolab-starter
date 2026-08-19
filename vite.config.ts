import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import inkManifest from './vite-plugin-ink-manifest';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), inkManifest()],
  resolve: {
    alias: {
      '@':    path.resolve(__dirname, './src'),
      '@ink': path.resolve(__dirname, './src/design-system'),
      '@ai':  path.resolve(__dirname, './src/ai-system'),
    },
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
    host: true,
    open: false,
    allowedHosts: true,
  },
});
