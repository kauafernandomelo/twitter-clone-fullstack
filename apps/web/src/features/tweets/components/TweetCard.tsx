import type { Tweet } from '@twitter-clone/shared';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { formatFullDate, formatTweetTime } from '@/lib/date';

import { tweetUrl } from '../utils';
import { EditedLabel } from './EditedLabel';
import { TweetActions } from './TweetActions';
import { TweetMediaGrid } from './TweetMediaGrid';

export function TweetCard({ tweet }: { tweet: Tweet }) {
  const navigate = useNavigate();
  const { author } = tweet;

  // O card inteiro abre o post, exceto quando o clique é em link, botão, menu ou modal,
  // ou quando a pessoa está selecionando texto.
  function handleClick(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, [role="menu"], dialog')) return;
    if (window.getSelection()?.toString()) return;
    navigate(tweetUrl(tweet));
  }

  return (
    <article
      onClick={handleClick}
      aria-labelledby={`tweet-${tweet.id}-author`}
      className="flex cursor-pointer gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-foreground/[0.03]"
    >
      <Link to={`/${author.username}`} aria-hidden="true" tabIndex={-1} className="shrink-0">
        <Avatar src={author.avatarUrl} name={author.name} />
      </Link>

      <div className="min-w-0 flex-1">
        <header className="flex items-start gap-1 text-[15px]">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1">
            <Link
              id={`tweet-${tweet.id}-author`}
              to={`/${author.username}`}
              className="truncate font-bold hover:underline"
            >
              {author.name}
            </Link>
            <span className="truncate text-muted">@{author.username}</span>
            <span className="text-muted" aria-hidden="true">
              ·
            </span>
            <Link to={tweetUrl(tweet)} className="text-muted hover:underline">
              <time dateTime={tweet.createdAt} title={formatFullDate(tweet.createdAt)}>
                {formatTweetTime(tweet.createdAt)}
              </time>
            </Link>
            <EditedLabel editedAt={tweet.editedAt} />
          </div>
          <div className="ml-auto">
            <TweetActions tweet={tweet} />
          </div>
        </header>

        {tweet.content && (
          <p className="text-[15px] leading-5 break-words whitespace-pre-wrap">{tweet.content}</p>
        )}
        <TweetMediaGrid media={tweet.media} />
      </div>
    </article>
  );
}
