import { afterAll, afterEach, beforeEach, vi } from 'vitest';

import { prisma } from '../lib/prisma';

// Cada teste começa com o banco vazio: nenhum teste depende do outro.
beforeEach(async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
});

// Teste não sai para a internet: chamadas HTTP externas (ex.: apagar imagem no Cloudinary)
// caem neste fetch falso, que os testes podem inspecionar.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{"result":"ok"}', { status: 200 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await prisma.$disconnect();
});
