import { z } from 'zod';

import type { Tweet, TweetAuthor } from './tweets';

export type NotificationType = 'like' | 'retweet' | 'follow' | 'reply' | 'quote' | 'mention';

/**
 * Um item da lista de notificações. Curtidas/reposts do mesmo post e follows do mesmo dia
 * chegam agrupados: `actors` traz as pessoas mais recentes e `actorsCount` o total.
 */
export type NotificationItem = {
  /** chave do grupo (estável enquanto o grupo existir) */
  id: string;
  type: NotificationType;
  actors: TweetAuthor[];
  actorsCount: number;
  /** curtida/repost: o post que recebeu; resposta/citação/menção: o post novo. follow: null */
  tweet: Tweet | null;
  /** data da ação mais recente do grupo */
  createdAt: string;
  read: boolean;
};

export const notificationsQuerySchema = z.object({
  /** all: tudo · mentions: só respostas, citações e menções (aba "Menções") */
  filter: z.enum(['all', 'mentions']).default('all'),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type UnreadCountResponse = { count: number };

/** Eventos do Socket.IO (servidor → cliente) */
export const SocketEvent = {
  NOTIFICATION: 'notification:new',
} as const;
