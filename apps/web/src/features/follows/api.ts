import type {
  Paginated,
  SuggestionsResponse,
  UserProfile,
  UserSummary,
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

import { useCurrentUser } from '../auth/api';
import { tweetKeys } from '../tweets/api';
import { userKeys } from '../users/api';

function useUserList(queryKey: readonly unknown[], path: string) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      api<Paginated<UserSummary>>(pageParam ? `${path}?cursor=${pageParam}` : path),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export const useFollowers = (username: string) =>
  useUserList(userKeys.followers(username), `/users/${encodeURIComponent(username)}/followers`);

export const useFollowing = (username: string) =>
  useUserList(userKeys.following(username), `/users/${encodeURIComponent(username)}/following`);

export function useSuggestions() {
  return useQuery({
    queryKey: userKeys.suggestions,
    queryFn: async () => (await api<SuggestionsResponse>('/suggestions?limit=3')).users,
    // a lista não muda a cada segundo; evita refazer a busca a cada navegação
    staleTime: 5 * 60_000,
  });
}

type UserPages = InfiniteData<Paginated<UserSummary>, string | undefined>;

/**
 * Aplica "segui/deixei de seguir" em todo o cache: perfil da pessoa (flag + seguidores),
 * meu perfil (seguindo), listas de usuários e sugestões. Usado no update otimista e,
 * com o valor invertido, para desfazer se a API falhar.
 */
function applyFollowState(
  queryClient: QueryClient,
  { username, me, following }: { username: string; me: string; following: boolean },
) {
  const delta = following ? 1 : -1;
  const target = username.toLowerCase();
  const update = (user: UserSummary) =>
    user.username === target ? { ...user, isFollowing: following } : user;

  queryClient.setQueryData<UserProfile>(userKeys.profile(target), (profile) =>
    profile
      ? { ...profile, isFollowing: following, followersCount: profile.followersCount + delta }
      : profile,
  );
  queryClient.setQueryData<UserProfile>(userKeys.profile(me), (profile) =>
    profile ? { ...profile, followingCount: profile.followingCount + delta } : profile,
  );
  queryClient.setQueriesData<UserPages>({ queryKey: userKeys.lists }, (data) =>
    data
      ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map(update) })) }
      : data,
  );
  queryClient.setQueryData<UserSummary[]>(userKeys.suggestions, (users) => users?.map(update));
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const me = useCurrentUser().username;

  return useMutation({
    mutationFn: ({ username, follow }: { username: string; follow: boolean }) =>
      api<void>(`/users/${encodeURIComponent(username)}/follow`, {
        method: follow ? 'POST' : 'DELETE',
      }),
    // Otimista: o botão muda na hora; se a API falhar, desfazemos.
    onMutate: ({ username, follow }) =>
      applyFollowState(queryClient, { username, me, following: follow }),
    onError: (_error, { username, follow }) =>
      applyFollowState(queryClient, { username, me, following: !follow }),
    // o feed "Seguindo" muda quando eu sigo/deixo de seguir alguém
    onSettled: () => queryClient.invalidateQueries({ queryKey: tweetKeys.following }),
  });
}
