import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // carrega apps/api/.env.test (banco de teste na porta 5435)
    env: loadEnv(mode === 'production' ? mode : 'test', process.cwd(), ''),
  },
}));
