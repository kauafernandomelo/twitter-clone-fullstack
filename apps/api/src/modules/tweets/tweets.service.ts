import type {
  createTweetSchema,
  cursorQuerySchema,
  Paginated,
  Tweet,
  updateTweetSchema,
} from '@twitter-clone/shared';
import type { z } from 'zod';

import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../lib/app-error';
import { isOwnUploadUrl } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { findUserIdByUsername } from '../users/users.service';
import { entrySelect, toTweet } from './tweets.select';

type CreateTweetData = z.output<typeof createTweetSchema>;
type UpdateTweetData = z.output<typeof updateTweetSchema>;
type CursorQuery = z.output<typeof cursorQuerySchema>;

const MAX_THREAD_DEPTH = 20;

const notFound = (message = 'Este post não existe') => new AppError(404, message, 'NOT_FOUND');

/**
 * Paginação por cursor: "me dê os N posts depois do id X".
 * Diferente de OFFSET, não pula nem repete itens quando posts novos chegam
 * enquanto a pessoa rola a tela, e continua rápida em listas enormes.
 * Busca N+1 para saber se existe próxima página sem precisar de um COUNT.
 */
async function paginate(
  viewerId: string,
  where: Prisma.TweetWhereInput,
  { cursor, limit }: CursorQuery,
  order: 'asc' | 'desc' = 'desc',
): Promise<Paginated<Tweet>> {
  const rows = await prisma.tweet.findMany({
    where: { ...where, ...(cursor && { id: order === 'desc' ? { lt: cursor } : { gt: cursor } }) },
    orderBy: { id: order },
    take: limit + 1,
    select: entrySelect(viewerId),
  });

  const items = rows.slice(0, limit).map(toTweet);
  const nextCursor = rows.length > limit ? (items.at(-1)?.entryId ?? null) : null;
  return { items, nextCursor };
}

/** Posts reais por trás de um id: se for o id de um repost, devolve o original. */
async function resolveOriginalId(id: string, message?: string) {
  const tweet = await prisma.tweet.findUnique({
    where: { id },
    select: { id: true, retweetOfId: true },
  });
  if (!tweet) throw notFound(message);
  return tweet.retweetOfId ?? tweet.id;
}

// ---------- listas ----------

/** "Para você": tudo que não é resposta (posts, citações e reposts), mais recentes primeiro. */
export function listRecent(viewerId: string, query: CursorQuery) {
  return paginate(viewerId, { isReply: false }, query);
}

/** "Seguindo": o mesmo, mas só de quem eu sigo + os meus. */
export function listFollowingFeed(viewerId: string, query: CursorQuery) {
  return paginate(
    viewerId,
    {
      isReply: false,
      OR: [{ authorId: viewerId }, { author: { followers: { some: { followerId: viewerId } } } }],
    },
    query,
  );
}

export type ProfileTab = 'posts' | 'replies' | 'media' | 'likes';

export async function listByUsername(
  viewerId: string,
  username: string,
  tab: ProfileTab,
  query: CursorQuery,
): Promise<Paginated<Tweet>> {
  const authorId = await findUserIdByUsername(username);

  switch (tab) {
    case 'posts':
      return paginate(viewerId, { authorId, isReply: false }, query);
    case 'replies':
      return paginate(viewerId, { authorId, isReply: true }, query);
    case 'media':
      return paginate(viewerId, { authorId, retweetOfId: null, media: { some: {} } }, query);
    case 'likes':
      // como no Twitter desde 2024: curtidas são privadas
      if (authorId !== viewerId) {
        throw new AppError(403, 'As curtidas são privadas', 'FORBIDDEN');
      }
      return listSaved(viewerId, 'like', query);
  }
}

/**
 * Curtidas e itens salvos: paginados pela linha de like/bookmark (ordem em que salvei),
 * não pela data do post.
 */
async function listSaved(
  viewerId: string,
  kind: 'like' | 'bookmark',
  { cursor, limit }: CursorQuery,
) {
  const args = {
    where: { userId: viewerId, ...(cursor && { id: { lt: cursor } }) },
    orderBy: { id: 'desc' },
    take: limit + 1,
    select: { id: true, tweet: { select: entrySelect(viewerId) } },
  } as const;

  const rows =
    kind === 'like' ? await prisma.like.findMany(args) : await prisma.bookmark.findMany(args);

  const page = rows.slice(0, limit);
  return {
    items: page.map((row) => ({ ...toTweet(row.tweet), entryId: row.id })),
    nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
  } satisfies Paginated<Tweet>;
}

export const listBookmarks = (viewerId: string, query: CursorQuery) =>
  listSaved(viewerId, 'bookmark', query);

/** Respostas diretas a um post, em ordem cronológica (para ler a conversa de cima pra baixo). */
export async function listReplies(viewerId: string, id: string, query: CursorQuery) {
  const tweetId = await resolveOriginalId(id);
  return paginate(viewerId, { replyToId: tweetId }, query, 'asc');
}

