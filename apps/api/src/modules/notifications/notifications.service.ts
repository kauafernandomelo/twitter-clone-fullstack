import {
  type NotificationItem,
  type notificationsQuerySchema,
  type NotificationType,
  type Paginated,
  SocketEvent,
} from '@twitter-clone/shared';
import type { z } from 'zod';

import { type NotificationType as DbNotificationType, Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { emitToUser } from '../../lib/socket';
import { entrySelect, toTweet } from '../tweets/tweets.select';

type NotificationsQuery = z.output<typeof notificationsQuerySchema>;

export type NotificationEvent = {
  recipientId: string;
  actorId: string;
  type: DbNotificationType;
  tweetId?: string | null;
};

/** Cria a notificação e avisa o destinatário em tempo real. Ação em si mesmo não notifica. */
export async function notify(event: NotificationEvent) {
  if (event.recipientId === event.actorId) return;
  await prisma.notification.create({
    data: { ...event, tweetId: event.tweetId ?? null },
  });
  emitToUser(event.recipientId, SocketEvent.NOTIFICATION);
}

/** Desfaz (descurtir, desfazer repost, deixar de seguir, tirar a menção na edição). */
export async function unnotify(event: NotificationEvent) {
  const { count } = await prisma.notification.deleteMany({
    where: { ...event, tweetId: event.tweetId ?? null },
  });
  // o contador de não lidas pode ter mudado
  if (count > 0) emitToUser(event.recipientId, SocketEvent.NOTIFICATION);
}

/**
 * Chave de agrupamento:
 * - curtidas e reposts do mesmo post viram uma linha só ("Maria e mais 2 curtiram")
 * - follows do mesmo dia também
 * - respostas, citações e menções ficam individuais (cada uma tem conteúdo próprio)
 */
const GROUP_KEY = Prisma.sql`
  CASE
    WHEN type IN ('LIKE', 'RETWEET') THEN lower(type::text) || ':' || tweet_id::text
    WHEN type = 'FOLLOW' THEN 'follow:' || to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
    ELSE 'single:' || id::text
  END`;

const MENTION_TYPES = Prisma.sql`('REPLY', 'QUOTE', 'MENTION')`;

type GroupRow = {
  group_key: string;
  latest_id: string;
  type: DbNotificationType;
  tweet_id: string | null;
  count: number;
  unread: boolean;
  created_at: Date;
  actor_ids: string[];
};

const MAX_ACTORS_SHOWN = 3;

export async function list(
  userId: string,
  { filter, cursor, limit }: NotificationsQuery,
): Promise<Paginated<NotificationItem>> {
  // uuid v7 em texto ordena igual ao tempo (hex de tamanho fixo), por isso max(id::text)
  const groups = await prisma.$queryRaw<GroupRow[]>`
    SELECT group_key,
           max(id::text) AS latest_id,
           (array_agg(type))[1] AS type,
           (array_agg(tweet_id))[1] AS tweet_id,
           count(*)::int AS count,
           bool_or(read_at IS NULL) AS unread,
           max(created_at) AS created_at,
           (array_agg(actor_id ORDER BY id DESC))[1:${MAX_ACTORS_SHOWN}] AS actor_ids
    FROM (
      SELECT *, ${GROUP_KEY} AS group_key
      FROM notifications
      WHERE recipient_id = ${userId}::uuid
        ${filter === 'mentions' ? Prisma.sql`AND type IN ${MENTION_TYPES}` : Prisma.empty}
    ) n
    GROUP BY group_key
    ${cursor ? Prisma.sql`HAVING max(id::text) < ${cursor}` : Prisma.empty}
    ORDER BY latest_id DESC
    LIMIT ${limit + 1}`;

  const page = groups.slice(0, limit);
  const actorIds = [...new Set(page.flatMap((group) => group.actor_ids))];
  const tweetIds = [...new Set(page.flatMap((group) => group.tweet_id ?? []))];

  const [actors, tweets] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, username: true, avatarUrl: true },
    }),
    prisma.tweet.findMany({ where: { id: { in: tweetIds } }, select: entrySelect(userId) }),
  ]);
  const actorById = new Map(actors.map((actor) => [actor.id, actor]));
  const tweetById = new Map(tweets.map((row) => [row.id, toTweet(row)]));

  const items = page.map((group) => ({
    id: group.group_key,
    type: group.type.toLowerCase() as NotificationType,
    actors: group.actor_ids.flatMap((id) => actorById.get(id) ?? []),
    actorsCount: group.count,
    tweet: group.tweet_id ? (tweetById.get(group.tweet_id) ?? null) : null,
    createdAt: group.created_at.toISOString(),
    read: !group.unread,
  }));

  return { items, nextCursor: groups.length > limit ? (page.at(-1)?.latest_id ?? null) : null };
}

/** Quantos itens (grupos) da lista ainda não foram vistos: é o número da bolinha azul. */
export async function unreadCount(userId: string) {
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT count(DISTINCT ${GROUP_KEY})::int AS count
    FROM notifications
    WHERE recipient_id = ${userId}::uuid AND read_at IS NULL`;
  return row?.count ?? 0;
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  emitToUser(userId, SocketEvent.NOTIFICATION); // outras abas abertas zeram o contador
}
