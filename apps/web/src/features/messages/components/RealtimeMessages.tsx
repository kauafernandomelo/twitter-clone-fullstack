import {
  type ConversationReadPayload,
  type ConversationSummary,
  MessageEvent,
  type MessageNewPayload,
} from '@twitter-clone/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useCurrentUser } from '@/features/auth/api';
import { onSocketEvent } from '@/lib/socket';

import { addMessageToCache, messageKeys } from '../api';

/** Mantém o cache das conversas em dia com os eventos de tempo real. */
export function RealtimeMessages() {
  const queryClient = useQueryClient();
  const me = useCurrentUser();

  useEffect(() => {
    const stopNew = onSocketEvent(MessageEvent.NEW, (payload) => {
      const { conversationId, message } = payload as MessageNewPayload;
      addMessageToCache(queryClient, conversationId, message);
      void queryClient.invalidateQueries({ queryKey: messageKeys.inbox });
      void queryClient.invalidateQueries({ queryKey: messageKeys.unread });
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversation(conversationId) });
    });

    const stopRead = onSocketEvent(MessageEvent.READ, (payload) => {
      const { conversationId, userId, lastReadAt } = payload as ConversationReadPayload;
      if (userId === me.id) {
        // li em outra aba: atualiza contadores
        void queryClient.invalidateQueries({ queryKey: messageKeys.unread });
        void queryClient.invalidateQueries({ queryKey: messageKeys.inbox });
        return;
      }
      // a outra pessoa leu: aparece o "Visto"
      queryClient.setQueryData<ConversationSummary>(
        messageKeys.conversation(conversationId),
        (conversation) =>
          conversation ? { ...conversation, otherLastReadAt: lastReadAt } : conversation,
      );
    });

    return () => {
      stopNew();
      stopRead();
    };
  }, [queryClient, me.id]);

  return null;
}
