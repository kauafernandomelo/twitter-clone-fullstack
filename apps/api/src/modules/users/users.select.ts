import type { UserProfile, UserSummary } from '@twitter-clone/shared';

import type { Prisma } from '../../generated/prisma/client';

/**
 * Relação entre o usuário listado e quem está vendo (viewer), numa única query:
 * - followers filtrado pelo viewer → "eu sigo essa pessoa?"
 * - following filtrado pelo viewer → "essa pessoa me segue?"
 * take: 1 porque só interessa saber se existe.
 */
function viewerRelation(viewerId: string) {
  return {
    followers: { where: { followerId: viewerId }, select: { id: true }, take: 1 },
    following: { where: { followingId: viewerId }, select: { id: true }, take: 1 },
  } satisfies Prisma.UserSelect;
}

export function summarySelect(viewerId: string) {
  return {
    id: true,
    name: true,
    username: true,
    avatarUrl: true,
    bio: true,
    ...viewerRelation(viewerId),
  } satisfies Prisma.UserSelect;
}

export function profileSelect(viewerId: string) {
  return {
    id: true,
    name: true,
    username: true,
    bio: true,
    location: true,
    website: true,
    avatarUrl: true,
    bannerUrl: true,
    createdAt: true,
    _count: { select: { tweets: true, followers: true, following: true } },
    ...viewerRelation(viewerId),
  } satisfies Prisma.UserSelect;
}

type SummaryRow = Prisma.UserGetPayload<{ select: ReturnType<typeof summarySelect> }>;
type ProfileRow = Prisma.UserGetPayload<{ select: ReturnType<typeof profileSelect> }>;

export function toUserSummary({ followers, following, ...user }: SummaryRow): UserSummary {
  return { ...user, isFollowing: followers.length > 0, followsYou: following.length > 0 };
}

export function toUserProfile({ _count, followers, following, ...user }: ProfileRow): UserProfile {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    tweetsCount: _count.tweets,
    followersCount: _count.followers,
    followingCount: _count.following,
    isFollowing: followers.length > 0,
    followsYou: following.length > 0,
  };
}
