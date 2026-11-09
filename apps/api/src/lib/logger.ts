import { pino, type LoggerOptions } from 'pino';

import { env } from '../config/env';

export const loggerOptions: LoggerOptions = {
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  // O pino-http registra os cabeçalhos de cada request/resposta, e neles vão os tokens de
  // sessão (cookie / set-cookie). Quem lesse os logs poderia se passar pelos usuários.
  // redact troca esses valores por "[Redacted]" antes de escrever.
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
      'res.headers["Set-Cookie"]',
    ],
    censor: '[Redacted]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
};

export const logger = pino(loggerOptions);
