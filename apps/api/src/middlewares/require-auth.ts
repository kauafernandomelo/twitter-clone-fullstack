import type { Request, RequestHandler } from 'express';

import { unauthenticated } from '../lib/app-error';
import { verifyAccessToken } from '../lib/tokens';
import { ACCESS_COOKIE } from '../modules/auth/auth.cookies';

// Exige um access token válido no cookie. Express 5 repassa erros de funções async
// pro error handler automaticamente, então dá pra só lançar.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[ACCESS_COOKIE];
  if (typeof token !== 'string' || !token) throw unauthenticated();

  try {
    req.userId = await verifyAccessToken(token);
  } catch {
    throw unauthenticated();
  }

  next();
};

// Para usar em rotas que passaram pelo requireAuth: devolve o id já tipado como string.
export function getUserId(req: Request) {
  if (!req.userId) throw unauthenticated();
  return req.userId;
}
