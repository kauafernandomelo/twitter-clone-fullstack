import type { ApiErrorBody } from '@twitter-clone/shared';

// Cliente HTTP único do front. Toda chamada passa por aqui para:
// - mandar cookies (credentials: 'include')
// - renovar a sessão automaticamente quando o access token expira (401)
// - padronizar erros no formato da API ({ code, message, details? })
const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ApiErrorBody['details'],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

// Rotas em que um 401 NÃO deve disparar refresh (evita loop e "login errado" virar refresh)
const SKIP_REFRESH = new Set(['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']);

function request(path: string, { body, headers, ...init }: RequestOptions) {
  return fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// Se várias requests tomarem 401 ao mesmo tempo, todas esperam UM único refresh.
let refreshing: Promise<boolean> | null = null;

export function refreshSession() {
  refreshing ??= request('/auth/refresh', { method: 'POST' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await request(path, options);
    if (res.status === 401 && !SKIP_REFRESH.has(path) && (await refreshSession())) {
      res = await request(path, options);
    }
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar. Verifique sua internet.');
  }

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const error = (data ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      res.status,
      error.code ?? 'UNKNOWN_ERROR',
      error.message ?? 'Algo deu errado. Tente novamente.',
      error.details,
    );
  }

  return data as T;
}

export function isSessionError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === 'UNAUTHENTICATED' || error.code === 'INVALID_REFRESH_TOKEN')
  );
}
