import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // carrega apps/api/.env.test (banco de teste na porta 5435)
    env: loadEnv('test', process.cwd(), ''),
    globalSetup: ['./src/test/global-setup.ts'],
    setupFiles: ['./src/test/setup.ts'],
    // os arquivos de teste dividem o mesmo banco: rodam em sequência
    fileParallelism: false,
    // argon2 é lento de propósito; com a máquina carregada, 5 s (padrão) pode não bastar
    testTimeout: 15_000,
  },
});
