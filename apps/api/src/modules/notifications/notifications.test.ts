import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { SocketEvent } from '@twitter-clone/shared';
import { io as connect } from 'socket.io-client';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';
import { closeSocket, initSocket } from '../../lib/socket';
import { getCookie, registerAndLogin } from '../../test/helpers';

const register = (username: string) =>
  registerAndLogin({ username, email: `${username}@example.com`, name: username });

type Agent = Awaited<ReturnType<typeof register>>['agent'];

const post = async (agent: Agent, body: object) =>
  (await agent.post('/api/tweets').send(body)).body.tweet as { id: string };

type Item = {
  type: string;
  actors: { username: string }[];
  actorsCount: number;
  read: boolean;
  tweet: { content: string } | null;
};
const list = async (agent: Agent, filter = 'all') =>
  (await agent.get('/api/notifications').query({ filter })).body.items as Item[];
const unread = async (agent: Agent) =>
  (await agent.get('/api/notifications/unread-count')).body.count as number;

describe('notificações criadas pelas ações', () => {
  it('curtida, repost, resposta, citação, menção e follow notificam o dono', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const tweet = await post(ana.agent, { content: 'post da ana' });

    await bruno.agent.post(`/api/tweets/${tweet.id}/like`);
    await bruno.agent.post(`/api/tweets/${tweet.id}/retweet`);
    await post(bruno.agent, { content: 'respondendo', replyToId: tweet.id });
    await post(bruno.agent, { content: 'citando', quoteOfId: tweet.id });
    await post(bruno.agent, { content: 'oi @ana_souza' });
    await bruno.agent.post('/api/users/ana_souza/follow');

    const items = await list(ana.agent);
    expect(items.map((n) => n.type)).toEqual([
      'follow',
      'mention',
      'quote',
      'reply',
      'retweet',
      'like',
    ]);
    expect(items.every((n) => n.actors[0]?.username === 'bruno' && !n.read)).toBe(true);
    expect(items.find((n) => n.type === 'reply')?.tweet?.content).toBe('respondendo');
    expect(items.find((n) => n.type === 'like')?.tweet?.content).toBe('post da ana');
    expect(await unread(ana.agent)).toBe(6);
  });

  it('ações em si mesmo não notificam', async () => {
    const ana = await register('ana_souza');
    const tweet = await post(ana.agent, { content: 'meu post @ana_souza' });
    await ana.agent.post(`/api/tweets/${tweet.id}/like`);
    await post(ana.agent, { content: 'me respondendo', replyToId: tweet.id });

    expect(await list(ana.agent)).toEqual([]);
  });

  it('quem já recebe "respondeu" não recebe também "mencionou" pelo mesmo post', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const tweet = await post(ana.agent, { content: 'pergunta' });

    await post(bruno.agent, { content: '@ana_souza resposta', replyToId: tweet.id });

    expect((await list(ana.agent)).map((n) => n.type)).toEqual(['reply']);
  });

  it('desfazer (descurtir, desfazer repost, deixar de seguir) remove a notificação', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const tweet = await post(ana.agent, { content: 'post' });
    await bruno.agent.post(`/api/tweets/${tweet.id}/like`);
    await bruno.agent.post(`/api/tweets/${tweet.id}/retweet`);
    await bruno.agent.post('/api/users/ana_souza/follow');

    await bruno.agent.delete(`/api/tweets/${tweet.id}/like`);
    await bruno.agent.delete(`/api/tweets/${tweet.id}/retweet`);
    await bruno.agent.delete('/api/users/ana_souza/follow');

    expect(await list(ana.agent)).toEqual([]);
  });

  it('curtir de novo não duplica; apagar o post apaga as notificações dele', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const tweet = await post(ana.agent, { content: 'post' });
    await bruno.agent.post(`/api/tweets/${tweet.id}/like`);
    await bruno.agent.post(`/api/tweets/${tweet.id}/like`);
    expect(await prisma.notification.count()).toBe(1);

    await ana.agent.delete(`/api/tweets/${tweet.id}`);
    expect(await prisma.notification.count()).toBe(0);
  });

  it('editar o post para mencionar alguém notifica; tirar a menção remove', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const tweet = await post(bruno.agent, { content: 'sem menção' });

    await bruno.agent.patch(`/api/tweets/${tweet.id}`).send({ content: 'agora com @ana_souza' });
    expect((await list(ana.agent)).map((n) => n.type)).toEqual(['mention']);

    await bruno.agent.patch(`/api/tweets/${tweet.id}`).send({ content: 'tirei a menção' });
    expect(await list(ana.agent)).toEqual([]);
  });
});

