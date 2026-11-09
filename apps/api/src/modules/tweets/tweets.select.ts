import type { QuotedTweet, Tweet, TweetAuthor } from '@twitter-clone/shared';

import type { Prisma } from '../../generated/prisma/client';

const authorSelect = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const mediaSelect = {
  select: { url: true, width: true, height: true },
  orderBy: { position: 'asc' },
} satisfies Prisma.Tweet$mediaArgs;

const quotedSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: { select: authorSelect },
  media: mediaSelect,
} satisfies Prisma.TweetSelect;

/**
 * Tudo que a tela precisa de um post, numa query só:
 * contadores (_count), o que o viewer já fez (likes/retweets/bookmarks filtrados por ele,
 * take 1 só para saber se existe), o post respondido e o post citado.
 */
function postSelect(viewerId: string) {
  return {
    id: true,
    content: true,
    createdAt: true,
    editedAt: true,
    isReply: true,
    isQuote: true,
    author: { select: authorSelect },
    media: mediaSelect,
    replyTo: { select: { id: true, author: { select: { username: true } } } },
    quoteOf: { select: quotedSelect },
    _count: { select: { replies: true, retweets: true, quotes: true, likes: true } },
    likes: { where: { userId: viewerId }, select: { id: true }, take: 1 },
    retweets: { where: { authorId: viewerId }, select: { id: true }, take: 1 },
    bookmarks: { where: { userId: viewerId }, select: { id: true }, take: 1 },
  } satisfies Prisma.TweetSelect;
}

/** Uma linha de timeline: pode ser um post ou um repost (aí o conteúdo vem de retweetOf). */
export function entrySelect(viewerId: string) {
  return {
    ...postSelect(viewerId),
    retweetOf: { select: postSelect(viewerId) },
  } satisfies Prisma.TweetSelect;
}

type PostRow = Prisma.TweetGetPayload<{ select: ReturnType<typeof postSelect> }>;
export type EntryRow = Prisma.TweetGetPayload<{ select: ReturnType<typeof entrySelect> }>;
type QuotedRow = Prisma.TweetGetPayload<{ select: typeof quotedSelect }>;

function toQuoted(row: QuotedRow): QuotedTweet {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

function fromPost(row: PostRow, entryId: string, repostedBy: TweetAuthor | null): Tweet {
  return {
    id: row.id,
    entryId,
    content: row.content,
    media: row.media,
    author: row.author,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    isReply: row.isReply,
    replyTo: row.replyTo,
    isQuote: row.isQuote,
    quote: row.quoteOf ? toQuoted(row.quoteOf) : null,
    stats: {
      replies: row._count.replies,
      retweets: row._count.retweets,
      quotes: row._count.quotes,
      likes: row._count.likes,
    },
    viewer: {
      liked: row.likes.length > 0,
      retweeted: row.retweets.length > 0,
      bookmarked: row.bookmarks.length > 0,
    },
    repostedBy,
  };
}

export function toTweet(row: EntryRow): Tweet {
  // repost: mostra o original, mas a entrada (chave da lista) é a linha do repost
  if (row.retweetOf) return fromPost(row.retweetOf, row.id, row.author);
  return fromPost(row, row.id, null);
}
