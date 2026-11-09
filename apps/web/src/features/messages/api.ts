import type {
  ConversationResponse,
  ConversationSummary,
  Message,
  MessageResponse,
  Paginated,
  SendMessageInput,
  UnreadCountResponse,
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

export const messageKeys = {
  all: ['conversations'] as const,
  inbox: ['conversations', 'inbox'] as const,
  unread: ['conversations', 'unread'] as const,
  conversation: (id: string) => ['conversations', 'detail', id] as const,
  messages: (id: string) => ['conversations', 'messages', id] as const,
};

type MessagePages = InfiniteData<Paginated<Message>, string | undefined>;

export function useConversations() {
  return useInfiniteQuery({
    queryKey: messageKeys.inbox,
    queryFn: ({ pageParam }) =>
      api<Paginated<ConversationSummary>>(
        `/conversations${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: messageKeys.conversation(id),
    queryFn: async () => (await api<ConversationResponse>(`/conversations/${id}`)).conversation,
  });
}

export function useMessages(id: string) {
  return useInfiniteQuery({
    queryKey: messageKeys.messages(id),
    queryFn: ({ pageParam }) =>
      api<Paginated<Message>>(
        `/conversations/${id}/messages${pageParam ? `?cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useUnreadMessagesCount() {
  return useQuery({
    queryKey: messageKeys.unread,
    queryFn: async () => (await api<UnreadCountResponse>('/conversations/unread-count')).count,
    refetchInterval: 60_000,
  });
}

/**
 * Coloca a mensagem no topo da lista (a mais nova fica primeiro). Ignora se já estiver lá:
 * a mesma mensagem chega pela resposta do POST e pelo eco do socket.
 */
export function addMessageToCache(
  queryClient: QueryClient,
  conversationId: string,
  message: Message,
) {
  queryClient.setQueryData<MessagePages>(messageKeys.messages(conversationId), (data) => {
    const [first, ...rest] = data?.pages ?? [];
    if (!data || !first) return data;
    if (data.pages.some((page) => page.items.some((item) => item.id === message.id))) return data;
    return { ...data, pages: [{ ...first, items: [message, ...first.items] }, ...rest] };
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendMessageInput) =>
      (
        await api<MessageResponse>(`/conversations/${conversationId}/messages`, {
          method: 'POST',
          body: input,
        })
      ).message,
    onSuccess: (message) => {
      addMessageToCache(queryClient, conversationId, message);
      void queryClient.invalidateQueries({ queryKey: messageKeys.inbox });
    },
  });
}

export function useMarkConversationRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>(`/conversations/${conversationId}/read`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.unread });
      void queryClient.invalidateQueries({ queryKey: messageKeys.inbox });
    },
  });
}

export function useStartConversation() {
  return useMutation({
    mutationFn: async (username: string) =>
      (await api<ConversationResponse>('/conversations', { method: 'POST', body: { username } }))
        .conversation,
  });
}
