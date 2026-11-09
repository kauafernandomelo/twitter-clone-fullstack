import type {
  Paginated,
  SearchTab,
  SuggestionsResponse,
  TrendsResponse,
  Tweet,
} from '@twitter-clone/shared';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

// Resultados de busca ficam sob ['tweets', 'list', ...]: curtir/repostar num resultado
// atualiza o cache igual a qualquer outra lista de posts.
export const searchKeys = {
  tweets: (q: string, tab: SearchTab) => ['tweets', 'list', 'search', q, tab] as const,
  hashtag: (tag: string) => ['tweets', 'list', 'hashtag', tag.toLowerCase()] as const,
  users: (q: string) => ['users', 'search', q] as const,
  trends: ['trends'] as const,
};

export function useSearchTweets(q: string, tab: SearchTab) {
  return useInfiniteQuery({
    queryKey: searchKeys.tweets(q, tab),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ q, tab, ...(pageParam && { cursor: pageParam }) });
      return api<Paginated<Tweet>>(`/search/tweets?${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useHashtagTweets(tag: string) {
  return useInfiniteQuery({
    queryKey: searchKeys.hashtag(tag),
    queryFn: ({ pageParam }) =>
      api<Paginated<Tweet>>(
        `/hashtags/${encodeURIComponent(tag)}/tweets${pageParam ? `?cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useSearchUsers(q: string, { limit = 10, enabled = true } = {}) {
  return useQuery({
    queryKey: [...searchKeys.users(q), limit],
    queryFn: async () => {
      const params = new URLSearchParams({ q, limit: String(limit) });
      return (await api<SuggestionsResponse>(`/search/users?${params}`)).users;
    },
    enabled: enabled && q.trim().length > 0,
    // enquanto a próxima busca carrega, mantém a lista anterior (sem "piscar")
    placeholderData: keepPreviousData,
  });
}

export function useTrends() {
  return useQuery({
    queryKey: searchKeys.trends,
    queryFn: async () => (await api<TrendsResponse>('/trends')).trends,
    staleTime: 60_000,
  });
}
