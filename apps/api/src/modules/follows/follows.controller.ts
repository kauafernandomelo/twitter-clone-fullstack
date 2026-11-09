import {
  cursorQuerySchema,
  type Paginated,
  type SuggestionsResponse,
  type UserSummary,
} from '@twitter-clone/shared';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { getUserId } from '../../middlewares/require-auth';
import * as followsService from './follows.service';

const usernameParam = (req: Request) =>
  z.object({ username: z.string().min(1).max(15) }).parse(req.params).username;

export async function follow(req: Request, res: Response) {
  await followsService.follow(getUserId(req), usernameParam(req));
  res.status(204).end();
}

export async function unfollow(req: Request, res: Response) {
  await followsService.unfollow(getUserId(req), usernameParam(req));
  res.status(204).end();
}

export async function listFollowers(req: Request, res: Response) {
  const page = await followsService.listFollowers(
    getUserId(req),
    usernameParam(req),
    cursorQuerySchema.parse(req.query),
  );
  res.json(page satisfies Paginated<UserSummary>);
}

export async function listFollowing(req: Request, res: Response) {
  const page = await followsService.listFollowing(
    getUserId(req),
    usernameParam(req),
    cursorQuerySchema.parse(req.query),
  );
  res.json(page satisfies Paginated<UserSummary>);
}

export async function suggestions(req: Request, res: Response) {
  const { limit } = z
    .object({ limit: z.coerce.number().int().min(1).max(10).default(3) })
    .parse(req.query);
  const users = await followsService.suggestions(getUserId(req), limit);
  res.json({ users } satisfies SuggestionsResponse);
}
