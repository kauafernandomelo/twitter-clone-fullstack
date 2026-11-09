// Substituto de @/lib/socket nos testes (jsdom não tem servidor de socket).
// emitSocketEvent simula o servidor mandando um evento para esta aba.
type Handler = (...args: unknown[]) => void;
const handlers = new Map<string, Set<Handler>>();

export function connectSocket() {}

export function disconnectSocket() {
  handlers.clear();
}

export function onSocketEvent(event: string, handler: Handler) {
  const set = handlers.get(event) ?? new Set<Handler>();
  set.add(handler);
  handlers.set(event, set);
  return () => {
    set.delete(handler);
  };
}

export function emitSocketEvent(event: string, ...args: unknown[]) {
  handlers.get(event)?.forEach((handler) => handler(...args));
}
