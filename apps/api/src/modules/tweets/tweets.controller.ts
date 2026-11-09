import {
  createTweetSchema,
  cursorQuerySchema,
  type Paginated,
  type Tweet,
  type TweetResponse,
  updateTweetSchema,
} from '@twitter-clone/shared';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { parseIdParam } from '../../lib/params';
import { getUserId } from '../../middlewares/require-auth';
import * as tweetsService from './tweets.service';

const tweetId = (req: Request) => parseIdParam(req.params.id, 'Este post não existe');

export async function listRecent(req: Request, res: Response) {
  const page = await tweetsService.listRecent(cursorQuerySchema.parse(req.query));
  res.json(page satisfies Paginated<Tweet>);
}

export async function listByUser(req: Request, res: Response) {
  const { username } = z.object({ username: z.string().min(1).max(15) }).parse(req.params);
  const page = await tweetsService.listByUsername(username, cursorQuerySchema.parse(req.query));
  res.json(page satisfies Paginated<Tweet>);
}

export async function getById(req: Request, res: Response) {
  const tweet = await tweetsService.getById(tweetId(req));
  res.json({ tweet } satisfies TweetResponse);
}

export async function create(req: Request, res: Response) {
  const data = createTweetSchema.parse(req.body);
  const tweet = await tweetsService.create(getUserId(req), data);
  res.status(201).json({ tweet } satisfies TweetResponse);
}

export async function update(req: Request, res: Response) {
  const data = updateTweetSchema.parse(req.body);
  const tweet = await tweetsService.update(getUserId(req), tweetId(req), data);
  res.json({ tweet } satisfies TweetResponse);
}

export async function remove(req: Request, res: Response) {
  await tweetsService.remove(getUserId(req), tweetId(req));
  res.status(204).end();
}
