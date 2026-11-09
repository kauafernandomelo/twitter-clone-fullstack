import { Router } from 'express';

import { requireAuth } from '../../middlewares/require-auth';
import * as tweetsController from '../tweets/tweets.controller';
import * as usersController from './users.controller';

export const usersRouter = Router();

// O app inteiro é só para quem está logado (como o Twitter hoje)
usersRouter.use(requireAuth);

usersRouter.patch('/me', usersController.updateMe);
usersRouter.get('/:username', usersController.getByUsername);
usersRouter.get('/:username/tweets', tweetsController.listByUser);
