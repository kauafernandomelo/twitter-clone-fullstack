import type {
  CreateTweetInput,
  Paginated,
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

// Listas ficam sob ['tweets', 'list', ...] e o post avulso em ['tweet', id]:
// assim dá para atualizar "todas as listas" de uma vez sem pegar o detalhe por engano.
export const tweetKeys = {
  lists: ['tweets', 'list'] as const,
  timeline: ['tweets', 'list', 'timeline'] as const,
  following: ['tweets', 'list', 'following'] as const,
  byUser: (username: string) => ['tweets', 'list', 'user', username.toLowerCase()] as const,
  detail: (id: string) => ['tweet', id] as const,
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

export const useUserTweets = (username: string) =>
  useTweetList(tweetKeys.byUser(username), `/users/${encodeURIComponent(username)}/tweets`);

export function useTweet(id: string) {
  return useQuery({
    queryKey: tweetKeys.detail(id),
    queryFn: async () => (await api<TweetResponse>(`/tweets/${id}`)).tweet,
  });
}

// ---------- atualização do cache (sem refazer as requests) ----------

function mapLists(queryClient: QueryClient, map: (items: Tweet[]) => Tweet[]) {
  queryClient.setQueriesData<TweetPages>({ queryKey: tweetKeys.lists }, (data) =>
    data
      ? { ...data, pages: data.pages.map((page) => ({ ...page, items: map(page.items) })) }
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

// ---------- mutations ----------

export function useCreateTweet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTweetInput) =>
      (await api<TweetResponse>('/tweets', { method: 'POST', body: input })).tweet,
    onSuccess: (tweet) => {
      prependTo(queryClient, tweetKeys.timeline, tweet);
      prependTo(queryClient, tweetKeys.following, tweet);
      prependTo(queryClient, tweetKeys.byUser(tweet.author.username), tweet);
      adjustTweetsCount(queryClient, tweet.author.username, +1);
    },
  });
}

export function useUpdateTweet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTweetInput & { id: string }) =>
      (await api<TweetResponse>(`/tweets/${id}`, { method: 'PATCH', body: input })).tweet,
    onSuccess: (tweet) => {
      mapLists(queryClient, (items) => items.map((item) => (item.id === tweet.id ? tweet : item)));
      queryClient.setQueryData(tweetKeys.detail(tweet.id), tweet);
    },
  });
}

export function useDeleteTweet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tweet: Tweet) => api<void>(`/tweets/${tweet.id}`, { method: 'DELETE' }),
    onSuccess: (_, tweet) => {
      mapLists(queryClient, (items) => items.filter((item) => item.id !== tweet.id));
      queryClient.removeQueries({ queryKey: tweetKeys.detail(tweet.id) });
      adjustTweetsCount(queryClient, tweet.author.username, -1);
    },
  });
}
