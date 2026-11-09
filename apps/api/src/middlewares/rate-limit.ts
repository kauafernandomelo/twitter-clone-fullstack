import type { ApiErrorBody } from '@twitter-clone/shared';
import { rateLimit } from 'express-rate-limit';

import { env } from '../config/env';

// Freia força bruta em login/cadastro: 20 tentativas por IP a cada 15 min.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, res) => {
    const body: ApiErrorBody = {
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas tentativas. Tente novamente em alguns minutos.',
    };
    res.status(429).json(body);
  },
});
