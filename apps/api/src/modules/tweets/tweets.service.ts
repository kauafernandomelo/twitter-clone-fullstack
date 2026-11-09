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

type CreateTweetData = z.output<typeof createTweetSchema>;
type UpdateTweetData = z.output<typeof updateTweetSchema>;
type CursorQuery = z.output<typeof cursorQuerySchema>;

const NOT_FOUND_MESSAGE = 'Este post não existe';

export const tweetSelect = {
  id: true,
  content: true,
  createdAt: true,
  editedAt: true,
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
  media: { select: { url: true, width: true, height: true }, orderBy: { position: 'asc' } },
} satisfies Prisma.TweetSelect;

type TweetRow = Prisma.TweetGetPayload<{ select: typeof tweetSelect }>;

function toTweet(row: TweetRow): Tweet {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
  };
}

const notFound = () => new AppError(404, NOT_FOUND_MESSAGE, 'NOT_FOUND');

/**
 * Paginação por cursor: "me dê os N posts mais antigos que o id X".
 * Diferente de OFFSET, não pula nem repete itens quando posts novos chegam
 * enquanto a pessoa rola a tela, e continua rápida em listas enormes.
 * Busca N+1 para saber se existe próxima página sem precisar de um COUNT.
 */
async function paginate(where: Prisma.TweetWhereInput, { cursor, limit }: CursorQuery) {
  const rows = await prisma.tweet.findMany({
    where: { ...where, ...(cursor && { id: { lt: cursor } }) },
    orderBy: { id: 'desc' },
    take: limit + 1,
    select: tweetSelect,
  });

  const items = rows.slice(0, limit).map(toTweet);
  const nextCursor = rows.length > limit ? (items.at(-1)?.id ?? null) : null;
  return { items, nextCursor } satisfies Paginated<Tweet>;
}

/** Timeline global (todos os posts, mais novos primeiro). Vira o "Para você" na Fase 4. */
export function listRecent(query: CursorQuery) {
  return paginate({}, query);
}

export async function listByUsername(username: string, query: CursorQuery) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  if (!user) throw new AppError(404, 'Esta conta não existe', 'NOT_FOUND');
  return paginate({ authorId: user.id }, query);
}

export async function getById(id: string) {
  const tweet = await prisma.tweet.findUnique({ where: { id }, select: tweetSelect });
  if (!tweet) throw notFound();
  return toTweet(tweet);
}

export async function create(authorId: string, data: CreateTweetData) {
  const invalidMedia = data.media.some((media) => !isOwnUploadUrl(media.url, authorId, 'tweet'));
  if (invalidMedia) {
    throw new AppError(400, 'Dados inválidos', 'VALIDATION_ERROR', { media: ['Imagem inválida'] });
  }

  const tweet = await prisma.tweet.create({
    data: {
      authorId,
      content: data.content,
      media: { create: data.media.map((media, position) => ({ ...media, position })) },
    },
    select: tweetSelect,
  });
  return toTweet(tweet);
}

// Busca o post garantindo que ele existe e que quem pede é o autor.
async function findOwnTweet(userId: string, id: string, action: 'editar' | 'apagar') {
  const tweet = await prisma.tweet.findUnique({
    where: { id },
    select: { authorId: true, content: true, _count: { select: { media: true } } },
  });
  if (!tweet) throw notFound();
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
  if (content === current.content) return getById(id);

  const tweet = await prisma.tweet.update({
    where: { id },
    data: { content, editedAt: new Date() },
    select: tweetSelect,
  });
  return toTweet(tweet);
}

export async function remove(userId: string, id: string) {
  await findOwnTweet(userId, id, 'apagar');
  await prisma.tweet.delete({ where: { id } });
}
