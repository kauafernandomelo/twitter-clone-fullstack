import type {
  Paginated,
  searchQuerySchema,
  Trend,
  Tweet,
  userSearchQuerySchema,
} from '@twitter-clone/shared';
import { z } from 'zod';

import { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../lib/app-error';
import { prisma } from '../../lib/prisma';
import { entrySelect, toTweet } from '../tweets/tweets.select';
import { paginate } from '../tweets/tweets.service';
import { summarySelect, toUserSummary } from '../users/users.select';

type SearchQuery = z.output<typeof searchQuerySchema>;
type UserSearchQuery = z.output<typeof userSearchQuerySchema>;

const invalidCursor = () => new AppError(400, 'Cursor inválido', 'VALIDATION_ERROR');

/** Busca posts completos pelos ids, mantendo a ordem dos ids (a do ranking). */
async function loadInOrder(viewerId: string, ids: string[]) {
  const rows = await prisma.tweet.findMany({
    where: { id: { in: ids } },
    select: entrySelect(viewerId),
  });
  const byId = new Map(rows.map((row) => [row.id, toTweet(row)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/**
 * Busca de posts com o full-text do Postgres:
 * - websearch_to_tsquery entende a sintaxe que as pessoas já usam ("frase exata", -excluir, OR)
 * - immutable_unaccent ignora acentos ("cafe" acha "café")
 * - 'portuguese' faz stemming ("programando" acha "programar")
 * - o índice GIN em search_vector deixa isso rápido mesmo com muitos posts
 */
export async function searchTweets(viewerId: string, { q, tab, cursor, limit }: SearchQuery) {
  // "#tag" sozinha = posts com aquela hashtag (mais preciso que o full-text)
  const hashtag = /^#([\p{L}\p{N}_]+)$/u.exec(q)?.[1];
  if (hashtag) return listByHashtag(viewerId, hashtag, { cursor, limit });

  const query = Prisma.sql`websearch_to_tsquery('portuguese', immutable_unaccent(${q}))`;

  if (tab === 'latest') {
    if (cursor && !z.uuid().safeParse(cursor).success) throw invalidCursor();
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM tweets
      WHERE retweet_of_id IS NULL
        AND search_vector @@ ${query}
        ${cursor ? Prisma.sql`AND id < ${cursor}::uuid` : Prisma.empty}
      ORDER BY id DESC
      LIMIT ${limit + 1}`;
    const items = await loadInOrder(
      viewerId,
      rows.slice(0, limit).map((row) => row.id),
    );
    return {
      items,
      nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null,
    } satisfies Paginated<Tweet>;
  }

  // relevância: não existe um cursor natural, então o cursor é o deslocamento (offset)
  const offset = cursor ? Number(cursor) : 0;
  if (!Number.isInteger(offset) || offset < 0 || offset > 1000) throw invalidCursor();
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM tweets
    WHERE retweet_of_id IS NULL AND search_vector @@ ${query}
    ORDER BY ts_rank(search_vector, ${query}) DESC, id DESC
    LIMIT ${limit + 1} OFFSET ${offset}`;
  const items = await loadInOrder(
    viewerId,
    rows.slice(0, limit).map((row) => row.id),
  );
  return {
    items,
    nextCursor: rows.length > limit ? String(offset + limit) : null,
  } satisfies Paginated<Tweet>;
}

export function listByHashtag(
  viewerId: string,
  tag: string,
  query: { cursor?: string; limit: number },
) {
  if (query.cursor && !z.uuid().safeParse(query.cursor).success) throw invalidCursor();
  return paginate(viewerId, { hashtags: { some: { tag: tag.toLowerCase() } } }, query);
}

/** Pessoas: username começando pelo termo ou nome contendo o termo; mais seguidas primeiro. */
export async function searchUsers(viewerId: string, { q, limit }: UserSearchQuery) {
  const term = q.replace(/^@/, '');
  if (!term) return [];
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { startsWith: term.toLowerCase() } },
        { name: { contains: term, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ followers: { _count: 'desc' } }, { id: 'desc' }],
    take: limit,
    select: summarySelect(viewerId),
  });
  return users.map(toUserSummary);
}

const TREND_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Assuntos do momento: hashtags mais usadas nas últimas 24h. */
export async function trends(limit = 5): Promise<Trend[]> {
  const rows = await prisma.tweetHashtag.groupBy({
    by: ['tag'],
    where: { createdAt: { gte: new Date(Date.now() - TREND_WINDOW_MS) } },
    _count: { tag: true },
    orderBy: [{ _count: { tag: 'desc' } }, { tag: 'asc' }],
    take: limit,
  });
  return rows.map((row) => ({ tag: row.tag, count: row._count.tag }));
}
