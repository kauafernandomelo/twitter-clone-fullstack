import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// liga os limites só neste arquivo (cada arquivo de teste tem os próprios módulos e contadores)
beforeAll(() => {
  process.env.RATE_LIMIT_IN_TESTS = '1';
});
afterAll(() => {
  delete process.env.RATE_LIMIT_IN_TESTS;
});

const { createApp } = await import('../app');

describe('rate limit', () => {
  it('bloqueia força bruta no login depois de 20 tentativas', async () => {
    const app = createApp();
    const attempt = () =>
      request(app).post('/api/auth/login').send({ identifier: 'alguem', password: 'errada' });

    for (let i = 0; i < 20; i += 1) {
      expect((await attempt()).status).toBe(401);
    }
    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas tentativas. Tente novamente em alguns minutos.',
    });
    // cabeçalhos padrão (draft-8) dizem ao cliente quando tentar de novo
    expect(blocked.headers['ratelimit-policy']).toBeDefined();
  });
});
