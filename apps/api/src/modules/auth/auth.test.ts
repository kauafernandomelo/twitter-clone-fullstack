import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';
import { createAgent, getCookie, registerAndLogin, validUser } from '../../test/helpers';

const app = createApp();

describe('POST /api/auth/register', () => {
  it('cria o usuário, devolve os dados públicos e já loga (cookies)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, username: 'Ana_Souza', email: '  ANA@Example.com ' });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: expect.any(String),
      name: 'Ana Souza',
      username: 'ana_souza',
      email: 'ana@example.com',
      avatarUrl: null,
      createdAt: expect.any(String),
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(getCookie(res, 'access_token')).toBeTruthy();
    expect(getCookie(res, 'refresh_token')).toBeTruthy();

    const setCookie = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(setCookie).toMatch(/HttpOnly/);
  });

  it('salva a senha com hash argon2id, nunca em texto puro', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: validUser.email } });
    expect(user.passwordHash).not.toBe(validUser.password);
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('responde 409 apontando o campo quando email ou username já existem', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const sameEmail = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, username: 'outro_user' });
    expect(sameEmail.status).toBe(409);
    expect(sameEmail.body.code).toBe('CONFLICT');
    expect(sameEmail.body.details).toHaveProperty('email');
    expect(sameEmail.body.details).not.toHaveProperty('username');

    const sameUsername = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'outra@example.com', username: 'ANA_SOUZA' });
    expect(sameUsername.status).toBe(409);
    expect(sameUsername.body.details).toHaveProperty('username');
  });

  it('responde 400 com os erros por campo quando os dados são inválidos', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', username: 'a b', email: 'nao-e-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.details)).toEqual(
      expect.arrayContaining(['name', 'username', 'email', 'password']),
    );
  });

  it('recusa usernames reservados para rotas do app', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, username: 'Explore' });

    expect(res.status).toBe(400);
    expect(res.body.details.username).toEqual(['Este nome de usuário não está disponível']);
  });
});

describe('POST /api/auth/login', () => {
  it.each([
    ['email', validUser.email],
    ['username', validUser.username],
    ['@username', `@${validUser.username.toUpperCase()}`],
  ])('entra com %s', async (_label, identifier) => {
    await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(validUser.username);
    expect(getCookie(res, 'access_token')).toBeTruthy();
  });

  it('responde 401 com a mesma mensagem para senha errada e usuário inexistente', async () => {
    await registerAndLogin();

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ identifier: validUser.email, password: 'senha-errada' });
    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'ninguem@example.com', password: 'qualquer-coisa' });

    for (const res of [wrongPassword, unknownUser]) {
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    }
    expect(wrongPassword.body.message).toBe(unknownUser.body.message);
  });
});

describe('GET /api/auth/me', () => {
  it('responde 401 sem cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('responde 401 com token adulterado', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'access_token=abc.def.ghi');
    expect(res.status).toBe(401);
  });

  it('devolve o usuário logado', async () => {
    const { agent, user } = await registerAndLogin();

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(user);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotaciona o refresh token e emite um novo access token', async () => {
    const agent = createAgent();
    const registerRes = await agent.post('/api/auth/register').send(validUser);
    const oldRefresh = getCookie(registerRes, 'refresh_token');

    const res = await agent.post('/api/auth/refresh');

    expect(res.status).toBe(204);
    const newRefresh = getCookie(res, 'refresh_token');
    expect(newRefresh).toBeTruthy();
    expect(newRefresh).not.toBe(oldRefresh);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  it('responde 401 sem refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('detecta reuso de token antigo e revoga a sessão inteira', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(validUser);
    const stolen = getCookie(registerRes, 'refresh_token');

    // usuário legítimo renova (o token "roubado" fica revogado)
    const legit = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${stolen}`);
    const legitRefresh = getCookie(legit, 'refresh_token');

    // simula que a rotação aconteceu há mais tempo que a janela de tolerância
    await prisma.refreshToken.updateMany({
      where: { revokedAt: { not: null } },
      data: { revokedAt: new Date(Date.now() - 60_000) },
    });

    // atacante tenta usar o token antigo
    const attacker = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${stolen}`);
    expect(attacker.status).toBe(401);

    // e a família inteira caiu: nem o token novo do usuário funciona mais
    const afterReuse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${legitRefresh}`);
    expect(afterReuse.status).toBe(401);
  });

  it('não aceita refresh token expirado', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(validUser);
    const refreshToken = getCookie(registerRes, 'refresh_token');
    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('limpa os cookies e invalida o refresh token', async () => {
    const agent = createAgent();
    const registerRes = await agent.post('/api/auth/register').send(validUser);
    const refreshToken = getCookie(registerRes, 'refresh_token');

    const res = await agent.post('/api/auth/logout');

    expect(res.status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    const reuse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`);
    expect(reuse.status).toBe(401);
  });

  it('funciona mesmo sem estar logado', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });
});
