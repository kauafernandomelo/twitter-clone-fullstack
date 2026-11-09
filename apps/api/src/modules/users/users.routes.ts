import { Router } from 'express';

import { requireAuth } from '../../middlewares/require-auth';
import * as followsController from '../follows/follows.controller';
import * as tweetsController from '../tweets/tweets.controller';
import * as usersController from './users.controller';

export const usersRouter = Router();

// O app inteiro é só para quem está logado (como o Twitter hoje)
usersRouter.use(requireAuth);

usersRouter.patch('/me', usersController.updateMe);
usersRouter.get('/:username', usersController.getByUsername);
usersRouter.get('/:username/tweets', tweetsController.listByUser);
usersRouter.get('/:username/followers', followsController.listFollowers);
usersRouter.get('/:username/following', followsController.listFollowing);
usersRouter.post('/:username/follow', followsController.follow);
usersRouter.delete('/:username/follow', followsController.unfollow);
