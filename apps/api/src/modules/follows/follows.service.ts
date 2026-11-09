import type { cursorQuerySchema, Paginated, UserSummary } from '@twitter-clone/shared';
import type { z } from 'zod';

import { AppError } from '../../lib/app-error';
import { prisma } from '../../lib/prisma';
import { notify, unnotify } from '../notifications/notifications.service';
import { summarySelect, toUserSummary } from '../users/users.select';
import { findUserIdByUsername } from '../users/users.service';

type CursorQuery = z.output<typeof cursorQuerySchema>;

async function resolveTarget(viewerId: string, username: string) {
  const targetId = await findUserIdByUsername(username);
  if (targetId === viewerId) {
    throw new AppError(400, 'Você não pode seguir a si mesmo', 'VALIDATION_ERROR');
  }
  return targetId;
}

// Seguir e deixar de seguir são idempotentes: repetir a ação não dá erro nem duplica.
// (O botão pode ser clicado duas vezes, a rede pode reenviar a request...)
export async function follow(viewerId: string, username: string) {
  const followingId = await resolveTarget(viewerId, username);
  const { count } = await prisma.follow.createMany({
    data: [{ followerId: viewerId, followingId }],
    skipDuplicates: true,
  });
  if (count > 0) await notify({ recipientId: followingId, actorId: viewerId, type: 'FOLLOW' });
}

export async function unfollow(viewerId: string, username: string) {
  const followingId = await resolveTarget(viewerId, username);
  const { count } = await prisma.follow.deleteMany({
    where: { followerId: viewerId, followingId },
  });
  if (count > 0) await unnotify({ recipientId: followingId, actorId: viewerId, type: 'FOLLOW' });
}

/**
 * Lista paginada de seguidores ou de quem a pessoa segue, mais recentes primeiro.
 * O cursor é o id da linha em `follows` (UUID v7, ordenado pelo tempo).
 */
async function listConnections(
  viewerId: string,
  username: string,
  direction: 'followers' | 'following',
  { cursor, limit }: CursorQuery,
): Promise<Paginated<UserSummary>> {
  const userId = await findUserIdByUsername(username);
  const base = { orderBy: { id: 'desc' }, take: limit + 1 } as const;
  const cursorWhere = cursor ? { id: { lt: cursor } } : {};
  const user = { select: summarySelect(viewerId) };

  // seguidores: linhas em que a pessoa é o "seguido" → mostramos quem segue (follower)
  // seguindo:   linhas em que a pessoa é o "seguidor" → mostramos quem é seguido (following)
  const rows =
    direction === 'followers'
      ? (
          await prisma.follow.findMany({
            ...base,
            where: { followingId: userId, ...cursorWhere },
            select: { id: true, follower: user },
          })
        ).map((row) => ({ id: row.id, user: row.follower }))
      : (
          await prisma.follow.findMany({
            ...base,
            where: { followerId: userId, ...cursorWhere },
            select: { id: true, following: user },
          })
        ).map((row) => ({ id: row.id, user: row.following }));

  const page = rows.slice(0, limit);
  return {
    items: page.map((row) => toUserSummary(row.user)),
    nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
  };
}

export const listFollowers = (viewerId: string, username: string, query: CursorQuery) =>
  listConnections(viewerId, username, 'followers', query);

export const listFollowing = (viewerId: string, username: string, query: CursorQuery) =>
  listConnections(viewerId, username, 'following', query);

/** "Quem seguir": contas mais seguidas que eu ainda não sigo (desempate: mais recentes). */
export async function suggestions(viewerId: string, limit = 3) {
  const users = await prisma.user.findMany({
    where: { id: { not: viewerId }, followers: { none: { followerId: viewerId } } },
    orderBy: [{ followers: { _count: 'desc' } }, { id: 'desc' }],
    take: limit,
    select: summarySelect(viewerId),
  });
  return users.map(toUserSummary);
}
