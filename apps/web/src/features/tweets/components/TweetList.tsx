import type { Paginated, Tweet } from '@twitter-clone/shared';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useInView } from '@/hooks/use-in-view';

import { TweetCard } from './TweetCard';

type TweetListProps = {
  query: UseInfiniteQueryResult<InfiniteData<Paginated<Tweet>>>;
  empty: ReactNode;
};

// Lista com scroll infinito: quando o sentinela do fim aparece, carrega a próxima página.
export function TweetList({ query, empty }: TweetListProps) {
  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    query;
  const sentinelRef = useInView<HTMLDivElement>(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, Boolean(hasNextPage));

  if (isPending) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-muted">Não foi possível carregar os posts.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const tweets = data.pages.flatMap((page) => page.items);
  if (tweets.length === 0) return <>{empty}</>;

  return (
    <div>
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
      <div ref={sentinelRef} className="flex justify-center p-6">
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  );
}
