import { createHash, randomBytes } from 'node:crypto';

import { jwtVerify, SignJWT } from 'jose';

import { env } from '../config/env';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 min
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

// Access token: JWT curto, stateless. Só carrega o id do usuário (sub).
export function signAccessToken(userId: string) {
  return new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(accessSecret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessSecret, { algorithms: ['HS256'] });
  if (!payload.sub) throw new Error('Token sem subject');
  return payload.sub;
}

// Refresh token: string aleatória opaca (não é JWT). Vai pro cookie em claro
// e para o banco só como hash.
export function generateRefreshToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
