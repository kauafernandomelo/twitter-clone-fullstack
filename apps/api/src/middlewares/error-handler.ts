import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, z } from 'zod';

import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: `Rota ${req.method} ${req.path} não existe` });
};

// Formato único de erro da API: { code, message, details? }
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      details: z.flattenError(err).fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ code: err.code, message: err.message });
    return;
  }

  logger.error(err, 'Unhandled error');
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
};
