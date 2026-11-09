import { Router } from 'express';

import { authRouter } from './modules/auth/auth.routes';
import { healthRouter } from './modules/health/health.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { usersRouter } from './modules/users/users.routes';

// Ponto único onde cada módulo registra suas rotas.
export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/auth', authRouter);
routes.use('/users', usersRouter);
routes.use('/uploads', uploadsRouter);