describe('agrupamento, filtro e leitura', () => {
  it('agrupa curtidas do mesmo post e follows do dia, com as pessoas mais recentes primeiro', async () => {
    const ana = await register('ana_souza');
    const others = [
      await register('bruno'),
      await register('carla'),
      await register('davi'),
      await register('eduardo'),
    ];
    const tweet = await post(ana.agent, { content: 'post popular' });

    for (const other of others) {
      await other.agent.post(`/api/tweets/${tweet.id}/like`);
      await other.agent.post('/api/users/ana_souza/follow');
    }

    const items = await list(ana.agent);
    expect(items).toHaveLength(2);
    const likes = items.find((n) => n.type === 'like')!;
    expect(likes.actorsCount).toBe(4);
    // só as 3 mais recentes vêm detalhadas
    expect(likes.actors.map((a) => a.username)).toEqual(['eduardo', 'davi', 'carla']);
    expect(items.find((n) => n.type === 'follow')?.actorsCount).toBe(4);
    expect(await unread(ana.agent)).toBe(2);
  });

  it('aba Menções traz só respostas, citações e menções', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const tweet = await post(ana.agent, { content: 'post' });
    await bruno.agent.post(`/api/tweets/${tweet.id}/like`);
    await post(bruno.agent, { content: 'resposta', replyToId: tweet.id });

    expect((await list(ana.agent, 'mentions')).map((n) => n.type)).toEqual(['reply']);
  });

  it('marcar como lidas zera o contador', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    await bruno.agent.post('/api/users/ana_souza/follow');
    expect(await unread(ana.agent)).toBe(1);

    expect((await ana.agent.post('/api/notifications/read')).status).toBe(204);

    expect(await unread(ana.agent)).toBe(0);
    expect((await list(ana.agent))[0]?.read).toBe(true);
  });

  it('exige login', async () => {
    expect((await request(createApp()).get('/api/notifications')).status).toBe(401);
  });
});

describe('tempo real (Socket.IO)', () => {
  const sockets: ReturnType<typeof connect>[] = [];
  afterEach(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await closeSocket();
  });

  async function startServer() {
    const server = createServer(createApp());
    initSocket(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    return `http://localhost:${port}`;
  }

  it('avisa o destinatário na hora, só na sala dele', async () => {
    const url = await startServer();
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const login = await request(createApp())
      .post('/api/auth/login')
      .send({ identifier: 'ana_souza', password: 'senha-forte-123' });
    const cookie = `access_token=${getCookie(login, 'access_token')}`;

    const socket = connect(url, { extraHeaders: { cookie }, transports: ['websocket'] });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', reject);
    });

    const received = new Promise((resolve) => socket.on(SocketEvent.NOTIFICATION, resolve));
    const tweet = await post(ana.agent, { content: 'post' });
    await bruno.agent.post(`/api/tweets/${tweet.id}/like`);

    await expect(received).resolves.toBeDefined();
  });

  it('recusa conexão sem cookie de sessão', async () => {
    const url = await startServer();
    const socket = connect(url, { transports: ['websocket'], reconnection: false });
    sockets.push(socket);

    const error = await new Promise<Error>((resolve) => socket.on('connect_error', resolve));

    expect(error.message).toBe('UNAUTHENTICATED');
  });
});
