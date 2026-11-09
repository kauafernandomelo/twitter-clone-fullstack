import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { MessageEvent } from '@twitter-clone/shared';
import { io as connect, type Socket } from 'socket.io-client';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app';
import { userUploadFolder } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { closeSocket, initSocket } from '../../lib/socket';
import { getCookie, registerAndLogin } from '../../test/helpers';
import { registerMessageSocketHandlers } from './messages.socket';

const register = (username: string) =>
  registerAndLogin({ username, email: `${username}@example.com`, name: username });

type Agent = Awaited<ReturnType<typeof register>>['agent'];

async function start(agent: Agent, username: string) {
  return (await agent.post('/api/conversations').send({ username })).body.conversation as {
    id: string;
  };
}
const send = (agent: Agent, id: string, body: object) =>
  agent.post(`/api/conversations/${id}/messages`).send(body);

describe('conversas', () => {
  it('abrir a conversa duas vezes devolve a mesma (uma por par de pessoas)', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');

    const first = await start(ana.agent, 'bruno');
    const again = await start(ana.agent, 'bruno');
    const fromOtherSide = await start(bruno.agent, 'ana_souza');

    expect(again.id).toBe(first.id);
    expect(fromOtherSide.id).toBe(first.id);
    expect(await prisma.conversation.count()).toBe(1);
  });

  it('não deixa conversar consigo mesmo nem com conta inexistente', async () => {
    const ana = await register('ana_souza');
    expect(
      (await ana.agent.post('/api/conversations').send({ username: 'ana_souza' })).status,
    ).toBe(400);
    expect((await ana.agent.post('/api/conversations').send({ username: 'fantasma' })).status).toBe(
      404,
    );
  });

  it('a caixa de entrada mostra só conversas com mensagens, mais recentes primeiro', async () => {
    const ana = await register('ana_souza');
    await register('bruno');
    await register('carla');
    const withBruno = await start(ana.agent, 'bruno');
    const withCarla = await start(ana.agent, 'carla');
    await start(ana.agent, 'bruno');

    expect((await ana.agent.get('/api/conversations')).body.items).toEqual([]);

    await send(ana.agent, withBruno.id, { content: 'oi bruno' });
    await send(ana.agent, withCarla.id, { content: 'oi carla' });

    const inbox = (await ana.agent.get('/api/conversations')).body.items;
    expect(inbox.map((c: { other: { username: string } }) => c.other.username)).toEqual([
      'carla',
      'bruno',
    ]);
    expect(inbox[0].lastMessage.content).toBe('oi carla');
  });

  it('quem não participa recebe 404 em tudo', async () => {
    const ana = await register('ana_souza');
    await register('bruno');
    const carla = await register('carla');
    const { id } = await start(ana.agent, 'bruno');

    for (const res of [
      await carla.agent.get(`/api/conversations/${id}`),
      await carla.agent.get(`/api/conversations/${id}/messages`),
      await send(carla.agent, id, { content: 'intrusa' }),
      await carla.agent.post(`/api/conversations/${id}/read`),
    ]) {
      expect(res.status).toBe(404);
    }
  });
});

describe('mensagens', () => {
  it('lista da mais nova para a mais antiga, paginando por cursor', async () => {
    const ana = await register('ana_souza');
    await register('bruno');
    const { id } = await start(ana.agent, 'bruno');
    for (const n of [1, 2, 3]) await send(ana.agent, id, { content: `msg ${n}` });

    const page1 = await ana.agent.get(`/api/conversations/${id}/messages?limit=2`);
    const page2 = await ana.agent.get(
      `/api/conversations/${id}/messages?limit=2&cursor=${page1.body.nextCursor}`,
    );

    expect(page1.body.items.map((m: { content: string }) => m.content)).toEqual(['msg 3', 'msg 2']);
    expect(page2.body.items.map((m: { content: string }) => m.content)).toEqual(['msg 1']);
  });

  it('não lidas e "Visto": ler zera o contador e informa a outra pessoa', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const { id } = await start(ana.agent, 'bruno');
    await send(ana.agent, id, { content: 'oi' });
    await send(ana.agent, id, { content: 'tudo bem?' });

    expect((await bruno.agent.get('/api/conversations/unread-count')).body.count).toBe(1);
    expect((await bruno.agent.get(`/api/conversations/${id}`)).body.conversation.unreadCount).toBe(
      2,
    );
    // quem enviou não tem nada para ler
    expect((await ana.agent.get('/api/conversations/unread-count')).body.count).toBe(0);

    await bruno.agent.post(`/api/conversations/${id}/read`);

    expect((await bruno.agent.get('/api/conversations/unread-count')).body.count).toBe(0);
    const forAna = (await ana.agent.get(`/api/conversations/${id}`)).body.conversation;
    expect(forAna.otherLastReadAt).not.toBeNull();
  });

  it('aceita imagem da própria pasta e recusa a de outra pessoa', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const { id } = await start(ana.agent, 'bruno');
    const image = (userId: string) => ({
      url: `https://res.cloudinary.com/test-cloud/image/upload/v1/${userUploadFolder(userId, 'message')}/foto.jpg`,
      width: 800,
      height: 600,
    });

    const ok = await send(ana.agent, id, { image: image(ana.user.id) });
    const stolen = await send(ana.agent, id, { image: image(bruno.user.id) });

    expect(ok.status).toBe(201);
    expect(ok.body.message.image).toEqual(image(ana.user.id));
    expect(stolen.status).toBe(400);
  });

  it('recusa mensagem vazia (na API e no banco)', async () => {
    const ana = await register('ana_souza');
    await register('bruno');
    const { id } = await start(ana.agent, 'bruno');

    expect((await send(ana.agent, id, { content: '   ' })).status).toBe(400);
    await expect(
      prisma.message.create({ data: { conversationId: id, senderId: ana.user.id, content: '' } }),
    ).rejects.toThrow();
  });
});

