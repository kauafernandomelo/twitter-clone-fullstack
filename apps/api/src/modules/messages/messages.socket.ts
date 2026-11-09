import { MessageEvent } from '@twitter-clone/shared';
import { z } from 'zod';

import type { SocketHandler } from '../../lib/socket';
import { relayTyping } from './messages.service';

const typingSchema = z.object({ conversationId: z.uuid(), isTyping: z.boolean() });

/** Eventos de chat vindos do navegador. Payload inválido ou conversa alheia é ignorado. */
export const registerMessageSocketHandlers: SocketHandler = (socket, userId) => {
  socket.on(MessageEvent.TYPING, async (payload: unknown) => {
    const parsed = typingSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      await relayTyping(userId, parsed.data.conversationId, parsed.data.isTyping);
    } catch {
      // não participa da conversa: ignora em silêncio
    }
  });
};
