import type { ApiErrorBody } from '@twitter-clone/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, z } from 'zod';

import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiErrorBody = {
    code: 'NOT_FOUND',
    message: `Rota ${req.method} ${req.path} não existe`,
  };
  res.status(404).json(body);
};

// Formato único de erro da API: { code, message, details? }
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const body: ApiErrorBody = {
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      details: z.flattenError(err).fieldErrors as ApiErrorBody['details'],
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // body JSON malformado (lançado pelo express.json)
  if (err instanceof SyntaxError && 'body' in err) {
    res
      .status(400)
      .json({ code: 'VALIDATION_ERROR', message: 'JSON inválido' } satisfies ApiErrorBody);
    return;
  }

  logger.error(err, 'Unhandled error');
  res
    .status(500)
    .json({ code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } satisfies ApiErrorBody);
};
