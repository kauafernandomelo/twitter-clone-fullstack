import { MessageEvent } from '@twitter-clone/shared';
import { z } from 'zod';

import type { SocketHandler } from '../../lib/socket';
import { relayTyping } from './messages.service';

const typingSchema = z.object({ conversationId: z.uuid(), isTyping: z.boolean() });

// Um cliente normal manda poucos avisos de "digitando" (começou/parou). Acima disso é abuso:
// cada evento custa uma consulta ao banco, então o excesso é simplesmente ignorado.
const MAX_TYPING_EVENTS = 10;
const TYPING_WINDOW_MS = 5000;

/** Eventos de chat vindos do navegador. Payload inválido, conversa alheia ou excesso é ignorado. */
export const registerMessageSocketHandlers: SocketHandler = (socket, userId) => {
  let windowStart = Date.now();
  let count = 0;

  socket.on(MessageEvent.TYPING, async (payload: unknown) => {
    const now = Date.now();
    if (now - windowStart > TYPING_WINDOW_MS) {
      windowStart = now;
      count = 0;
    }
    count += 1;
    if (count > MAX_TYPING_EVENTS) return;

    const parsed = typingSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      await relayTyping(userId, parsed.data.conversationId, parsed.data.isTyping);
    } catch {
      // não participa da conversa: ignora em silêncio
    }
  });
};
