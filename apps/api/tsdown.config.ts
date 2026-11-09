import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/server.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  // o pacote shared exporta TypeScript puro: precisa ser embutido no bundle
  noExternal: ['@twitter-clone/shared'],
});
