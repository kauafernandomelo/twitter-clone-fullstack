import { describe, expect, it } from 'vitest';

import { userUploadFolder } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { registerAndLogin } from '../../test/helpers';

type TweetBody = {
  id: string;
  entryId: string;
  content: string;
  stats: Record<string, number>;
  viewer: Record<string, boolean>;
  repostedBy: { username: string } | null;
  isReply: boolean;
  replyTo: { id: string } | null;
  isQuote: boolean;
  quote: { id: string; content: string } | null;
};

const register = (username: string) =>
  registerAndLogin({ username, email: `${username}@example.com`, name: username });

async function setup() {
  const ana = await register('ana_souza');
  const bruno = await register('bruno');
  const post = (await ana.agent.post('/api/tweets').send({ content: 'post da ana' })).body
    .tweet as TweetBody;
  const get = async (agent = bruno.agent) =>
    (await agent.get(`/api/tweets/${post.id}`)).body.tweet as TweetBody;
  return { ana, bruno, post, get };
}

const contents = (body: { items: TweetBody[] }) => body.items.map((t) => t.content);

describe('curtidas', () => {
  it('curtir e descurtir atualizam o contador e a flag de quem curtiu (idempotente)', async () => {
    const { bruno, post, get } = await setup();

    await bruno.agent.post(`/api/tweets/${post.id}/like`);
    await bruno.agent.post(`/api/tweets/${post.id}/like`);
    let tweet = await get();
    expect(tweet.stats.likes).toBe(1);
    expect(tweet.viewer.liked).toBe(true);

    await bruno.agent.delete(`/api/tweets/${post.id}/like`);
    tweet = await get();
    expect(tweet.stats.likes).toBe(0);
    expect(tweet.viewer.liked).toBe(false);
  });

  it('a aba de curtidas é privada: só o dono vê', async () => {
    const { ana, bruno, post } = await setup();
    await bruno.agent.post(`/api/tweets/${post.id}/like`);

    const own = await bruno.agent.get('/api/users/bruno/likes');
    const others = await ana.agent.get('/api/users/bruno/likes');

    expect(contents(own.body)).toEqual(['post da ana']);
    expect(others.status).toBe(403);
    expect(others.body.message).toBe('As curtidas são privadas');
  });
});

describe('reposts', () => {
  it('repostar coloca o post no feed como "repostado por", com entrada própria', async () => {
    const { bruno, post, get } = await setup();

    expect((await bruno.agent.post(`/api/tweets/${post.id}/retweet`)).status).toBe(204);
    await bruno.agent.post(`/api/tweets/${post.id}/retweet`); // de novo: não duplica

    const feed = (await bruno.agent.get('/api/users/bruno/tweets')).body as { items: TweetBody[] };
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({
      id: post.id,
      content: 'post da ana',
      repostedBy: { username: 'bruno' },
    });
    expect(feed.items[0]!.entryId).not.toBe(post.id);

    const tweet = await get();
    expect(tweet.stats.retweets).toBe(1);
    expect(tweet.viewer.retweeted).toBe(true);
  });

  it('desfazer o repost tira do feed; apagar o original apaga os reposts', async () => {
    const { ana, bruno, post } = await setup();
    await bruno.agent.post(`/api/tweets/${post.id}/retweet`);

    await bruno.agent.delete(`/api/tweets/${post.id}/retweet`);
    expect((await bruno.agent.get('/api/users/bruno/tweets')).body.items).toEqual([]);

    await bruno.agent.post(`/api/tweets/${post.id}/retweet`);
    await ana.agent.delete(`/api/tweets/${post.id}`);
    expect(await prisma.tweet.count()).toBe(0);
  });

  it('interagir pelo id de um repost age no original', async () => {
    const { ana, bruno, post, get } = await setup();
    await bruno.agent.post(`/api/tweets/${post.id}/retweet`);
    const repostEntry = (await bruno.agent.get('/api/users/bruno/tweets')).body
      .items[0] as TweetBody;

    await ana.agent.post(`/api/tweets/${repostEntry.entryId}/like`);

    expect((await get()).stats.likes).toBe(1);
    // o repost não é editável nem apagável como post
    expect((await bruno.agent.delete(`/api/tweets/${repostEntry.entryId}`)).status).toBe(404);
  });

  it('o banco recusa um repost com texto', async () => {
    const { bruno, post } = await setup();
    await expect(
      prisma.tweet.create({
        data: { authorId: bruno.user.id, retweetOfId: post.id, content: 'não pode' },
      }),
    ).rejects.toThrow();
  });
});

