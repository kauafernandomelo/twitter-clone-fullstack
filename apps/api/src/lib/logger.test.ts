import { Writable } from 'node:stream';

import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { loggerOptions } from './logger';

describe('logs', () => {
  it('não registram cookies de sessão nem tokens', async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, done) {
        lines.push(String(chunk));
        done();
      },
    });
    // mesmo logger da app, mas escrevendo na memória e em nível "info"
    const logger = pino({ ...loggerOptions, level: 'info', transport: undefined }, stream);
    const express = (await import('express')).default;
    const app = express();
    app.use(pinoHttp({ logger }));
    app.get('/x', (_req, res) => {
      res.cookie('access_token', 'segredo-do-cookie-de-resposta').send('ok');
    });

    await request(app)
      .get('/x')
      .set('Cookie', 'access_token=segredo-access; refresh_token=segredo-refresh')
      .set('Authorization', 'Bearer segredo-header');

    const output = lines.join('\n');
    expect(output).toContain('[Redacted]');
    expect(output).not.toMatch(/segredo/);
  });
});
