import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Em dev o front chama /api/... na mesma origem e o Vite repassa para a API.
    // Assim os cookies httpOnly de auth funcionam sem dor de cabeça com CORS/SameSite.
    proxy: {
      '/api': 'http://localhost:3333',
      // Socket.IO (notificações em tempo real) pela mesma origem, com upgrade para WebSocket
      '/socket.io': { target: 'http://localhost:3333', ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // folga para máquinas carregadas (o padrão é 5 s)
    testTimeout: 15_000,
  },
});
