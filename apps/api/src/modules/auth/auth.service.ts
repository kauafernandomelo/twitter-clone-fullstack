import { randomUUID } from 'node:crypto';

import type { AuthUser, loginSchema, registerSchema } from '@twitter-clone/shared';
import type { z } from 'zod';

import { Prisma } from '../../generated/prisma/client';
import { AppError, unauthenticated } from '../../lib/app-error';
import { logger } from '../../lib/logger';
import { fakeVerifyPassword, hashPassword, verifyPassword } from '../../lib/password';
import { prisma } from '../../lib/prisma';
import {
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
  signAccessToken,
} from '../../lib/tokens';

type RegisterData = z.output<typeof registerSchema>;
type LoginData = z.output<typeof loginSchema>;

// Janela em que um refresh token recém-rotacionado ainda pode reaparecer sem ser
// considerado roubo (ex.: duas abas renovando ao mesmo tempo).
const ROTATION_GRACE_MS = 10_000;

const authUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type AuthUserRow = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

function toAuthUser(user: AuthUserRow): AuthUser {
  return { ...user, createdAt: user.createdAt.toISOString() };
}

const invalidRefreshToken = () =>
  new AppError(401, 'Sessão expirada. Entre novamente.', 'INVALID_REFRESH_TOKEN');

async function issueTokens(userId: string, familyId: string = randomUUID()) {
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      familyId,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken: await signAccessToken(userId), refreshToken };
}

function conflictError(taken: { email: boolean; username: boolean }) {
  const details: Record<string, string[]> = {};
  if (taken.email) details.email = ['Este email já está cadastrado'];
  if (taken.username) details.username = ['Este nome de usuário já está em uso'];
  return new AppError(409, 'Email ou nome de usuário já cadastrado', 'CONFLICT', details);
}

export async function register(data: RegisterData) {
  const existing = await prisma.user.findMany({
    where: { OR: [{ email: data.email }, { username: data.username }] },
    select: { email: true, username: true },
  });

  if (existing.length > 0) {
    throw conflictError({
      email: existing.some((u) => u.email === data.email),
      username: existing.some((u) => u.username === data.username),
    });
  }

  let user: AuthUserRow;
  try {
    user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        passwordHash: await hashPassword(data.password),
      },
      select: authUserSelect,
    });
  } catch (error) {
    // Corrida: outra request cadastrou o mesmo email/username entre o findMany e o create.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw conflictError({ email: true, username: true });
    }
    throw error;
  }

  return { user: toAuthUser(user), tokens: await issueTokens(user.id) };
}

export async function login({ identifier, password }: LoginData) {
  const user = await prisma.user.findUnique({
    where: identifier.includes('@') ? { email: identifier } : { username: identifier },
    select: { ...authUserSelect, passwordHash: true },
  });

  const valid = user
    ? await verifyPassword(user.passwordHash, password)
    : await fakeVerifyPassword(password);

  // Mesma mensagem para "não existe" e "senha errada": não revela quem tem conta.
  if (!user || !valid) {
    throw new AppError(401, 'Usuário ou senha incorretos', 'INVALID_CREDENTIALS');
  }

  const { passwordHash: _, ...authUser } = user;
  return { user: toAuthUser(authUser), tokens: await issueTokens(user.id) };
}

export async function refresh(rawToken: string | undefined) {
  if (!rawToken) throw invalidRefreshToken();

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!stored) throw invalidRefreshToken();

  if (stored.revokedAt) {
    const recentlyRotated = Date.now() - stored.revokedAt.getTime() < ROTATION_GRACE_MS;
    if (!recentlyRotated) {
      // Token já usado reapareceu: alguém pode ter roubado. Derruba a sessão inteira.
      logger.warn({ userId: stored.userId }, 'Refresh token reuse detected, revoking family');
      await revokeFamily(stored.familyId);
    }
    throw invalidRefreshToken();
  }

  if (stored.expiresAt.getTime() <= Date.now()) throw invalidRefreshToken();

  // updateMany com revokedAt: null = revogação atômica. Se duas requests chegarem juntas,
  // só uma consegue rotacionar.
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw invalidRefreshToken();

  return issueTokens(stored.userId, stored.familyId);
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: { familyId: true },
  });

  if (stored) await revokeFamily(stored.familyId);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: authUserSelect });
  if (!user) throw unauthenticated();
  return toAuthUser(user);
}

function revokeFamily(familyId: string) {
  return prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
