import { io, type Socket } from 'socket.io-client';

import { refreshSession } from './api';

type Handler = (...args: unknown[]) => void;

// Conexão única de tempo real do app (uma por aba), aberta enquanto há alguém logado.
let socket: Socket | null = null;

// Quem quer ouvir cada evento, guardado À PARTE da conexão: um componente pode começar a
// escutar antes do socket existir (os efeitos do React rodam de dentro para fora, então uma
// página aberta direto pela URL registra seus listeners antes do layout abrir a conexão).
const listeners = new Map<string, Set<Handler>>();

export function connectSocket() {
  if (socket) return socket;

  // mesma origem: em dev o proxy do Vite repassa /socket.io para a API, levando o cookie
  socket = io(import.meta.env.VITE_API_URL || undefined, { withCredentials: true });

  // liga na conexão nova quem já estava esperando
  for (const [event, handlers] of listeners) {
    for (const handler of handlers) socket.on(event, handler);
  }

  // A API recusa o handshake se o access token expirou (ex.: notebook voltou da suspensão).
  // Renovamos a sessão uma vez e reconectamos; se não der, a sessão acabou de verdade.
  let retried = false;
  socket.on('connect', () => {
    retried = false;
  });
  socket.on('connect_error', async (error) => {
    if (error.message !== 'UNAUTHENTICATED' || retried) return;
    retried = true;
    if (await refreshSession()) socket?.connect();
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

/** Escuta um evento do servidor (com ou sem conexão aberta); devolve a função que para. */
export function onSocketEvent(event: string, handler: Handler) {
  const handlers = listeners.get(event) ?? new Set<Handler>();
  handlers.add(handler);
  listeners.set(event, handlers);
  socket?.on(event, handler);

  return () => {
    handlers.delete(handler);
    socket?.off(event, handler);
  };
}

/** Envia um evento para o servidor (ex.: "digitando…"). Sem conexão, é descartado. */
export function emitToServer(event: string, payload: unknown) {
  socket?.emit(event, payload);
}
