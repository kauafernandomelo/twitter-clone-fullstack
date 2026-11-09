import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app';
import { userUploadFolder } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { registerAndLogin } from '../../test/helpers';

const app = createApp();

const media = (userId: string, file = 'foto.jpg') => ({
  url: `https://res.cloudinary.com/test-cloud/image/upload/v1/${userUploadFolder(userId, 'tweet')}/${file}`,
  width: 1200,
  height: 800,
});

async function twoUsers() {
  const ana = await registerAndLogin();
  const bruno = await registerAndLogin({ username: 'bruno', email: 'bruno@example.com' });
  return { ana, bruno };
}

describe('POST /api/tweets', () => {
  it('exige login', async () => {
    const res = await request(app).post('/api/tweets').send({ content: 'oi' });
    expect(res.status).toBe(401);
  });

  it('cria um post de texto com os dados do autor', async () => {
    const { agent, user } = await registerAndLogin();

    const res = await agent.post('/api/tweets').send({ content: '  Meu primeiro post!  ' });

    expect(res.status).toBe(201);
    expect(res.body.tweet).toEqual({
      id: expect.any(String),
      entryId: res.body.tweet.id,
      content: 'Meu primeiro post!',
      media: [],
      author: { id: user.id, name: 'Ana Souza', username: 'ana_souza', avatarUrl: null },
      createdAt: expect.any(String),
      editedAt: null,
      isReply: false,
      replyTo: null,
      isQuote: false,
      quote: null,
      stats: { replies: 0, retweets: 0, quotes: 0, likes: 0 },
      viewer: { liked: false, retweeted: false, bookmarked: false },
      repostedBy: null,
    });
  });

  it('cria post só com imagens, mantendo a ordem', async () => {
    const { agent, user } = await registerAndLogin();
    const images = [media(user.id, 'a.jpg'), media(user.id, 'b.jpg')];

    const res = await agent.post('/api/tweets').send({ media: images });

    expect(res.status).toBe(201);
    expect(res.body.tweet.media).toEqual(images);
  });

  it('conta emoji como 1 caractere (limite de 280)', async () => {
    const { agent } = await registerAndLogin();

    const ok = await agent.post('/api/tweets').send({ content: '😀'.repeat(280) });
    const tooLong = await agent.post('/api/tweets').send({ content: 'a'.repeat(281) });

    expect(ok.status).toBe(201);
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.details.content).toEqual(['O post pode ter no máximo 280 caracteres']);
  });

  it('recusa post vazio', async () => {
    const { agent } = await registerAndLogin();
    const res = await agent.post('/api/tweets').send({ content: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.details.content).toEqual(['Escreva algo ou adicione uma imagem']);
  });

  it('recusa mais de 4 imagens e imagens de outra pessoa', async () => {
    const { ana, bruno } = await twoUsers();

    const tooMany = await ana.agent
      .post('/api/tweets')
      .send({ media: Array.from({ length: 5 }, (_, i) => media(ana.user.id, `${i}.jpg`)) });
    const stolen = await ana.agent.post('/api/tweets').send({ media: [media(bruno.user.id)] });

    expect(tooMany.status).toBe(400);
    expect(stolen.status).toBe(400);
    expect(stolen.body.details).toEqual({ media: ['Imagem inválida'] });
  });
});

describe('listagens', () => {
  it('GET /api/tweets traz os posts de todos, mais novos primeiro, paginando por cursor', async () => {
    const { ana, bruno } = await twoUsers();
    for (const n of [1, 2, 3]) await ana.agent.post('/api/tweets').send({ content: `ana ${n}` });
    await bruno.agent.post('/api/tweets').send({ content: 'bruno 1' });

    const page1 = await ana.agent.get('/api/tweets?limit=3');
    expect(page1.body.items.map((t: { content: string }) => t.content)).toEqual([
      'bruno 1',
      'ana 3',
      'ana 2',
    ]);
    expect(page1.body.nextCursor).toBe(page1.body.items[2].id);

    const page2 = await ana.agent.get(`/api/tweets?limit=3&cursor=${page1.body.nextCursor}`);
    expect(page2.body.items.map((t: { content: string }) => t.content)).toEqual(['ana 1']);
    expect(page2.body.nextCursor).toBeNull();
  });

  it('GET /api/users/:username/tweets traz só os posts daquela pessoa', async () => {
    const { ana, bruno } = await twoUsers();
    await ana.agent.post('/api/tweets').send({ content: 'da ana' });
    await bruno.agent.post('/api/tweets').send({ content: 'do bruno' });

    const res = await ana.agent.get('/api/users/bruno/tweets');

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].content).toBe('do bruno');
  });

  it('o perfil mostra quantos posts a pessoa tem', async () => {
    const { agent } = await registerAndLogin();
    await agent.post('/api/tweets').send({ content: 'um' });
    await agent.post('/api/tweets').send({ content: 'dois' });

    const res = await agent.get('/api/users/ana_souza');

    expect(res.body.user.tweetsCount).toBe(2);
  });
});