describe('tempo real', () => {
  const sockets: Socket[] = [];
  afterEach(async () => {
    sockets.forEach((socket) => socket.disconnect());
    sockets.length = 0;
    await closeSocket();
  });

  async function setup() {
    const server = createServer(createApp());
    initSocket(server, [registerMessageSocketHandlers]);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const url = `http://localhost:${(server.address() as AddressInfo).port}`;

    const connectAs = async (username: string) => {
      const login = await request(createApp())
        .post('/api/auth/login')
        .send({ identifier: username, password: 'senha-forte-123' });
      const socket = connect(url, {
        extraHeaders: { cookie: `access_token=${getCookie(login, 'access_token')}` },
        transports: ['websocket'],
      });
      sockets.push(socket);
      await new Promise((resolve) => socket.on('connect', () => resolve(undefined)));
      return socket;
    };
    return { connectAs };
  }

  const next = (socket: Socket, event: string) =>
    new Promise<unknown>((resolve) => socket.once(event, resolve));

  it('a mensagem chega na hora para a outra pessoa, com o conteúdo', async () => {
    const { connectAs } = await setup();
    const ana = await register('ana_souza');
    await register('bruno');
    const brunoSocket = await connectAs('bruno');
    const { id } = await start(ana.agent, 'bruno');

    const received = next(brunoSocket, MessageEvent.NEW);
    await send(ana.agent, id, { content: 'chegou?' });

    await expect(received).resolves.toMatchObject({
      conversationId: id,
      message: { content: 'chegou?' },
    });
  });

  it('repassa "digitando" só entre participantes', async () => {
    const { connectAs } = await setup();
    const ana = await register('ana_souza');
    await register('bruno');
    await register('carla');
    const { id } = await start(ana.agent, 'bruno');
    const anaSocket = await connectAs('ana_souza');
    const brunoSocket = await connectAs('bruno');
    const carlaSocket = await connectAs('carla');

    const typing = next(brunoSocket, MessageEvent.TYPING);
    anaSocket.emit(MessageEvent.TYPING, { conversationId: id, isTyping: true });
    await expect(typing).resolves.toEqual({
      conversationId: id,
      userId: ana.user.id,
      isTyping: true,
    });

    // carla não participa: o evento dela é ignorado
    let leaked = false;
    brunoSocket.once(MessageEvent.TYPING, () => {
      leaked = true;
    });
    carlaSocket.emit(MessageEvent.TYPING, { conversationId: id, isTyping: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(leaked).toBe(false);
  });

  it('ignora excesso de "digitando" (limite por conexão)', async () => {
    const { connectAs } = await setup();
    const ana = await register('ana_souza');
    await register('bruno');
    const { id } = await start(ana.agent, 'bruno');
    const anaSocket = await connectAs('ana_souza');
    const brunoSocket = await connectAs('bruno');

    let received = 0;
    brunoSocket.on(MessageEvent.TYPING, () => {
      received += 1;
    });
    for (let i = 0; i < 30; i += 1) {
      anaSocket.emit(MessageEvent.TYPING, { conversationId: id, isTyping: i % 2 === 0 });
    }
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(received).toBe(10);
  });
});
