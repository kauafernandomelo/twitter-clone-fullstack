import type { QuotedTweet } from '@twitter-clone/shared';
import { Link } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { formatFullDate, formatTweetTime } from '@/lib/date';

import { TweetMediaGrid } from './TweetMediaGrid';

/** Post citado, embutido dentro de outro (clicável, sem ações). */
export function QuotedTweetCard({ quote }: { quote: QuotedTweet | null }) {
  if (!quote) {
    return (
      <div className="mt-3 rounded-2xl border border-border bg-surface/50 px-4 py-3 text-[15px] text-muted">
        Este post não está disponível.
      </div>
    );
  }

  return (
    <Link
      to={`/${quote.author.username}/status/${quote.id}`}
      aria-label={`Post citado de ${quote.author.name}`}
      className="mt-3 block overflow-hidden rounded-2xl border border-border transition-colors hover:bg-foreground/[0.03]"
    >
      <div className="px-3 pt-3">
        <div className="flex items-center gap-1 text-[15px]">
          <Avatar
            src={quote.author.avatarUrl}
            name={quote.author.name}
            size="sm"
            className="size-5"
          />
          <span className="truncate font-bold">{quote.author.name}</span>
          <span className="truncate text-muted">@{quote.author.username}</span>
          <span className="text-muted">·</span>
          <time
            dateTime={quote.createdAt}
            title={formatFullDate(quote.createdAt)}
            className="text-muted"
          >
            {formatTweetTime(quote.createdAt)}
          </time>
        </div>
        {quote.content && (
          <p className="mt-1 pb-3 text-[15px] leading-5 break-words whitespace-pre-wrap">
            {quote.content}
          </p>
        )}
      </div>
      {quote.media.length > 0 && (
        <div className="[&>div]:mt-0 [&>div]:rounded-none [&>div]:border-x-0 [&>div]:border-b-0">
          <TweetMediaGrid media={quote.media} />
        </div>
      )}
    </Link>
  );
}
