import type { ApiErrorBody, ErrorCode } from '@twitter-clone/shared';

// Erro de domínio "esperado" (regra de negócio). Tudo que não for AppError
// é tratado como bug e vira 500 no error handler.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: ErrorCode = 'INTERNAL_ERROR',
    public readonly details?: ApiErrorBody['details'],
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON(): ApiErrorBody {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export const unauthenticated = () => new AppError(401, 'Não autenticado', 'UNAUTHENTICATED');
