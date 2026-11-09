import type { ApiErrorBody } from '@twitter-clone/shared';
import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

import { env } from '../config/env';

const MINUTE = 60 * 1000;

// Nos testes os limites ficam desligados (centenas de requests rápidas), exceto no teste que
// verifica o próprio rate limit, que liga com RATE_LIMIT_IN_TESTS=1.
const skipInTests = () => env.NODE_ENV === 'test' && process.env.RATE_LIMIT_IN_TESTS !== '1';

/**
 * Chave do limite: o usuário logado (quando há) ou o IP. Por usuário é mais justo: várias
 * pessoas atrás do mesmo IP (Wi-Fi da faculdade, operadora móvel) não se bloqueiam.
 * ipKeyGenerator agrupa endereços IPv6 pela sub-rede (/56), senão daria para driblar
 * o limite trocando de endereço dentro da mesma faixa.
 */
const userOrIp = (req: Request) => req.userId ?? ipKeyGenerator(req.ip ?? '');

function createLimiter(limit: number, windowMs: number, message: string, byUser = false) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: skipInTests,
    ...(byUser && { keyGenerator: userOrIp }),
    handler: (_req, res) => {
      res.status(429).json({ code: 'TOO_MANY_REQUESTS', message } satisfies ApiErrorBody);
    },
  });
}

const SLOW_DOWN = 'Você está indo rápido demais. Espere um pouco e tente de novo.';

/** Teto geral por IP para a API inteira (proteção básica contra abuso/scraping). */
export const apiRateLimit = createLimiter(1000, 15 * MINUTE, SLOW_DOWN);

/** Força bruta em login/cadastro: 20 tentativas por IP a cada 15 min. */
export const authRateLimit = createLimiter(
  20,
  15 * MINUTE,
  'Muitas tentativas. Tente novamente em alguns minutos.',
);

// Limites por ação (por usuário), pensados para uso humano normal nunca esbarrar
export const tweetRateLimit = createLimiter(50, 15 * MINUTE, SLOW_DOWN, true);
export const interactionRateLimit = createLimiter(300, 15 * MINUTE, SLOW_DOWN, true);
export const followRateLimit = createLimiter(100, 15 * MINUTE, SLOW_DOWN, true);
export const messageRateLimit = createLimiter(120, 15 * MINUTE, SLOW_DOWN, true);
export const uploadRateLimit = createLimiter(60, 15 * MINUTE, SLOW_DOWN, true);
