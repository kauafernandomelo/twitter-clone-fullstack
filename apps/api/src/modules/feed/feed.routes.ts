import { Router } from 'express';

import { requireAuth } from '../../middlewares/require-auth';
import * as tweetsController from '../tweets/tweets.controller';

export const feedRouter = Router();

feedRouter.use(requireAuth);

// A aba "Para você" usa GET /api/tweets (todos os posts recentes).
feedRouter.get('/following', tweetsController.listFollowingFeed);
