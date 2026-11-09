import type { Tweet } from '@twitter-clone/shared';

export const tweetUrl = (tweet: Tweet) => `/${tweet.author.username}/status/${tweet.id}`;
