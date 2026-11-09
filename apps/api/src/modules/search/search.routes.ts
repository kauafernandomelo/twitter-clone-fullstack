import {
  cursorQuerySchema,
  type Paginated,
  searchQuerySchema,
  type SuggestionsResponse,
  type TrendsResponse,
  type Tweet,
  userSearchQuerySchema,
} from '@twitter-clone/shared';
import { Router } from 'express';
import { z } from 'zod';

import { getUserId, requireAuth } from '../../middlewares/require-auth';
import * as searchService from './search.service';

export const searchRouter = Router();
export const hashtagsRouter = Router();
export const trendsRouter = Router();

searchRouter.use(requireAuth);
hashtagsRouter.use(requireAuth);
trendsRouter.use(requireAuth);

searchRouter.get('/tweets', async (req, res) => {
  const page = await searchService.searchTweets(getUserId(req), searchQuerySchema.parse(req.query));
  res.json(page satisfies Paginated<Tweet>);
});

// também usado pelo autocomplete de @menções no compositor
searchRouter.get('/users', async (req, res) => {
  const users = await searchService.searchUsers(
    getUserId(req),
    userSearchQuerySchema.parse(req.query),
  );
  res.json({ users } satisfies SuggestionsResponse);
});

hashtagsRouter.get('/:tag/tweets', async (req, res) => {
  const { tag } = z.object({ tag: z.string().min(1).max(100) }).parse(req.params);
  const page = await searchService.listByHashtag(
    getUserId(req),
    tag,
    cursorQuerySchema.parse(req.query),
  );
  res.json(page satisfies Paginated<Tweet>);
});

trendsRouter.get('/', async (_req, res) => {
  res.json({ trends: await searchService.trends() } satisfies TrendsResponse);
});
