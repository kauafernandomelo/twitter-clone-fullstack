// Erro de domínio "esperado" (regra de negócio). Tudo que não for AppError
// é tratado como bug e vira 500 no error handler.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'APP_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}
