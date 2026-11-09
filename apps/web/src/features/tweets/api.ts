import type {
  CreateTweetInput,
  Paginated,
  ThreadResponse,
  Tweet,
  TweetResponse,
  UpdateTweetInput,
  UserProfile,
} from '@twitter-clone/shared';
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api';

import { profileQueryKey } from '../users/api';

export type ProfileTab = 'tweets' | 'replies' | 'media' | 'likes';

// Listas ficam sob ['tweets', 'list', ...] e o post avulso em ['tweet', id] (e a conversa
// acima dele em ['tweet', id, 'thread']): dá para atualizar tudo de um post de uma vez.
export const tweetKeys = {
  lists: ['tweets', 'list'] as const,
  timeline: ['tweets', 'list', 'timeline'] as const,
  following: ['tweets', 'list', 'following'] as const,
  byUser: (username: string, tab: ProfileTab = 'tweets') =>
    ['tweets', 'list', 'user', username.toLowerCase(), tab] as const,
  replies: (id: string) => ['tweets', 'list', 'replies', id] as const,
  bookmarks: ['tweets', 'list', 'bookmarks'] as const,
  detail: (id: string) => ['tweet', id] as const,
  thread: (id: string) => ['tweet', id, 'thread'] as const,
};

type TweetPages = InfiniteData<Paginated<Tweet>, string | undefined>;

function useTweetList(queryKey: readonly unknown[], path: string) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      api<Paginated<Tweet>>(pageParam ? `${path}?cursor=${pageParam}` : path),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export const useTimeline = () => useTweetList(tweetKeys.timeline, '/tweets');

export const useFollowingFeed = () => useTweetList(tweetKeys.following, '/feed/following');

export const useUserTweets = (username: string, tab: ProfileTab = 'tweets') =>
  useTweetList(tweetKeys.byUser(username, tab), `/users/${encodeURIComponent(username)}/${tab}`);

export const useReplies = (id: string) =>
  useTweetList(tweetKeys.replies(id), `/tweets/${id}/replies`);

export const useBookmarks = () => useTweetList(tweetKeys.bookmarks, '/bookmarks');

export function useTweet(id: string) {
  return useQuery({
    queryKey: tweetKeys.detail(id),
    queryFn: async () => (await api<TweetResponse>(`/tweets/${id}`)).tweet,
  });
}

export function useThread(id: string, enabled: boolean) {
  return useQuery({
    queryKey: tweetKeys.thread(id),
    queryFn: async () => (await api<ThreadResponse>(`/tweets/${id}/thread`)).ancestors,
    enabled,
  });
}

// ---------- atualização do cache (sem refazer as requests) ----------

/**
 * Aplica uma mudança em um post onde quer que ele esteja no cache: listas, página do post e
 * conversas. Num repost, a entrada da lista mantém o próprio entryId/repostedBy.
 */
export function updateTweetInCache(
  queryClient: QueryClient,
  id: string,
  update: (tweet: Tweet) => Tweet,
) {
  const apply = (tweet: Tweet) =>
    tweet.id === id
      ? { ...update(tweet), entryId: tweet.entryId, repostedBy: tweet.repostedBy }
      : tweet;

  queryClient.setQueriesData<TweetPages>({ queryKey: tweetKeys.lists }, (data) =>
    data
      ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map(apply) })) }
      : data,
  );
  queryClient.setQueriesData<Tweet | Tweet[]>({ queryKey: ['tweet'] }, (data) => {
    if (!data) return data;
    return Array.isArray(data) ? data.map(apply) : apply(data);
  });
}

/** Remove o post de todas as listas sob `queryKey` (ex.: tweetKeys.lists = todas). */
function removeFromList(queryClient: QueryClient, queryKey: readonly unknown[], id: string) {
  queryClient.setQueriesData<TweetPages>({ queryKey }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.filter((t) => t.id !== id),
          })),
        }
      : data,
  );
}

function prependTo(queryClient: QueryClient, queryKey: readonly unknown[], tweet: Tweet) {
  queryClient.setQueryData<TweetPages>(queryKey, (data) => {
    const [first, ...rest] = data?.pages ?? [];
    if (!data || !first) return data;
    return { ...data, pages: [{ ...first, items: [tweet, ...first.items] }, ...rest] };
  });
}

function adjustTweetsCount(queryClient: QueryClient, username: string, delta: number) {
  queryClient.setQueryData<UserProfile>(profileQueryKey(username), (profile) =>
    profile ? { ...profile, tweetsCount: Math.max(0, profile.tweetsCount + delta) } : profile,
  );
}

