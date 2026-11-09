import { SocketEvent } from '@twitter-clone/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { connectSocket, disconnectSocket, onSocketEvent } from '@/lib/socket';

import { notificationKeys, useUnreadCount } from '../api';

const BASE_TITLE = 'Twitter Clone';

/**
 * Liga o tempo real enquanto há alguém logado (vive dentro do layout autenticado):
 * a cada evento, recarrega o contador e as listas de notificações.
 * Também mostra o número de não lidas no título da aba: "(3) Twitter Clone".
 */
export function RealtimeNotifications() {
  const queryClient = useQueryClient();
  const { data: unread = 0 } = useUnreadCount();

  useEffect(() => {
    connectSocket();
    const stop = onSocketEvent(SocketEvent.NOTIFICATION, () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
    return () => {
      stop();
      disconnectSocket();
    };
  }, [queryClient]);

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [unread]);

  return null;
}
