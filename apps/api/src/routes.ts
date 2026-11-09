import { Router } from 'express';

import { healthRouter } from './modules/health/health.routes';

// Ponto único onde cada módulo registra suas rotas (auth, users, tweets...).
export const routes = Router();

routes.use('/health', healthRouter);