const bumpStat = (stat: keyof Tweet['stats'], delta: number) => (tweet: Tweet) => ({
  ...tweet,
  stats: { ...tweet.stats, [stat]: Math.max(0, tweet.stats[stat] + delta) },
});

// ---------- mutations ----------

export function useCreateTweet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTweetInput) =>
      (await api<TweetResponse>('/tweets', { method: 'POST', body: input })).tweet,
    onSuccess: (tweet) => {
      const { username } = tweet.author;
      adjustTweetsCount(queryClient, username, +1);

      if (tweet.replyTo) {
        updateTweetInCache(queryClient, tweet.replyTo.id, bumpStat('replies', +1));
        prependTo(queryClient, tweetKeys.byUser(username, 'replies'), tweet);
        // respostas aparecem em ordem cronológica: recarrega a lista para a nova entrar no fim
        void queryClient.invalidateQueries({ queryKey: tweetKeys.replies(tweet.replyTo.id) });
        return;
      }

      if (tweet.quote) updateTweetInCache(queryClient, tweet.quote.id, bumpStat('quotes', +1));
      prependTo(queryClient, tweetKeys.timeline, tweet);
      prependTo(queryClient, tweetKeys.following, tweet);
      prependTo(queryClient, tweetKeys.byUser(username), tweet);
      if (tweet.media.length > 0)
        prependTo(queryClient, tweetKeys.byUser(username, 'media'), tweet);
    },
  });
}

export function useUpdateTweet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTweetInput & { id: string }) =>
      (await api<TweetResponse>(`/tweets/${id}`, { method: 'PATCH', body: input })).tweet,
    onSuccess: (updated) =>
      updateTweetInCache(queryClient, updated.id, (tweet) => ({
        ...tweet,
        content: updated.content,
        editedAt: updated.editedAt,
      })),
  });
}

export function useDeleteTweet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tweet: Tweet) => api<void>(`/tweets/${tweet.id}`, { method: 'DELETE' }),
    onSuccess: (_, tweet) => {
      // também some com os reposts dele (mesmo id original), como no banco
      removeFromList(queryClient, tweetKeys.lists, tweet.id);
      queryClient.removeQueries({ queryKey: tweetKeys.detail(tweet.id) });
      adjustTweetsCount(queryClient, tweet.author.username, -1);
      if (tweet.replyTo) updateTweetInCache(queryClient, tweet.replyTo.id, bumpStat('replies', -1));
      if (tweet.quote) updateTweetInCache(queryClient, tweet.quote.id, bumpStat('quotes', -1));
    },
  });
}

// Curtir, repostar e salvar seguem o mesmo padrão: POST liga, DELETE desliga.
const interactions = {
  like: { path: 'like', flag: 'liked', stat: 'likes' },
  retweet: { path: 'retweet', flag: 'retweeted', stat: 'retweets' },
  bookmark: { path: 'bookmark', flag: 'bookmarked', stat: null },
} as const;

type Interaction = keyof typeof interactions;

function applyInteraction(queryClient: QueryClient, kind: Interaction, id: string, on: boolean) {
  const { flag, stat } = interactions[kind];
  updateTweetInCache(queryClient, id, (tweet) => {
    const next = { ...tweet, viewer: { ...tweet.viewer, [flag]: on } };
    return stat ? bumpStat(stat, on ? 1 : -1)(next) : next;
  });
}

/** Otimista: o ícone e o contador mudam na hora; se a API falhar, desfazemos. */
export function useToggleInteraction(kind: Interaction) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      api<void>(`/tweets/${id}/${interactions[kind].path}`, { method: on ? 'POST' : 'DELETE' }),
    onMutate: ({ id, on }) => {
      applyInteraction(queryClient, kind, id, on);
      // tirar dos salvos some com o post da página de Salvos na hora
      if (kind === 'bookmark' && !on) removeFromList(queryClient, tweetKeys.bookmarks, id);
    },
    onError: (_error, { id, on }) => {
      applyInteraction(queryClient, kind, id, !on);
      if (kind === 'bookmark')
        void queryClient.invalidateQueries({ queryKey: tweetKeys.bookmarks });
    },
    onSettled: (_data, _error, { on }) => {
      // repostar cria/remove uma entrada nas timelines; salvar adiciona na lista de salvos
      if (kind === 'retweet') void queryClient.invalidateQueries({ queryKey: tweetKeys.lists });
      if (kind === 'bookmark' && on) {
        void queryClient.invalidateQueries({ queryKey: tweetKeys.bookmarks });
      }
    },
  });
}
