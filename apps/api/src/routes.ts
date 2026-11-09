import { Router } from 'express';

import { authRouter } from './modules/auth/auth.routes';
import { healthRouter } from './modules/health/health.routes';

// Ponto único onde cada módulo registra suas rotas (users, tweets...).
export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/auth', authRouter);
