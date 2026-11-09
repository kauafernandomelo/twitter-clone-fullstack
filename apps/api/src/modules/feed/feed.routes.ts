import { cursorQuerySchema, type Paginated, type Tweet } from '@twitter-clone/shared';
import { Router } from 'express';

import { getUserId, requireAuth } from '../../middlewares/require-auth';
import * as tweetsService from '../tweets/tweets.service';

export const feedRouter = Router();

feedRouter.use(requireAuth);

// A aba "Para você" usa GET /api/tweets (todos os posts recentes).
feedRouter.get('/following', async (req, res) => {
  const page = await tweetsService.listFollowingFeed(
    getUserId(req),
    cursorQuerySchema.parse(req.query),
  );
  res.json(page satisfies Paginated<Tweet>);
});
