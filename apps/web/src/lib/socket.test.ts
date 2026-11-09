import { EventEmitter } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

import type * as SocketModule from './socket';

// socket.io-client falso: um EventEmitter onde o teste pode "receber" eventos do servidor
const fakeServer = new EventEmitter();
vi.mock('socket.io-client', () => ({
  io: () => ({
    on: (event: string, handler: (...args: unknown[]) => void) => fakeServer.on(event, handler),
    off: (event: string, handler: (...args: unknown[]) => void) => fakeServer.off(event, handler),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: () => fakeServer.removeAllListeners(),
  }),
}));

// o setup global troca @/lib/socket por um falso; aqui testamos o módulo de verdade
const { connectSocket, disconnectSocket, onSocketEvent } =
  await vi.importActual<typeof SocketModule>('./socket');

describe('lib/socket', () => {
  it('quem escuta ANTES de conectar também recebe os eventos', () => {
    // é o que acontece ao abrir /messages/:id direto: o efeito da página roda antes
    // do efeito que abre a conexão
    const handler = vi.fn();
    const stop = onSocketEvent('evento', handler);

    connectSocket();
    fakeServer.emit('evento', { ok: true });

    expect(handler).toHaveBeenCalledWith({ ok: true });
    stop();
    disconnectSocket();
  });

  it('parar de escutar funciona antes e depois de conectar', () => {
    const handler = vi.fn();
    const stop = onSocketEvent('evento', handler);
    stop();

    connectSocket();
    fakeServer.emit('evento');

    expect(handler).not.toHaveBeenCalled();
    disconnectSocket();
  });
});
