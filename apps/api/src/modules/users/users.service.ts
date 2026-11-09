import type { UpdateProfileInput, updateProfileSchema } from '@twitter-clone/shared';
import type { z } from 'zod';

import { AppError } from '../../lib/app-error';
import { deleteUploadedImages, isOwnUploadUrl } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { profileSelect, toUserProfile } from './users.select';

type UpdateProfileData = z.output<typeof updateProfileSchema>;

export const accountNotFound = () => new AppError(404, 'Esta conta não existe', 'NOT_FOUND');

/** Busca só o id pelo username (usado por seguir, listas e posts do perfil). */
export async function findUserIdByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  if (!user) throw accountNotFound();
  return user.id;
}

export async function getProfileByUsername(username: string, viewerId: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: profileSelect(viewerId),
  });
  if (!user) throw accountNotFound();
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

  // guarda as imagens atuais para apagar do Cloudinary as que forem trocadas/removidas
  const before = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { avatarUrl: true, bannerUrl: true, isDemo: true },
  });

  // A conta de visitante é a mesma para todo mundo: se desse para editar, uma pessoa
  // trocaria o nome/foto que todos os outros visitantes veem.
  if (before.isDemo) {
    throw new AppError(403, 'A conta de visitante não pode editar o perfil', 'FORBIDDEN');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: profileSelect(userId),
  });

  deleteUploadedImages([
    data.avatarUrl !== undefined && data.avatarUrl !== before.avatarUrl ? before.avatarUrl : null,
    data.bannerUrl !== undefined && data.bannerUrl !== before.bannerUrl ? before.bannerUrl : null,
  ]);
  return toUserProfile(user);
}
