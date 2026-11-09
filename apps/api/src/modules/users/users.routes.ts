import { Router } from 'express';

import { followRateLimit } from '../../middlewares/rate-limit';
import { requireAuth } from '../../middlewares/require-auth';
import * as followsController from '../follows/follows.controller';
import * as tweetsController from '../tweets/tweets.controller';
import * as usersController from './users.controller';

export const usersRouter = Router();

// O app inteiro é só para quem está logado (como o Twitter hoje)
usersRouter.use(requireAuth);

usersRouter.patch('/me', usersController.updateMe);
usersRouter.get('/:username', usersController.getByUsername);
usersRouter.get('/:username/tweets', tweetsController.listProfileTab('posts'));
usersRouter.get('/:username/replies', tweetsController.listProfileTab('replies'));
usersRouter.get('/:username/media', tweetsController.listProfileTab('media'));
usersRouter.get('/:username/likes', tweetsController.listProfileTab('likes'));
usersRouter.get('/:username/followers', followsController.listFollowers);
usersRouter.get('/:username/following', followsController.listFollowing);
usersRouter.post('/:username/follow', followRateLimit, followsController.follow);
usersRouter.delete('/:username/follow', followRateLimit, followsController.unfollow);
