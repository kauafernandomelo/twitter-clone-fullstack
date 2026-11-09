import type { NotificationItem, Paginated, UnreadCountResponse } from '@twitter-clone/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

export type NotificationFilter = 'all' | 'mentions';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filter: NotificationFilter) => ['notifications', 'list', filter] as const,
  unread: ['notifications', 'unread'] as const,
};

export function useNotifications(filter: NotificationFilter) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ filter, ...(pageParam && { cursor: pageParam }) });
      return api<Paginated<NotificationItem>>(`/notifications?${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => (await api<UnreadCountResponse>('/notifications/unread-count')).count,
    // o tempo real avisa quando muda; isto é só a rede de segurança se o socket cair
    refetchInterval: 60_000,
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/notifications/read', { method: 'POST' }),
    onSuccess: () => queryClient.setQueryData(notificationKeys.unread, 0),
  });
}
