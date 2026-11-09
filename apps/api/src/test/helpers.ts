import type { RegisterInput } from '@twitter-clone/shared';
import request from 'supertest';

import { createApp } from '../app';

export const validUser = {
  name: 'Ana Souza',
  username: 'ana_souza',
  email: 'ana@example.com',
  password: 'senha-forte-123',
} satisfies RegisterInput;

// Agent do supertest guarda os cookies entre as requests, como um navegador.
export function createAgent() {
  return request.agent(createApp());
}

export async function registerAndLogin(overrides: Partial<RegisterInput> = {}) {
  const agent = createAgent();
  const res = await agent.post('/api/auth/register').send({ ...validUser, ...overrides });
  if (res.status !== 201)
    throw new Error(`register falhou: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user };
}

/** Lê o valor de um cookie a partir do header Set-Cookie da resposta */
export function getCookie(res: request.Response, name: string) {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = header?.find((c) => c.startsWith(`${name}=`));
  return cookie?.split(';')[0]?.slice(name.length + 1);
}
