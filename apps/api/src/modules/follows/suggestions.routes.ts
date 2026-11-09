import { Router } from 'express';

import { requireAuth } from '../../middlewares/require-auth';
import * as followsController from './follows.controller';

// Fica em /api/suggestions (e não /api/users/suggestions) para não disputar a rota
// com um usuário que se chame "suggestions".
export const suggestionsRouter = Router();

suggestionsRouter.get('/', requireAuth, followsController.suggestions);
