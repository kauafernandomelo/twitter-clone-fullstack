import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import express, { type Express } from 'express';

/**
 * Em produção, a própria API entrega o front já compilado (apps/web/dist):
 * um domínio só, então cookies httpOnly e WebSocket funcionam sem CORS nem SameSite=None.
 */
export function readWebApp(distDir: string) {
  const indexPath = path.join(distDir, 'index.html');
  const html = readFileSync(indexPath, 'utf8');

  // hash de cada <script> inline (o de tema no index.html): a CSP libera exatamente esses,
  // sem precisar de 'unsafe-inline'
  const inlineScriptHashes = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ].map(
    ([, code]) =>
      `'sha256-${createHash('sha256')
        .update(code ?? '')
        .digest('base64')}'`,
  );

  return { distDir, indexPath, inlineScriptHashes };
}

export type WebApp = ReturnType<typeof readWebApp>;

export function serveWebApp(app: Express, web: WebApp) {
  // arquivos com hash no nome (assets/index-3f9a.js) nunca mudam: cache de 1 ano
  app.use(
    express.static(web.distDir, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  // qualquer outra rota GET que não seja da API é uma página do SPA (/home, /fulano/status/1...)
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path === '/api') return next();
    res.setHeader('Cache-Control', 'no-cache'); // sempre pega o index novo depois de um deploy
    res.sendFile(web.indexPath);
  });
}
