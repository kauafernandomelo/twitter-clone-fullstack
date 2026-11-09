/**
 * Seed de demonstração: ~20 perfis com foto e banner, ~150 posts (com respostas, citações,
 * reposts, imagens, hashtags e menções), follows, curtidas, notificações e DMs, mais a conta
 * de visitante usada pelo botão "Entrar como visitante".
 *
 *   npm run db:seed                       → banco do apps/api/.env
 *   NODE_ENV=production DATABASE_URL=... npm run db:seed -- --confirm   → produção
 *
 * Pode rodar quantas vezes quiser: ele apaga o seed anterior (usuários @seed.example.com e
 * as imagens deles no Cloudinary) e cria tudo de novo. Contas reais não são tocadas.
 */
import { randomBytes } from 'node:crypto';

import { extractHashtags, extractMentions } from '@twitter-clone/shared';

import { env } from '../config/env';
import type { Prisma } from '../generated/prisma/client';
import { isCloudinaryConfigured } from '../lib/cloudinary';
import { hashPassword } from '../lib/password';
import { prisma } from '../lib/prisma';
import {
  DEMO_USERNAME,
  demoConversations,
  demoFollowers,
  demoFollows,
  demoPersona,
  personas,
  type SeedPersona,
} from './data';
import {
  deleteFolderImages,
  mapLimit,
  picsumUrl,
  portraitUrl,
  uploadImage,
  type UploadedImage,
} from './images';
import { uuidv7At } from './uuid';

const SEED_EMAIL_DOMAIN = 'seed.example.com';
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const now = Date.now();
const at = (ms: number) => new Date(Math.min(ms, now - MINUTE));

// Sorteios com semente fixa: rodar de novo gera a mesma rede (só os horários andam junto com o relógio).
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(20261109);
const randInt = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const between = (start: number, end: number) => start + random() * Math.max(0, end - start);

/** Sorteia `count` itens sem repetir; `weight` deixa uns mais prováveis que outros. */
function sample<T>(items: T[], count: number, weight: (item: T) => number = () => 1) {
  const pool = [...items];
  const chosen: T[] = [];
  while (chosen.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + weight(item), 0);
    let target = random() * total;
    const index = pool.findIndex((item) => (target -= weight(item)) <= 0);
    chosen.push(...pool.splice(index === -1 ? pool.length - 1 : index, 1));
  }
  return chosen;
}

type SeedUser = { id: string; persona: SeedPersona; joinedAt: Date };

type TweetDraft = {
  id: string;
  author: SeedUser;
  content: string;
  createdAt: Date;
  replyTo?: TweetDraft;
  quoteOf?: TweetDraft;
  retweetOf?: TweetDraft;
  editedAt?: Date;
  images: number[];
};

type NotificationType = Prisma.NotificationCreateManyInput['type'];

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

