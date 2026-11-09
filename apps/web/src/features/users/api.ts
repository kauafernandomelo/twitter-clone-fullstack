import type {
  AuthUser,
  UpdateProfileInput,
  UploadKind,
  UploadSignature,
  UserProfile,
  UserProfileResponse,
} from '@twitter-clone/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';

import { sessionQueryKey } from '../auth/api';

// Perfis em ['users', 'profile', ...] e listas em ['users', 'lists', ...]: prefixos distintos,
// para "atualizar todas as listas" nunca pegar um perfil por engano (ex.: um usuário chamado "lists").
export const userKeys = {
  profile: (username: string) => ['users', 'profile', username.toLowerCase()] as const,
  lists: ['users', 'lists'] as const,
  followers: (username: string) => ['users', 'lists', 'followers', username.toLowerCase()] as const,
  following: (username: string) => ['users', 'lists', 'following', username.toLowerCase()] as const,
  suggestions: ['users', 'suggestions'] as const,
};

export const profileQueryKey = userKeys.profile;

export function useProfile(username: string) {
  return useQuery({
    queryKey: profileQueryKey(username),
    queryFn: async () => {
      const { user } = await api<UserProfileResponse>(`/users/${encodeURIComponent(username)}`);
      return user;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { user } = await api<UserProfileResponse>('/users/me', {
        method: 'PATCH',
        body: input,
      });
      return user;
    },
    onSuccess: (user: UserProfile) => {
      // atualiza o cache na hora: o perfil e a sidebar (nome/avatar) mudam sem novo fetch
      queryClient.setQueryData(profileQueryKey(user.username), user);
      queryClient.setQueryData<AuthUser | null>(sessionQueryKey, (session) =>
        session ? { ...session, name: user.name, avatarUrl: user.avatarUrl } : session,
      );
    },
  });
}

type CloudinaryUploadResponse = { secure_url: string; width: number; height: number };

export type UploadedImage = { url: string; width: number; height: number };

/**
 * Upload direto pro Cloudinary: a API só assina, o arquivo vai do navegador
 * para o Cloudinary sem passar pelo nosso servidor.
 */
export async function uploadImage(file: Blob, kind: UploadKind): Promise<UploadedImage> {
  const signature = await api<UploadSignature>('/uploads/signature', {
    method: 'POST',
    body: { kind },
  });

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);

  const res = await fetch(signature.uploadUrl, { method: 'POST', body: form }).catch(() => null);
  if (!res?.ok) {
    throw new ApiError(res?.status ?? 0, 'UPLOAD_FAILED', 'Não foi possível enviar a imagem.');
  }

  const data = (await res.json()) as CloudinaryUploadResponse;
  return { url: data.secure_url, width: data.width, height: data.height };
}
