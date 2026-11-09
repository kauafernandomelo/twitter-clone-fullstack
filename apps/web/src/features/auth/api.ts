import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from '@twitter-clone/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, use } from 'react';
import { useNavigate } from 'react-router';

import { api, ApiError } from '@/lib/api';

// A sessão mora no cache do TanStack Query: `null` = deslogado, AuthUser = logado.
export const sessionQueryKey = ['auth', 'session'] as const;

async function fetchSession(): Promise<AuthUser | null> {
  try {
    const { user } = await api<AuthResponse>('/auth/me');
    return user;
  } catch (error) {
    // 401 aqui não é erro, é só "ninguém logado"
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    staleTime: Infinity,
    retry: false,
  });
}

// O ProtectedRoute fornece o usuário logado para tudo que está abaixo dele.
// Se a sessão cair, o ProtectedRoute redireciona e os filhos desmontam (nunca leem null).
export const CurrentUserContext = createContext<AuthUser | null>(null);

/** Usuário logado. Só funciona dentro de rotas protegidas. */
export function useCurrentUser() {
  const user = use(CurrentUserContext);
  if (!user) throw new Error('useCurrentUser usado fora de uma rota protegida');
  return user;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api<AuthResponse>('/auth/login', { method: 'POST', body: input }),
    onSuccess: ({ user }) => queryClient.setQueryData(sessionQueryKey, user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api<AuthResponse>('/auth/register', { method: 'POST', body: input }),
    onSuccess: ({ user }) => queryClient.setQueryData(sessionQueryKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    // mesmo se a API falhar, o usuário quer sair: limpa tudo localmente
    onSettled: () => {
      navigate('/', { replace: true });
      queryClient.clear();
      queryClient.setQueryData(sessionQueryKey, null);
    },
  });
}
