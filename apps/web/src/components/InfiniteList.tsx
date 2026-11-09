import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useInView } from '@/hooks/use-in-view';

type Page<T> = { items: T[]; nextCursor: string | null };

type InfiniteListProps<T> = {
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>>;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  empty: ReactNode;
  errorMessage?: string;
};

// Lista com scroll infinito: quando o sentinela do fim aparece, carrega a próxima página.
// Usada para posts, seguidores, seguindo...
export function InfiniteList<T>({
  query,
  renderItem,
  getKey,
  empty,
  errorMessage = 'Não foi possível carregar.',
}: InfiniteListProps<T>) {
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
        <p className="text-muted">{errorMessage}</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const items = data.pages.flatMap((page) => page.items);
  if (items.length === 0) return <>{empty}</>;

  return (
    <div>
      {items.map((item) => (
        <div key={getKey(item)}>{renderItem(item)}</div>
      ))}
      <div ref={sentinelRef} className="flex justify-center p-6">
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  );
}