async function removePreviousSeed() {
  const previous = await prisma.user.findMany({
    where: { email: { endsWith: `@${SEED_EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  if (previous.length === 0) return;

  console.log(`→ Apagando o seed anterior (${previous.length} contas e as imagens delas)…`);
  const ids = previous.map((user) => user.id);
  await mapLimit(ids, 4, (id) => deleteFolderImages(`twitter-clone/${env.NODE_ENV}/users/${id}/`));
  // conversa não tem cascade a partir do usuário (só os participantes): apaga antes
  await prisma.conversation.deleteMany({
    where: { participants: { some: { userId: { in: ids } } } },
  });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  if (env.NODE_ENV === 'test') fail('O seed não roda com NODE_ENV=test.');
  if (env.NODE_ENV === 'production' && !process.argv.includes('--confirm')) {
    fail('Isso vai gravar no banco de PRODUÇÃO. Rode de novo com --confirm se for isso mesmo.');
  }
  if (!isCloudinaryConfigured()) {
    fail('Configure as chaves CLOUDINARY_* no .env: o seed sobe as fotos para o Cloudinary.');
  }

  const host = new URL(env.DATABASE_URL).host;
  console.log(`🌱 Seed em ${host} (NODE_ENV=${env.NODE_ENV})`);

  const allPersonas = [...personas, demoPersona];
  const usernames = allPersonas.map((persona) => persona.username);
  const taken = await prisma.user.findMany({
    where: {
      username: { in: usernames },
      NOT: { email: { endsWith: `@${SEED_EMAIL_DOMAIN}` } },
    },
    select: { username: true },
  });
  if (taken.length > 0) {
    fail(
      `Estes usernames já são de contas reais: ${taken.map((u) => u.username).join(', ')}. Troque no data.ts.`,
    );
  }

  await removePreviousSeed();

  // ---------- usuários ----------
  const users = new Map<string, SeedUser>();
  for (const persona of allPersonas) {
    const joinedAt = new Date(now - persona.joinedDaysAgo * DAY - randInt(0, 20) * HOUR);
    users.set(persona.username, { id: uuidv7At(joinedAt), persona, joinedAt });
  }
  const user = (username: string) => {
    const found = users.get(username);
    if (!found) throw new Error(`Usuário do seed não encontrado: ${username}`);
    return found;
  };
  const demo = user(DEMO_USERNAME);
  const regulars = [...users.values()].filter((u) => u !== demo);

  // ---------- posts ----------
  const tweets: TweetDraft[] = [];
  const roots: TweetDraft[] = [];

  function addTweet(draft: Omit<TweetDraft, 'id' | 'images'> & { images?: number[] }) {
    const content = draft.content;
    if ([...content].length > 280) throw new Error(`Post com mais de 280 caracteres: ${content}`);
    const tweet: TweetDraft = {
      ...draft,
      images: draft.images ?? [],
      id: uuidv7At(draft.createdAt),
    };
    tweets.push(tweet);
    return tweet;
  }

  for (const author of users.values()) {
    for (const post of author.persona.posts) {
      const createdAt = at(now - post.h * HOUR);
      const root = addTweet({
        author,
        content: post.text,
        createdAt,
        images: post.images,
        editedAt: post.edited ? new Date(createdAt.getTime() + 20 * MINUTE) : undefined,
      });
      roots.push(root);

      // respostas e citações chegam depois do post, espalhadas até algumas horas mais tarde
      const window = Math.min(post.h * HOUR * 0.8, 6 * HOUR);
      const replies = post.replies ?? [];
      replies.forEach((reply, index) => {
        addTweet({
          author: user(reply.by),
          content: reply.text,
          createdAt: at(createdAt.getTime() + (window * (index + 1)) / (replies.length + 1)),
          replyTo: root,
        });
      });
      for (const quote of post.quotes ?? []) {
        addTweet({
          author: user(quote.by),
          content: quote.text,
          createdAt: at(createdAt.getTime() + window * between(0.3, 0.9)),
          quoteOf: root,
        });
      }
    }
  }

  // reposts: os posts com foto e de perfis populares circulam mais
  const repostable = roots.filter((tweet) => tweet.author !== demo);
  for (const original of sample(
    repostable,
    24,
    (t) => t.author.persona.popularity + t.images.length * 2,
  )) {
    const reposters = sample(
      regulars.filter((u) => u !== original.author),
      randInt(1, 2),
    );
    for (const reposter of reposters) {
      addTweet({
        author: reposter,
        content: '',
        createdAt: at(between(original.createdAt.getTime() + 10 * MINUTE, now)),
        retweetOf: original,
      });
    }
  }
  const demoDarkMode = roots.find((t) => t.author === demo && t.content.includes('tema escuro'))!;
  for (const username of ['marinacodes', 'bia_lima']) {
    addTweet({
      author: user(username),
      content: '',
      createdAt: at(demoDarkMode.createdAt.getTime() + randInt(20, 200) * MINUTE),
      retweetOf: demoDarkMode,
    });
  }
  const juliaView = roots.find((t) => t.author.persona.username === 'juliaviaja')!;
  addTweet({
    author: demo,
    content: '',
    createdAt: at(juliaView.createdAt.getTime() + 40 * MINUTE),
    retweetOf: juliaView,
  });

  tweets.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // ---------- follows ----------
  const follows: Prisma.FollowCreateManyInput[] = [];
  const notifications: Prisma.NotificationCreateManyInput[] = [];

  function notify(
    recipient: SeedUser,
    actor: SeedUser,
    type: NotificationType,
    createdAt: Date,
    tweetId?: string,
  ) {
    if (recipient === actor) return;
    // a conta demo "acabou de ver" o que é antigo; o último dia fica como não lido
    const readAt =
      recipient === demo
        ? createdAt.getTime() > now - DAY
          ? null
          : new Date(createdAt.getTime() + HOUR)
        : at(createdAt.getTime() + 30 * MINUTE);
    notifications.push({
      id: uuidv7At(createdAt),
      recipientId: recipient.id,
      actorId: actor.id,
      type,
      tweetId: tweetId ?? null,
      createdAt,
      readAt,
    });
  }

  function follow(follower: SeedUser, following: SeedUser, createdAt: Date) {
    follows.push({
      id: uuidv7At(createdAt),
      followerId: follower.id,
      followingId: following.id,
      createdAt,
    });
    notify(following, follower, 'FOLLOW', createdAt);
  }

  for (const follower of regulars) {
    const others = regulars.filter((u) => u !== follower);
    for (const following of sample(others, randInt(5, 11), (u) => u.persona.popularity ** 2)) {
      const since = Math.max(follower.joinedAt.getTime(), following.joinedAt.getTime());
      follow(follower, following, at(between(since, now - 3 * DAY)));
    }
  }
  for (const username of demoFollows) {
    follow(demo, user(username), at(between(demo.joinedAt.getTime(), now - 30 * DAY)));
  }
  demoFollowers.forEach((username, index) => {
    // espalhados nas últimas ~40h: parte já lida, parte nova
    follow(user(username), demo, at(now - (index * 4.5 + 0.5) * HOUR));
  });

  // ---------- notificações de respostas, citações e menções ----------
  for (const tweet of tweets) {
    const notified = new Set<SeedUser>();
    if (tweet.replyTo) {
      notify(tweet.replyTo.author, tweet.author, 'REPLY', tweet.createdAt, tweet.id);
      notified.add(tweet.replyTo.author);
    }
    if (tweet.quoteOf && !notified.has(tweet.quoteOf.author)) {
      notify(tweet.quoteOf.author, tweet.author, 'QUOTE', tweet.createdAt, tweet.id);
      notified.add(tweet.quoteOf.author);
    }
    if (tweet.retweetOf) {
      notify(tweet.retweetOf.author, tweet.author, 'RETWEET', tweet.createdAt, tweet.retweetOf.id);
    }
    for (const username of extractMentions(tweet.content)) {
      const mentioned = users.get(username);
      if (mentioned && !notified.has(mentioned)) {
        notify(mentioned, tweet.author, 'MENTION', tweet.createdAt, tweet.id);
      }
    }
  }

  // ---------- curtidas e itens salvos ----------
  const likes: Prisma.LikeCreateManyInput[] = [];
  function like(liker: SeedUser, tweet: TweetDraft) {
    const createdAt = at(
      between(tweet.createdAt.getTime() + 2 * MINUTE, tweet.createdAt.getTime() + 36 * HOUR),
    );
    likes.push({ id: uuidv7At(createdAt), userId: liker.id, tweetId: tweet.id, createdAt });
    notify(tweet.author, liker, 'LIKE', createdAt, tweet.id);
  }

  for (const tweet of tweets) {
    if (tweet.retweetOf) continue;
    const candidates = regulars.filter((u) => u !== tweet.author);
    let count: number;
    if (tweet.author === demo && !tweet.replyTo) count = randInt(6, 11);
    else if (tweet.replyTo) count = randInt(0, 3);
    else if (tweet.quoteOf) count = randInt(1, 5);
    else {
      const popularity = tweet.author.persona.popularity;
      count = Math.round(popularity * between(1, 3.2)) + tweet.images.length * 2;
    }
    for (const liker of sample(candidates, count, (u) => u.persona.popularity)) like(liker, tweet);
  }
  const othersRoots = roots.filter((t) => t.author !== demo);
  for (const tweet of sample(othersRoots, 10)) like(demo, tweet);

  const bookmarks: Prisma.BookmarkCreateManyInput[] = sample(
    othersRoots,
    5,
    (t) => 1 + t.images.length * 3,
  ).map((tweet) => {
    const createdAt = at(between(tweet.createdAt.getTime(), now));
    return { id: uuidv7At(createdAt), userId: demo.id, tweetId: tweet.id, createdAt };
  });

  // ---------- imagens (Cloudinary) ----------
  type UploadJob = {
    key: string;
    source: string;
    userId: string;
    kind: 'avatar' | 'banner' | 'tweet' | 'message';
  };
  const jobs: UploadJob[] = [];
  for (const u of users.values()) {
    const { photo, banner } = u.persona;
    jobs.push({
      key: `avatar:${u.id}`,
      source: typeof photo === 'number' ? picsumUrl(photo, 400, 400) : portraitUrl(photo),
      userId: u.id,
      kind: 'avatar',
    });
    jobs.push({
      key: `banner:${u.id}`,
      source: picsumUrl(banner, 1500, 500),
      userId: u.id,
      kind: 'banner',
    });
  }
  for (const tweet of tweets) {
    tweet.images.forEach((photoId, position) => {
      jobs.push({
        key: `tweet:${tweet.id}:${position}`,
        source: picsumUrl(photoId, 1200, 800),
        userId: tweet.author.id,
        kind: 'tweet',
      });
    });
  }
  const conversationPlans = demoConversations.map((conversation) => {
    const other = user(conversation.with);
    const messages = conversation.messages.map((message, index) => {
      const createdAt = at(now - message.m * MINUTE);
      const sender = message.fromDemo ? demo : other;
      const id = uuidv7At(createdAt);
      if (message.image) {
        jobs.push({
          key: `message:${id}`,
          source: picsumUrl(message.image, 1080, 1080),
          userId: sender.id,
          kind: 'message',
        });
      }
      return {
        id,
        index,
        sender,
        createdAt,
        text: message.text ?? '',
        hasImage: Boolean(message.image),
      };
    });
    return { other, read: conversation.read, messages };
  });

  console.log(`→ Subindo ${jobs.length} imagens para o Cloudinary…`);
  const uploaded = new Map<string, UploadedImage>();
  let done = 0;
  const newUserIds = [...users.values()].map((u) => u.id);
  try {
    await mapLimit(jobs, 6, async (job) => {
      uploaded.set(job.key, await uploadImage(job.source, job.userId, job.kind));
      done++;
      if (done % 20 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length}`);
    });
  } catch (error) {
    console.error('Falha no upload; limpando o que já subiu…');
    await mapLimit(newUserIds, 4, (id) =>
      deleteFolderImages(`twitter-clone/${env.NODE_ENV}/users/${id}/`),
    );
    throw error;
  }
  const image = (key: string) => {
    const found = uploaded.get(key);
    if (!found) throw new Error(`Imagem não enviada: ${key}`);
    return found;
  };

  // ---------- gravação ----------
  console.log('→ Gravando no banco…');
  const passwordHashes = await Promise.all(
    newUserIds.map(() => hashPassword(randomBytes(24).toString('base64url'))),
  );

  const userRows: Prisma.UserCreateManyInput[] = [...users.values()].map((u, index) => ({
    id: u.id,
    name: u.persona.name,
    username: u.persona.username,
    email: `${u.persona.username}@${SEED_EMAIL_DOMAIN}`,
    // senha aleatória que ninguém sabe: os perfis são só para ver; a demo entra pelo botão
    passwordHash: passwordHashes[index]!,
    bio: u.persona.bio,
    location: u.persona.location,
    avatarUrl: image(`avatar:${u.id}`).url,
    bannerUrl: image(`banner:${u.id}`).url,
    isDemo: u === demo,
    createdAt: u.joinedAt,
    updatedAt: u.joinedAt,
  }));

  const tweetRow = (tweet: TweetDraft): Prisma.TweetCreateManyInput => ({
    id: tweet.id,
    authorId: tweet.author.id,
    content: tweet.content,
    replyToId: tweet.replyTo?.id ?? null,
    isReply: Boolean(tweet.replyTo),
    quoteOfId: tweet.quoteOf?.id ?? null,
    isQuote: Boolean(tweet.quoteOf),
    retweetOfId: tweet.retweetOf?.id ?? null,
    editedAt: tweet.editedAt ?? null,
    createdAt: tweet.createdAt,
    updatedAt: tweet.editedAt ?? tweet.createdAt,
  });

  const media: Prisma.TweetMediaCreateManyInput[] = tweets.flatMap((tweet) =>
    tweet.images.map((_, position) => {
      const { url, width, height } = image(`tweet:${tweet.id}:${position}`);
      return { id: uuidv7At(tweet.createdAt), tweetId: tweet.id, url, width, height, position };
    }),
  );

  const hashtags: Prisma.TweetHashtagCreateManyInput[] = tweets.flatMap((tweet) =>
    extractHashtags(tweet.content)
      .slice(0, 20)
      .map((tag) => ({ tweetId: tweet.id, tag, createdAt: tweet.createdAt })),
  );
  const mentions: Prisma.MentionCreateManyInput[] = tweets.flatMap((tweet) =>
    extractMentions(tweet.content).flatMap((username) => {
      const mentioned = users.get(username);
      return mentioned ? [{ tweetId: tweet.id, userId: mentioned.id }] : [];
    }),
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.user.createMany({ data: userRows });
      await tx.follow.createMany({ data: follows });
      // primeiro os posts que não apontam para outro, depois respostas/citações/reposts
      await tx.tweet.createMany({
        data: tweets.filter((t) => !t.replyTo && !t.quoteOf && !t.retweetOf).map(tweetRow),
      });
      await tx.tweet.createMany({
        data: tweets.filter((t) => t.replyTo || t.quoteOf || t.retweetOf).map(tweetRow),
      });
      await tx.tweetMedia.createMany({ data: media });
      await tx.tweetHashtag.createMany({ data: hashtags });
      await tx.mention.createMany({ data: mentions });
      await tx.like.createMany({ data: likes });
      await tx.bookmark.createMany({ data: bookmarks });
      await tx.notification.createMany({ data: notifications });

      for (const plan of conversationPlans) {
        const first = plan.messages[0]!;
        const last = plan.messages.at(-1)!;
        const lastFromDemo = plan.messages.findLast((m) => m.sender === demo);
        const conversation = await tx.conversation.create({
          data: {
            id: uuidv7At(first.createdAt),
            pairKey: [demo.id, plan.other.id].sort().join(':'),
            createdAt: first.createdAt,
            lastMessageAt: last.createdAt,
            participants: {
              create: [
                {
                  userId: demo.id,
                  lastReadAt: plan.read ? last.createdAt : (lastFromDemo?.createdAt ?? null),
                },
                // a outra pessoa já viu tudo: as mensagens da demo aparecem com "Visto"
                { userId: plan.other.id, lastReadAt: last.createdAt },
              ],
            },
          },
        });
        await tx.message.createMany({
          data: plan.messages.map((message) => {
            const img = message.hasImage ? image(`message:${message.id}`) : null;
            return {
              id: message.id,
              conversationId: conversation.id,
              senderId: message.sender.id,
              content: message.text,
              imageUrl: img?.url ?? null,
              imageWidth: img?.width ?? null,
              imageHeight: img?.height ?? null,
              createdAt: message.createdAt,
            };
          }),
        });
      }
    },
    { timeout: 120_000, maxWait: 20_000 },
  );

  const posts = tweets.filter((t) => !t.retweetOf).length;
  console.log(`
✅ Seed pronto:
   ${users.size} perfis (incluindo @${DEMO_USERNAME}, a conta de visitante)
   ${posts} posts (${tweets.filter((t) => t.replyTo).length} respostas, ${tweets.filter((t) => t.quoteOf).length} citações) e ${tweets.length - posts} reposts
   ${media.length} imagens em posts, ${follows.length} follows, ${likes.length} curtidas
   ${notifications.length} notificações, ${conversationPlans.length} conversas
`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
