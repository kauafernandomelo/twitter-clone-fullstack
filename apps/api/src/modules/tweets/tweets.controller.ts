import {
  createTweetSchema,
  cursorQuerySchema,
  type Paginated,
  type ThreadResponse,
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
const usernameParam = (req: Request) =>
  z.object({ username: z.string().min(1).max(15) }).parse(req.params).username;
const cursorQuery = (req: Request) => cursorQuerySchema.parse(req.query);

export async function listRecent(req: Request, res: Response) {
  const page = await tweetsService.listRecent(getUserId(req), cursorQuery(req));
  res.json(page satisfies Paginated<Tweet>);
}

export async function listFollowingFeed(req: Request, res: Response) {
  const page = await tweetsService.listFollowingFeed(getUserId(req), cursorQuery(req));
  res.json(page satisfies Paginated<Tweet>);
}

/** Abas do perfil: /users/:username/{tweets|replies|media|likes} */
export function listProfileTab(tab: tweetsService.ProfileTab) {
  return async (req: Request, res: Response) => {
    const page = await tweetsService.listByUsername(
      getUserId(req),
      usernameParam(req),
      tab,
      cursorQuery(req),
    );
    res.json(page satisfies Paginated<Tweet>);
  };
}

export async function listBookmarks(req: Request, res: Response) {
  const page = await tweetsService.listBookmarks(getUserId(req), cursorQuery(req));
  res.json(page satisfies Paginated<Tweet>);
}

export async function listReplies(req: Request, res: Response) {
  const page = await tweetsService.listReplies(getUserId(req), tweetId(req), cursorQuery(req));
  res.json(page satisfies Paginated<Tweet>);
}

export async function getThread(req: Request, res: Response) {
  const ancestors = await tweetsService.getThread(getUserId(req), tweetId(req));
  res.json({ ancestors } satisfies ThreadResponse);
}

export async function getById(req: Request, res: Response) {
  const tweet = await tweetsService.getById(getUserId(req), tweetId(req));
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

/** POST liga, DELETE desliga (curtir, repostar, salvar). */
export function toggle(action: 'setLike' | 'setRetweet' | 'setBookmark') {
  return async (req: Request, res: Response) => {
    await tweetsService[action](getUserId(req), tweetId(req), req.method === 'POST');
    res.status(204).end();
  };
}
