// Cliente HTTP único do front. Toda chamada passa por aqui para:
// - mandar cookies (credentials: 'include')
// - padronizar erros no formato da API ({ code, message, details? })
const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function api<T>(path: string, { body, headers, ...init }: RequestOptions = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.code ?? 'UNKNOWN_ERROR',
      data?.message ?? 'Algo deu errado. Tente novamente.',
      data?.details,
    );
  }

  return data as T;
}
