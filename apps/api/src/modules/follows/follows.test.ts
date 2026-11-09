import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';
import { registerAndLogin } from '../../test/helpers';

const app = createApp();

const register = (username: string) =>
  registerAndLogin({ username, email: `${username}@example.com`, name: username });

const usernames = (body: { items: { username: string }[] }) => body.items.map((u) => u.username);

describe('seguir e deixar de seguir', () => {
  it('exige login', async () => {
    const res = await request(app).post('/api/users/qualquer/follow');
    expect(res.status).toBe(401);
  });

  it('seguir atualiza contadores e flags dos dois lados', async () => {
    const ana = await register('ana_souza');
    await register('bruno');

    const res = await ana.agent.post('/api/users/bruno/follow');
    expect(res.status).toBe(204);

    const brunoProfile = (await ana.agent.get('/api/users/bruno')).body.user;
    expect(brunoProfile).toMatchObject({
      followersCount: 1,
      followingCount: 0,
      isFollowing: true,
      followsYou: false,
    });

    const anaProfile = (await ana.agent.get('/api/users/ana_souza')).body.user;
    expect(anaProfile).toMatchObject({ followersCount: 0, followingCount: 1 });
  });

  it('mostra "segue você" quando a outra pessoa me segue', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    await bruno.agent.post('/api/users/ana_souza/follow');

    const profile = (await ana.agent.get('/api/users/bruno')).body.user;

    expect(profile).toMatchObject({ isFollowing: false, followsYou: true });
  });

  it('é idempotente: seguir duas vezes não duplica, deixar de seguir duas vezes não falha', async () => {
    const ana = await register('ana_souza');
    await register('bruno');

    await ana.agent.post('/api/users/bruno/follow');
    expect((await ana.agent.post('/api/users/bruno/follow')).status).toBe(204);
    expect(await prisma.follow.count()).toBe(1);

    await ana.agent.delete('/api/users/bruno/follow');
    expect((await ana.agent.delete('/api/users/bruno/follow')).status).toBe(204);
    expect(await prisma.follow.count()).toBe(0);
  });

  it('não deixa seguir a si mesmo (na API e no banco)', async () => {
    const ana = await register('ana_souza');

    const res = await ana.agent.post('/api/users/ANA_SOUZA/follow');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Você não pode seguir a si mesmo');

    // a constraint CHECK do Postgres barra mesmo se alguém pular a API
    await expect(
      prisma.follow.create({ data: { followerId: ana.user.id, followingId: ana.user.id } }),
    ).rejects.toThrow();
  });

  it('responde 404 para conta inexistente', async () => {
    const ana = await register('ana_souza');
    const res = await ana.agent.post('/api/users/fantasma/follow');
    expect(res.status).toBe(404);
  });
});

describe('listas de seguidores e seguindo', () => {
  it('lista seguidores (mais recentes primeiro) com as flags de quem está vendo', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const carla = await register('carla');
    await bruno.agent.post('/api/users/ana_souza/follow');
    await carla.agent.post('/api/users/ana_souza/follow');
    await ana.agent.post('/api/users/carla/follow');

    const res = await ana.agent.get('/api/users/ana_souza/followers');

    expect(usernames(res.body)).toEqual(['carla', 'bruno']);
    expect(res.body.items[0]).toMatchObject({ isFollowing: true, followsYou: true });
    expect(res.body.items[1]).toMatchObject({ isFollowing: false, followsYou: true });
  });

  it('lista quem a pessoa segue, paginando por cursor', async () => {
    const ana = await register('ana_souza');
    for (const name of ['bruno', 'carla', 'davi']) {
      await register(name);
      await ana.agent.post(`/api/users/${name}/follow`);
    }

    const page1 = await ana.agent.get('/api/users/ana_souza/following?limit=2');
    const page2 = await ana.agent.get(
      `/api/users/ana_souza/following?limit=2&cursor=${page1.body.nextCursor}`,
    );

    expect(usernames(page1.body)).toEqual(['davi', 'carla']);
    expect(usernames(page2.body)).toEqual(['bruno']);
    expect(page2.body.nextCursor).toBeNull();
  });
});

describe('GET /api/feed/following', () => {
  it('traz os meus posts e os de quem eu sigo, sem os de quem não sigo', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const carla = await register('carla');
    await ana.agent.post('/api/users/bruno/follow');

    await ana.agent.post('/api/tweets').send({ content: 'da ana' });
    await bruno.agent.post('/api/tweets').send({ content: 'do bruno' });
    await carla.agent.post('/api/tweets').send({ content: 'da carla' });

    const res = await ana.agent.get('/api/feed/following');

    expect(res.body.items.map((t: { content: string }) => t.content)).toEqual([
      'do bruno',
      'da ana',
    ]);
  });

  it('deixar de seguir tira os posts da pessoa do feed', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    await ana.agent.post('/api/users/bruno/follow');
    await bruno.agent.post('/api/tweets').send({ content: 'do bruno' });

    await ana.agent.delete('/api/users/bruno/follow');
    const res = await ana.agent.get('/api/feed/following');

    expect(res.body.items).toEqual([]);
  });
});

describe('GET /api/suggestions', () => {
  it('sugere os mais seguidos que eu ainda não sigo, sem incluir eu mesma', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const carla = await register('carla');
    await register('davi');
    const edu = await register('eduardo');
    // carla: 2 seguidores, davi: 1, eduardo: 0; ana já segue o bruno
    await bruno.agent.post('/api/users/carla/follow');
    await edu.agent.post('/api/users/carla/follow');
    await carla.agent.post('/api/users/davi/follow');
    await ana.agent.post('/api/users/bruno/follow');

    const res = await ana.agent.get('/api/suggestions?limit=3');

    const names = res.body.users.map((u: { username: string }) => u.username);
    expect(names.slice(0, 2)).toEqual(['carla', 'davi']);
    expect(names).not.toContain('ana_souza');
    expect(names).not.toContain('bruno');
    expect(res.body.users).toHaveLength(3);
  });
});
