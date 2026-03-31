import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import inkManifest from './vite-plugin-ink-manifest';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), inkManifest()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 3000, open: true },
});
