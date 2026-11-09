import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';

const themeScript = "document.documentElement.dataset.theme = 'dark';";
let distDir: string;

beforeAll(() => {
  // um "build" falso do front, com o mesmo formato do apps/web/dist
  distDir = mkdtempSync(path.join(tmpdir(), 'web-dist-'));
  mkdirSync(path.join(distDir, 'assets'));
  writeFileSync(
    path.join(distDir, 'index.html'),
    `<!doctype html><html><head><script>${themeScript}</script>` +
      `<script type="module" src="/assets/index-abc.js"></script></head><body></body></html>`,
  );
  writeFileSync(path.join(distDir, 'assets', 'index-abc.js'), 'console.log("app")');
});

describe('API servindo o front em produção', () => {
  it('entrega o index.html nas rotas do SPA', async () => {
    const app = createApp({ webDistDir: distDir });

    for (const route of ['/', '/home', '/ana_souza/status/123']) {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.headers['cache-control']).toBe('no-cache');
    }
  });

  it('assets com hash têm cache longo', async () => {
    const res = await request(createApp({ webDistDir: distDir })).get('/assets/index-abc.js');

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('rotas da API continuam respondendo JSON (inclusive 404)', async () => {
    const app = createApp({ webDistDir: distDir });

    expect((await request(app).get('/api/health')).body.status).toBe('ok');
    const missing = await request(app).get('/api/nao-existe');
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe('NOT_FOUND');
  });

  it('CSP libera só o script inline do index (pelo hash), o Cloudinary e a própria origem', async () => {
    const res = await request(createApp({ webDistDir: distDir })).get('/');
    const csp = res.headers['content-security-policy'] as string;
    const hash = createHash('sha256').update(themeScript).digest('base64');

    expect(csp).toContain(`script-src 'self' 'sha256-${hash}'`);
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain('img-src');
    expect(csp).toContain('https://res.cloudinary.com');
    expect(csp).toContain("connect-src 'self' https://api.cloudinary.com");
  });

  it('sem WEB_DIST_DIR (dev), rotas que não são da API dão 404', async () => {
    const res = await request(createApp()).get('/home');
    expect(res.status).toBe(404);
  });
});
