import { Router } from 'express';

import { requireAuth } from '../../middlewares/require-auth';
import * as tweetsController from './tweets.controller';

export const tweetsRouter = Router();

tweetsRouter.use(requireAuth);

tweetsRouter.get('/', tweetsController.listRecent);
tweetsRouter.post('/', tweetsController.create);
tweetsRouter.get('/:id', tweetsController.getById);
tweetsRouter.patch('/:id', tweetsController.update);
tweetsRouter.delete('/:id', tweetsController.remove);
