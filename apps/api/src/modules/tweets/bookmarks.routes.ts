import { Router } from 'express';

import { requireAuth } from '../../middlewares/require-auth';
import * as tweetsController from './tweets.controller';

// Itens salvos são privados: a rota não recebe username, sempre lista os do usuário logado.
export const bookmarksRouter = Router();

bookmarksRouter.get('/', requireAuth, tweetsController.listBookmarks);
