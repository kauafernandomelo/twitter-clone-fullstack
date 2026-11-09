import type { Server as HttpServer } from 'node:http';

import { Server, type Socket } from 'socket.io';

import { env } from '../config/env';
import { ACCESS_COOKIE } from '../modules/auth/auth.cookies';
import { logger } from './logger';
import { verifyAccessToken } from './tokens';

let io: Server | null = null;

const userRoom = (userId: string) => `user:${userId}`;

function readCookie(header: string | undefined, name: string) {
  const pair = header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : undefined;
}

/**
 * Socket.IO na mesma porta da API. A autenticação usa o MESMO cookie httpOnly do REST:
 * o navegador o envia no handshake e o JavaScript da página nunca vê o token.
 * Cada usuário entra numa "sala" própria, e a API manda eventos só para ela.
 */
/** Handler de eventos vindos do cliente, registrado por um módulo (ex.: "digitando" do chat). */
export type SocketHandler = (socket: Socket, userId: string) => void;

export function initSocket(httpServer: HttpServer, handlers: SocketHandler[] = []) {
  io = new Server(httpServer, { cors: { origin: env.WEB_ORIGIN, credentials: true } });

  io.use(async (socket, next) => {
    const token = readCookie(socket.handshake.headers.cookie, ACCESS_COOKIE);
    try {
      if (!token) throw new Error('sem token');
      socket.data.userId = await verifyAccessToken(token);
      next();
    } catch {
      // o cliente reconhece esta mensagem, renova a sessão e tenta de novo
      next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    void socket.join(userRoom(userId));
    handlers.forEach((handler) => handler(socket, userId));
  });

  logger.info('Socket.IO pronto');
  return io;
}

/** Envia um evento para todas as abas/dispositivos conectados de um usuário. */
export function emitToUser(userId: string, event: string, payload: unknown = {}) {
  io?.to(userRoom(userId)).emit(event, payload);
}

export async function closeSocket() {
  await io?.close();
  io = null;
}
