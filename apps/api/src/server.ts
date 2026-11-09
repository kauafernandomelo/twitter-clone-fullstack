import { createServer } from 'node:http';

import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { closeSocket, initSocket } from './lib/socket';
import { registerMessageSocketHandlers } from './modules/messages/messages.socket';

// O servidor HTTP é criado à parte para o Socket.IO dividir a mesma porta com o Express.
const server = createServer(createApp());
initSocket(server, [registerMessageSocketHandlers]);

server.listen(env.PORT, () => {
  logger.info(`🚀 API rodando em http://localhost:${env.PORT}`);
});

// Desligamento gracioso: fecha os sockets, para de aceitar conexões e fecha o pool do banco.
function shutdown(signal: string) {
  logger.info(`${signal} recebido, encerrando...`);
  void closeSocket().then(() =>
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    }),
  );
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
