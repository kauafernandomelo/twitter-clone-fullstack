import type { UpdateProfileInput, updateProfileSchema, UserProfile } from '@twitter-clone/shared';
import type { z } from 'zod';

import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../lib/app-error';
import { isOwnUploadUrl } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';

type UpdateProfileData = z.output<typeof updateProfileSchema>;

export const profileSelect = {
  id: true,
  name: true,
  username: true,
  bio: true,
  location: true,
  website: true,
  avatarUrl: true,
  bannerUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type ProfileRow = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

export function toUserProfile(user: ProfileRow): UserProfile {
  return { ...user, createdAt: user.createdAt.toISOString() };
}

export async function getProfileByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: profileSelect,
  });
  if (!user) throw new AppError(404, 'Esta conta não existe', 'NOT_FOUND');
  return toUserProfile(user);
}

export async function updateProfile(userId: string, data: UpdateProfileData) {
  // Só aceitamos imagens que o próprio usuário subiu para a pasta dele no Cloudinary.
  // Sem isso, daria para apontar o avatar para qualquer URL da internet.
  const imageFields = [
    ['avatarUrl', 'avatar'],
    ['bannerUrl', 'banner'],
  ] as const satisfies readonly [keyof UpdateProfileInput, 'avatar' | 'banner'][];

  const details: Record<string, string[]> = {};
  for (const [field, kind] of imageFields) {
    const url = data[field];
    if (url && !isOwnUploadUrl(url, userId, kind)) details[field] = ['Imagem inválida'];
  }
  if (Object.keys(details).length > 0) {
    throw new AppError(400, 'Dados inválidos', 'VALIDATION_ERROR', details);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: profileSelect,
  });
  return toUserProfile(user);
}
