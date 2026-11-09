import { z } from 'zod';

import { AppError } from './app-error';

/**
 * Valida um :id da URL. Id malformado responde 404 (e não 400): para quem acessa,
 * "/status/abc" é só um post que não existe.
 */
export function parseIdParam(value: unknown, notFoundMessage: string) {
  const result = z.uuid().safeParse(value);
  if (!result.success) throw new AppError(404, notFoundMessage, 'NOT_FOUND');
  return result.data;
}
