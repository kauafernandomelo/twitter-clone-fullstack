import { updateProfileSchema, type UserProfileResponse } from '@twitter-clone/shared';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { getUserId } from '../../middlewares/require-auth';
import * as usersService from './users.service';

const usernameParamSchema = z.object({ username: z.string().min(1).max(15) });

export async function getByUsername(req: Request, res: Response) {
  const { username } = usernameParamSchema.parse(req.params);
  const user = await usersService.getProfileByUsername(username, getUserId(req));
  res.json({ user } satisfies UserProfileResponse);
}

export async function updateMe(req: Request, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const user = await usersService.updateProfile(getUserId(req), data);
  res.json({ user } satisfies UserProfileResponse);
}