describe('respostas', () => {
  it('responder conta no post original e não aparece nas timelines', async () => {
    const { ana, bruno, post, get } = await setup();

    const reply = await bruno.agent
      .post('/api/tweets')
      .send({ content: 'resposta do bruno', replyToId: post.id });

    expect(reply.status).toBe(201);
    expect(reply.body.tweet).toMatchObject({
      isReply: true,
      replyTo: { id: post.id, author: { username: 'ana_souza' } },
    });
    expect((await get()).stats.replies).toBe(1);
    expect(contents((await ana.agent.get('/api/tweets')).body)).toEqual(['post da ana']);
    expect(contents((await bruno.agent.get('/api/users/bruno/replies')).body)).toEqual([
      'resposta do bruno',
    ]);
  });

  it('lista as respostas em ordem cronológica e monta a conversa acima', async () => {
    const { ana, bruno, post } = await setup();
    const r1 = (await bruno.agent.post('/api/tweets').send({ content: 'r1', replyToId: post.id }))
      .body.tweet;
    await ana.agent.post('/api/tweets').send({ content: 'r2', replyToId: post.id });
    const r1a = (await ana.agent.post('/api/tweets').send({ content: 'r1a', replyToId: r1.id }))
      .body.tweet;

    const replies = await ana.agent.get(`/api/tweets/${post.id}/replies`);
    expect(contents(replies.body)).toEqual(['r1', 'r2']);

    const thread = await ana.agent.get(`/api/tweets/${r1a.id}/thread`);
    expect(thread.body.ancestors.map((t: TweetBody) => t.content)).toEqual(['post da ana', 'r1']);
  });

  it('se o post respondido for apagado, a resposta fica marcada como resposta sem pai', async () => {
    const { ana, bruno, post } = await setup();
    const reply = (
      await bruno.agent.post('/api/tweets').send({ content: 'resp', replyToId: post.id })
    ).body.tweet;

    await ana.agent.delete(`/api/tweets/${post.id}`);
    const res = await bruno.agent.get(`/api/tweets/${reply.id}`);

    expect(res.body.tweet).toMatchObject({ isReply: true, replyTo: null });
  });

  it('responder a um post inexistente responde 404', async () => {
    const { bruno } = await setup();
    const res = await bruno.agent
      .post('/api/tweets')
      .send({ content: 'x', replyToId: '0196f0e5-0000-7000-8000-000000000000' });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('O post que você quer responder não existe');
  });
});

describe('citações', () => {
  it('cita mostrando o post original dentro e conta no original', async () => {
    const { bruno, post, get } = await setup();

    const quote = await bruno.agent
      .post('/api/tweets')
      .send({ content: 'concordo!', quoteOfId: post.id });

    expect(quote.body.tweet).toMatchObject({
      content: 'concordo!',
      isQuote: true,
      quote: { id: post.id, content: 'post da ana' },
    });
    expect((await get()).stats.quotes).toBe(1);
  });

  it('se o original for apagado, a citação continua (com o original indisponível)', async () => {
    const { ana, bruno, post } = await setup();
    const quote = (
      await bruno.agent.post('/api/tweets').send({ content: 'olha isso', quoteOfId: post.id })
    ).body.tweet;

    await ana.agent.delete(`/api/tweets/${post.id}`);
    const res = await bruno.agent.get(`/api/tweets/${quote.id}`);

    expect(res.body.tweet).toMatchObject({ content: 'olha isso', isQuote: true, quote: null });
  });

  it('não aceita resposta e citação ao mesmo tempo', async () => {
    const { bruno, post } = await setup();
    const res = await bruno.agent
      .post('/api/tweets')
      .send({ content: 'x', replyToId: post.id, quoteOfId: post.id });
    expect(res.status).toBe(400);
  });
});

describe('itens salvos', () => {
  it('lista os salvos de quem está logado, na ordem em que foram salvos', async () => {
    const { ana, bruno, post } = await setup();
    const other = (await ana.agent.post('/api/tweets').send({ content: 'outro post' })).body.tweet;

    await bruno.agent.post(`/api/tweets/${post.id}/bookmark`);
    await bruno.agent.post(`/api/tweets/${other.id}/bookmark`);

    const bookmarks = await bruno.agent.get('/api/bookmarks');
    expect(contents(bookmarks.body)).toEqual(['outro post', 'post da ana']);
    expect(bookmarks.body.items[0].viewer.bookmarked).toBe(true);

    // os salvos da ana são outros (vazios)
    expect((await ana.agent.get('/api/bookmarks')).body.items).toEqual([]);

    await bruno.agent.delete(`/api/tweets/${post.id}/bookmark`);
    expect(contents((await bruno.agent.get('/api/bookmarks')).body)).toEqual(['outro post']);
  });
});

describe('aba de mídia', () => {
  it('traz só os posts com imagem da pessoa', async () => {
    const { ana } = await setup();
    await ana.agent.post('/api/tweets').send({
      content: 'com foto',
      media: [
        {
          url: `https://res.cloudinary.com/test-cloud/image/upload/v1/${userUploadFolder(ana.user.id, 'tweet')}/a.jpg`,
          width: 100,
          height: 100,
        },
      ],
    });

    const res = await ana.agent.get('/api/users/ana_souza/media');

    expect(contents(res.body)).toEqual(['com foto']);
  });
});
