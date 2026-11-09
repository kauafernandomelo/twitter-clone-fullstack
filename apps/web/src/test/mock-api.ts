import { vi } from 'vitest';

type MockResponse = { status: number; body?: unknown };
type Handler = (body: unknown) => MockResponse;

/**
 * Substitui o fetch global por um "backend fake".
 * As chaves são "MÉTODO /caminho" sem o prefixo /api, ex.: 'POST /auth/login'.
 */
export function mockApi(handlers: Record<string, Handler | MockResponse>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const { pathname } = new URL(String(input), 'http://localhost');
    const key = `${init?.method ?? 'GET'} ${pathname.replace(/^\/api/, '')}`;
    const handler = handlers[key];

    const { status, body } = !handler
      ? { status: 404, body: { code: 'NOT_FOUND', message: `sem mock para ${key}` } }
      : typeof handler === 'function'
        ? handler(init?.body ? JSON.parse(String(init.body)) : undefined)
        : handler;

    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const unauthenticated = {
  status: 401,
  body: { code: 'UNAUTHENTICATED', message: 'Não autenticado' },
};
export const invalidRefresh = {
  status: 401,
  body: { code: 'INVALID_REFRESH_TOKEN', message: 'Sessão expirada' },
};
