import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { sessionQueryKey } from '@/features/auth/api';
import { isSessionError } from '@/lib/api';

// Factory: o app usa uma instância única; cada teste cria a sua (sem cache vazando entre testes).
export function createQueryClient() {
  // Se QUALQUER request falhar por sessão inválida (mesmo depois do refresh automático),
  // marca o usuário como deslogado. O ProtectedRoute então manda pro /login.
  const handleSessionError = (error: unknown) => {
    if (isSessionError(error)) client.setQueryData(sessionQueryKey, null);
  };

  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleSessionError }),
    mutationCache: new MutationCache({ onError: handleSessionError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => !isSessionError(error) && failureCount < 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return client;
}

export const queryClient = createQueryClient();