describe('GET /api/tweets/:id', () => {
  it('devolve o post', async () => {
    const { agent } = await registerAndLogin();
    const created = await agent.post('/api/tweets').send({ content: 'olá' });

    const res = await agent.get(`/api/tweets/${created.body.tweet.id}`);

    expect(res.status).toBe(200);
    expect(res.body.tweet.content).toBe('olá');
  });

  it.each([
    ['inexistente', '0196f0e5-0000-7000-8000-000000000000'],
    ['malformado', 'abc'],
  ])('responde 404 para id %s', async (_label, id) => {
    const { agent } = await registerAndLogin();
    const res = await agent.get(`/api/tweets/${id}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Este post não existe');
  });
});

describe('PATCH /api/tweets/:id', () => {
  it('o autor edita o texto e o post fica marcado como editado', async () => {
    const { agent } = await registerAndLogin();
    const { body } = await agent.post('/api/tweets').send({ content: 'com erro de digitaçao' });

    const res = await agent
      .patch(`/api/tweets/${body.tweet.id}`)
      .send({ content: 'sem erro de digitação' });

    expect(res.status).toBe(200);
    expect(res.body.tweet.content).toBe('sem erro de digitação');
    expect(res.body.tweet.editedAt).not.toBeNull();
    expect(res.body.tweet.createdAt).toBe(body.tweet.createdAt);
  });

  it('salvar o mesmo texto não marca como editado', async () => {
    const { agent } = await registerAndLogin();
    const { body } = await agent.post('/api/tweets').send({ content: 'igual' });

    const res = await agent.patch(`/api/tweets/${body.tweet.id}`).send({ content: 'igual' });

    expect(res.body.tweet.editedAt).toBeNull();
  });

  it('não deixa um post sem imagem ficar vazio, mas um com imagem pode', async () => {
    const { agent, user } = await registerAndLogin();
    const textOnly = await agent.post('/api/tweets').send({ content: 'texto' });
    const withImage = await agent
      .post('/api/tweets')
      .send({ content: 'legenda', media: [media(user.id)] });

    const empty = await agent.patch(`/api/tweets/${textOnly.body.tweet.id}`).send({ content: '' });
    const caption = await agent
      .patch(`/api/tweets/${withImage.body.tweet.id}`)
      .send({ content: '' });

    expect(empty.status).toBe(400);
    expect(caption.status).toBe(200);
    expect(caption.body.tweet.media).toHaveLength(1);
  });

  it('responde 403 quando não é o autor', async () => {
    const { ana, bruno } = await twoUsers();
    const { body } = await ana.agent.post('/api/tweets').send({ content: 'da ana' });

    const res = await bruno.agent
      .patch(`/api/tweets/${body.tweet.id}`)
      .send({ content: 'hackeado' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Você só pode editar seus próprios posts');
  });
});

describe('DELETE /api/tweets/:id', () => {
  it('o autor apaga o post (e as imagens dele)', async () => {
    const { agent, user } = await registerAndLogin();
    const { body } = await agent
      .post('/api/tweets')
      .send({ content: 'tchau', media: [media(user.id)] });

    const res = await agent.delete(`/api/tweets/${body.tweet.id}`);

    expect(res.status).toBe(204);
    expect((await agent.get(`/api/tweets/${body.tweet.id}`)).status).toBe(404);
    expect(await prisma.tweetMedia.count()).toBe(0);
  });

  it('responde 403 quando não é o autor', async () => {
    const { ana, bruno } = await twoUsers();
    const { body } = await ana.agent.post('/api/tweets').send({ content: 'da ana' });

    const res = await bruno.agent.delete(`/api/tweets/${body.tweet.id}`);

    expect(res.status).toBe(403);
    expect((await ana.agent.get(`/api/tweets/${body.tweet.id}`)).status).toBe(200);
  });
});
