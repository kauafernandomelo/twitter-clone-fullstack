import type { Tweet } from '@twitter-clone/shared';

import { authUser, otherProfile } from './fixtures';

const anaAuthor = {
  id: authUser.id,
  name: authUser.name,
  username: authUser.username,
  avatarUrl: null,
};

const brunoAuthor = {
  id: otherProfile.id,
  name: otherProfile.name,
  username: otherProfile.username,
  avatarUrl: null,
};

let seq = 0;
export function makeTweet(overrides: Partial<Tweet> = {}): Tweet {
  seq += 1;
  return {
    id: `0196f0e5-0000-7000-8000-${String(seq).padStart(12, '0')}`,
    content: `post ${seq}`,
    media: [],
    author: anaAuthor,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    editedAt: null,
    ...overrides,
  };
}

export const authors = { ana: anaAuthor, bruno: brunoAuthor };