/** Os posts "acima" de uma resposta, do começo da conversa até o pai direto. */
export async function getThread(viewerId: string, id: string) {
  const start = await prisma.tweet.findUnique({ where: { id }, select: { replyToId: true } });
  if (!start) throw notFound();

  // sobe pela cadeia de respostas, um pai por vez (limitado para não rodar sem fim)
  const ancestors: Tweet[] = [];
  let parentId: string | null = start.replyToId;
  while (parentId && ancestors.length < MAX_THREAD_DEPTH) {
    const parent = await prisma.tweet.findUnique({
      where: { id: parentId },
      select: { ...entrySelect(viewerId), replyToId: true },
    });
    if (!parent) break;
    ancestors.unshift(toTweet(parent));
    parentId = parent.replyToId;
  }

  return ancestors;
}

export async function getById(viewerId: string, id: string): Promise<Tweet> {
  const row = await prisma.tweet.findUnique({ where: { id }, select: entrySelect(viewerId) });
  if (!row) throw notFound();
  // o id de um repost não tem página própria: abre o original
  if (row.retweetOf) return getById(viewerId, row.retweetOf.id);
  return toTweet(row);
}

// ---------- criar / editar / apagar ----------

export async function create(authorId: string, data: CreateTweetData) {
  const invalidMedia = data.media.some((media) => !isOwnUploadUrl(media.url, authorId, 'tweet'));
  if (invalidMedia) {
    throw new AppError(400, 'Dados inválidos', 'VALIDATION_ERROR', { media: ['Imagem inválida'] });
  }

  const replyToId = data.replyToId
    ? await resolveOriginalId(data.replyToId, 'O post que você quer responder não existe')
    : null;
  const quoteOfId = data.quoteOfId
    ? await resolveOriginalId(data.quoteOfId, 'O post que você quer citar não existe')
    : null;

  const row = await prisma.tweet.create({
    data: {
      authorId,
      content: data.content,
      replyToId,
      isReply: replyToId !== null,
      quoteOfId,
      isQuote: quoteOfId !== null,
      media: { create: data.media.map((media, position) => ({ ...media, position })) },
    },
    select: entrySelect(authorId),
  });
  return toTweet(row);
}

// Busca o post garantindo que existe, que não é um repost e que quem pede é o autor.
async function findOwnTweet(userId: string, id: string, action: 'editar' | 'apagar') {
  const tweet = await prisma.tweet.findUnique({
    where: { id },
    select: {
      authorId: true,
      content: true,
      retweetOfId: true,
      _count: { select: { media: true } },
    },
  });
  if (!tweet || tweet.retweetOfId) throw notFound();
  if (tweet.authorId !== userId) {
    throw new AppError(403, `Você só pode ${action} seus próprios posts`, 'FORBIDDEN');
  }
  return tweet;
}

export async function update(userId: string, id: string, { content }: UpdateTweetData) {
  const current = await findOwnTweet(userId, id, 'editar');

  if (!content && current._count.media === 0) {
    throw new AppError(400, 'Dados inválidos', 'VALIDATION_ERROR', {
      content: ['O post não pode ficar vazio'],
    });
  }

  // Salvar sem mudar nada não marca como "Editado"
  if (content !== current.content) {
    await prisma.tweet.update({ where: { id }, data: { content, editedAt: new Date() } });
  }
  return getById(userId, id);
}

export async function remove(userId: string, id: string) {
  await findOwnTweet(userId, id, 'apagar');
  await prisma.tweet.delete({ where: { id } });
}

// ---------- interações (todas idempotentes) ----------

export async function setLike(userId: string, id: string, liked: boolean) {
  const tweetId = await resolveOriginalId(id);
  if (liked) await prisma.like.createMany({ data: [{ userId, tweetId }], skipDuplicates: true });
  else await prisma.like.deleteMany({ where: { userId, tweetId } });
}

export async function setBookmark(userId: string, id: string, bookmarked: boolean) {
  const tweetId = await resolveOriginalId(id);
  if (bookmarked) {
    await prisma.bookmark.createMany({ data: [{ userId, tweetId }], skipDuplicates: true });
  } else {
    await prisma.bookmark.deleteMany({ where: { userId, tweetId } });
  }
}

/** Repost = uma linha nova em tweets apontando para o original (no máximo uma por pessoa). */
export async function setRetweet(userId: string, id: string, retweeted: boolean) {
  const retweetOfId = await resolveOriginalId(id);
  if (retweeted) {
    await prisma.tweet.createMany({
      data: [{ authorId: userId, retweetOfId }],
      skipDuplicates: true,
    });
  } else {
    await prisma.tweet.deleteMany({ where: { authorId: userId, retweetOfId } });
  }
}
