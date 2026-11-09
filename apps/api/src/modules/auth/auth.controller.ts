import { type AuthResponse, loginSchema, registerSchema } from '@twitter-clone/shared';
import type { Request, Response } from 'express';

import { getUserId } from '../../middlewares/require-auth';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from './auth.cookies';
import * as authService from './auth.service';

// Controllers são finos: validam a entrada, chamam o service e montam a resposta HTTP.

function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' && value ? value : undefined;
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const { user, tokens } = await authService.register(data);

  setAuthCookies(res, tokens);
  res.status(201).json({ user } satisfies AuthResponse);
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const { user, tokens } = await authService.login(data);

  setAuthCookies(res, tokens);
  res.json({ user } satisfies AuthResponse);
}

export async function refresh(req: Request, res: Response) {
  try {
    const tokens = await authService.refresh(readRefreshCookie(req));
    setAuthCookies(res, tokens);
    res.status(204).end();
  } catch (error) {
    clearAuthCookies(res);
    throw error;
  }
}

export async function logout(req: Request, res: Response) {
  await authService.logout(readRefreshCookie(req));

  clearAuthCookies(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(getUserId(req));
  res.json({ user } satisfies AuthResponse);
}
