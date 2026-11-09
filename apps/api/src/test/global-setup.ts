import { execSync } from 'node:child_process';

import { loadEnv } from 'vite';

// Roda uma vez antes de toda a suíte: aplica as migrations no banco de teste (porta 5435).
export default function setup() {
  const testEnv = loadEnv('test', process.cwd(), '');
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, ...testEnv },
    stdio: 'pipe',
  });
}
