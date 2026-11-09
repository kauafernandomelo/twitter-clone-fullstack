import type { Paginated, Tweet } from '@twitter-clone/shared';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { InfiniteList } from '@/components/InfiniteList';

import { TweetCard } from './TweetCard';

type TweetListProps = {
  query: UseInfiniteQueryResult<InfiniteData<Paginated<Tweet>>>;
  empty: ReactNode;
};

export function TweetList({ query, empty }: TweetListProps) {
  return (
    <InfiniteList
      query={query}
      getKey={(tweet) => tweet.id}
      renderItem={(tweet) => <TweetCard tweet={tweet} />}
      empty={empty}
      errorMessage="Não foi possível carregar os posts."
    />
  );
}
