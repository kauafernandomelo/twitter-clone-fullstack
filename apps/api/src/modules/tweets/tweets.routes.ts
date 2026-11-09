import { Router } from 'express';

import { interactionRateLimit, tweetRateLimit } from '../../middlewares/rate-limit';
import { requireAuth } from '../../middlewares/require-auth';
import * as tweetsController from './tweets.controller';

export const tweetsRouter = Router();

tweetsRouter.use(requireAuth);

tweetsRouter.get('/', tweetsController.listRecent);
tweetsRouter.post('/', tweetRateLimit, tweetsController.create);
tweetsRouter.get('/:id', tweetsController.getById);
tweetsRouter.patch('/:id', tweetsController.update);
tweetsRouter.delete('/:id', tweetsController.remove);
tweetsRouter.get('/:id/replies', tweetsController.listReplies);
tweetsRouter.get('/:id/thread', tweetsController.getThread);

for (const [path, action] of [
  ['like', 'setLike'],
  ['retweet', 'setRetweet'],
  ['bookmark', 'setBookmark'],
] as const) {
  tweetsRouter.post(`/:id/${path}`, interactionRateLimit, tweetsController.toggle(action));
  tweetsRouter.delete(`/:id/${path}`, interactionRateLimit, tweetsController.toggle(action));
}
