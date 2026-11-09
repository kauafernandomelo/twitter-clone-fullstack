import { extractHashtags, extractMentions, parseTweetText } from '@twitter-clone/shared';
import { describe, expect, it } from 'vitest';

import { prisma } from '../../lib/prisma';
import { registerAndLogin } from '../../test/helpers';

const register = (username: string, name = username) =>
  registerAndLogin({ username, email: `${username}@example.com`, name });

type Agent = Awaited<ReturnType<typeof register>>['agent'];
const post = async (agent: Agent, content: string) =>
  (await agent.post('/api/tweets').send({ content })).body.tweet as { id: string };
const contents = (body: { items: { content: string }[] }) => body.items.map((t) => t.content);

describe('parser de texto (shared)', () => {
  it('acha hashtags com acento, sem números puros, sem pegar e-mail nem âncora de URL', () => {
    const text =
      'Oi @Maria_Dev! #React e #programação em https://site.com/a#b, ana@gmail.com, #123 #react';
    expect(extractHashtags(text)).toEqual(['react', 'programação']);
    expect(extractMentions(text)).toEqual(['maria_dev']);
    expect(parseTweetText('ver https://x.com/a.').map((s) => s.type)).toEqual([
      'text',
      'url',
      'text',
    ]);
  });
});

describe('hashtags e menções salvas', () => {
  it('salva ao criar e regrava ao editar', async () => {
    const ana = await register('ana_souza');
    await register('bruno');
    const tweet = await post(ana.agent, 'Oi @bruno e @ninguem_aqui, curtindo #React #TypeScript');

    expect(
      await prisma.tweetHashtag.findMany({ select: { tag: true }, orderBy: { tag: 'asc' } }),
    ).toEqual([{ tag: 'react' }, { tag: 'typescript' }]);
    // só menções a usuários que existem
    expect(await prisma.mention.count()).toBe(1);

    await ana.agent.patch(`/api/tweets/${tweet.id}`).send({ content: 'Agora só #Vue' });

    expect(await prisma.tweetHashtag.findMany({ select: { tag: true } })).toEqual([{ tag: 'vue' }]);
    expect(await prisma.mention.count()).toBe(0);
  });
});

describe('GET /api/search/tweets', () => {
  it('entende flexões em português e ignora acentos', async () => {
    const { agent } = await register('ana_souza');
    await post(agent, 'Estou programando em TypeScript no café');
    await post(agent, 'Hoje é dia de descanso');

    const stem = await agent.get('/api/search/tweets').query({ q: 'programar' });
    const accent = await agent.get('/api/search/tweets').query({ q: 'cafe' });

    expect(contents(stem.body)).toEqual(['Estou programando em TypeScript no café']);
    expect(contents(accent.body)).toEqual(['Estou programando em TypeScript no café']);
  });

  it('"Destaques" ordena por relevância e pagina por offset', async () => {
    const { agent } = await register('ana_souza');
    await post(agent, 'falando de react');
    await post(agent, 'react react react: tudo sobre react');
    await post(agent, 'mais um sobre react');

    const page1 = await agent.get('/api/search/tweets').query({ q: 'react', limit: 2 });
    const page2 = await agent
      .get('/api/search/tweets')
      .query({ q: 'react', limit: 2, cursor: page1.body.nextCursor });

    expect(page1.body.items[0].content).toBe('react react react: tudo sobre react');
    expect(page1.body.nextCursor).toBe('2');
    expect(page2.body.items).toHaveLength(1);
    expect(page2.body.nextCursor).toBeNull();
  });

  it('"Mais recentes" ordena por data e não traz reposts duplicados', async () => {
    const ana = await register('ana_souza');
    const bruno = await register('bruno');
    const first = await post(ana.agent, 'primeiro sobre prisma');
    await post(ana.agent, 'segundo sobre prisma');
    await bruno.agent.post(`/api/tweets/${first.id}/retweet`);

    const res = await ana.agent.get('/api/search/tweets').query({ q: 'prisma', tab: 'latest' });

    expect(contents(res.body)).toEqual(['segundo sobre prisma', 'primeiro sobre prisma']);
  });

  it('"#tag" busca pela hashtag exata', async () => {
    const { agent } = await register('ana_souza');
    await post(agent, 'Curtindo #React');
    await post(agent, 'Escrevi sobre react sem hashtag');

    const res = await agent.get('/api/search/tweets').query({ q: '#react' });

    expect(contents(res.body)).toEqual(['Curtindo #React']);
  });

  it('valida a busca', async () => {
    const { agent } = await register('ana_souza');
    expect((await agent.get('/api/search/tweets').query({ q: '  ' })).status).toBe(400);
    expect((await agent.get('/api/search/tweets').query({ q: 'x', cursor: 'abc' })).status).toBe(
      400,
    );
  });
});

describe('GET /api/search/users', () => {
  it('acha por início do @ ou por parte do nome, com ou sem @', async () => {
    const { agent } = await register('ana_souza', 'Ana Souza');
    await register('bruno_lima', 'Bruno Lima');
    await register('carla', 'Carla Souza');

    const byName = await agent.get('/api/search/users').query({ q: 'souza' });
    const byUsername = await agent.get('/api/search/users').query({ q: '@bru' });

    expect(byName.body.users.map((u: { username: string }) => u.username).sort()).toEqual([
      'ana_souza',
      'carla',
    ]);
    expect(byUsername.body.users.map((u: { username: string }) => u.username)).toEqual([
      'bruno_lima',
    ]);
  });
});

describe('hashtags e assuntos do momento', () => {
  it('GET /api/hashtags/:tag/tweets lista os posts da hashtag (sem diferenciar maiúsculas)', async () => {
    const { agent } = await register('ana_souza');
    await post(agent, 'um #NodeJS');
    await post(agent, 'dois #nodejs');
    await post(agent, 'sem tag');

    const res = await agent.get('/api/hashtags/NodeJS/tweets');

    expect(contents(res.body)).toEqual(['dois #nodejs', 'um #NodeJS']);
  });

  it('GET /api/trends conta as hashtags das últimas 24h', async () => {
    const { agent } = await register('ana_souza');
    await post(agent, '#react #vue');
    await post(agent, '#react de novo');
    const old = await post(agent, '#angular antigo');
    await prisma.tweetHashtag.updateMany({
      where: { tweetId: old.id },
      data: { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    });

    const res = await agent.get('/api/trends');

    expect(res.body.trends).toEqual([
      { tag: 'react', count: 2 },
      { tag: 'vue', count: 1 },
    ]);
  });
});
