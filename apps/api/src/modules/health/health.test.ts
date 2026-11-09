import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app';

describe('GET /api/health', () => {
  it('responde 200 com status ok', async () => {
    const res = await request(createApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('rota inexistente', () => {
  it('responde 404 no formato padrão de erro', async () => {
    const res = await request(createApp()).get('/api/nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
