import type { CookieOptions, Response } from 'express';

import { isProduction } from '../../config/env';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_MS } from '../../lib/tokens';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

// httpOnly: o JavaScript da página não consegue ler (protege contra roubo via XSS).
// sameSite lax: o cookie não vai em requisições POST vindas de outros sites (mitiga CSRF).
const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
};

const accessOptions: CookieOptions = { ...baseOptions, path: '/' };
// O refresh token só é enviado para as rotas de auth, nunca no resto da API.
const refreshOptions: CookieOptions = { ...baseOptions, path: '/api/auth' };

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...accessOptions,
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...refreshOptions,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, accessOptions);
  res.clearCookie(REFRESH_COOKIE, refreshOptions);
}
