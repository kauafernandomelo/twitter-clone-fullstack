import { io, type Socket } from 'socket.io-client';

import { refreshSession } from './api';

// Conexão única de tempo real do app (uma por aba), aberta enquanto há alguém logado.
let socket: Socket | null = null;

export function connectSocket() {
  if (socket) return socket;

  // mesma origem: em dev o proxy do Vite repassa /socket.io para a API, levando o cookie
  socket = io(import.meta.env.VITE_API_URL || undefined, { withCredentials: true });

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

/** Escuta um evento do servidor; devolve a função que para de escutar. */
export function onSocketEvent(event: string, handler: (...args: unknown[]) => void) {
  const current = socket;
  current?.on(event, handler);
  return () => {
    current?.off(event, handler);
  };
}
