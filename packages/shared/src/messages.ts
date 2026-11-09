import { z } from 'zod';

import type { TweetAuthor } from './tweets';

export const MESSAGE_MAX_LENGTH = 1000;

export const startConversationSchema = z.object({
  username: z.string().trim().min(1).max(15),
});

export const sendMessageSchema = z
  .object({
    content: z
      .string()
      .trim()
      .max(MESSAGE_MAX_LENGTH, `A mensagem pode ter no máximo ${MESSAGE_MAX_LENGTH} caracteres`)
      .default(''),
    image: z
      .object({
        url: z.url({ protocol: /^https$/ }),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .optional(),
  })
  .refine((message) => message.content.length > 0 || message.image, {
    message: 'Escreva uma mensagem ou anexe uma imagem',
    path: ['content'],
  });

export type SendMessageInput = z.input<typeof sendMessageSchema>;

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  image: { url: string; width: number; height: number } | null;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  /** a outra pessoa da conversa */
  other: TweetAuthor;
  lastMessage: Message | null;
  /** mensagens da outra pessoa que eu ainda não li */
  unreadCount: number;
  /** até quando a outra pessoa leu (para o "Visto") */
  otherLastReadAt: string | null;
  lastMessageAt: string;
};

export type ConversationResponse = { conversation: ConversationSummary };
export type MessageResponse = { message: Message };

export const conversationsQuerySchema = z.object({
  /** data (ISO) da última conversa da página anterior */
  cursor: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Eventos de tempo real das mensagens */
export const MessageEvent = {
  /** servidor → participantes: { conversationId, message } */
  NEW: 'message:new',
  /** servidor → a outra pessoa: { conversationId, userId, lastReadAt } */
  READ: 'conversation:read',
  /** cliente → servidor → a outra pessoa: { conversationId, userId?, isTyping } */
  TYPING: 'conversation:typing',
} as const;

export type MessageNewPayload = { conversationId: string; message: Message };
export type ConversationReadPayload = {
  conversationId: string;
  userId: string;
  lastReadAt: string;
};
export type TypingPayload = { conversationId: string; userId?: string; isTyping: boolean };
