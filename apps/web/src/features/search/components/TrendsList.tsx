import { Link } from 'react-router';

import { Spinner } from '@/components/ui/Spinner';

import { useTrends } from '../api';

const plural = (count: number) => `${count} ${count === 1 ? 'post' : 'posts'}`;

export function TrendsList({ emptyMessage }: { emptyMessage: string }) {
  const { data: trends, isPending, isError } = useTrends();

  if (isPending) {
    return (
      <div className="flex justify-center p-4">
        <Spinner />
      </div>
    );
  }
  if (isError || trends.length === 0) {
    return <p className="px-4 pb-4 text-[15px] text-muted">{emptyMessage}</p>;
  }

  return (
    <ol>
      {trends.map((trend, index) => (
        <li key={trend.tag}>
          <Link
            to={`/hashtag/${encodeURIComponent(trend.tag)}`}
            className="block px-4 py-3 transition-colors hover:bg-foreground/[0.03]"
          >
            <span className="block text-[13px] text-muted">{index + 1} · Assunto do momento</span>
            <span className="block font-bold">#{trend.tag}</span>
            <span className="block text-[13px] text-muted">{plural(trend.count)}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
