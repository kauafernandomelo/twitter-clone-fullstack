import type { Tweet } from '@twitter-clone/shared';
import { Repeat2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { useCurrentUser } from '@/features/auth/api';
import { cn } from '@/lib/cn';
import { formatFullDate, formatTweetTime } from '@/lib/date';

import { tweetUrl } from '../utils';
import { EditedLabel } from './EditedLabel';
import { QuotedTweetCard } from './QuotedTweetCard';
import { ReplyingTo } from './ReplyingTo';
import { RichText } from './RichText';
import { TweetActionBar } from './TweetActionBar';
import { TweetMediaGrid } from './TweetMediaGrid';
import { TweetMenu } from './TweetMenu';

type TweetCardProps = {
  tweet: Tweet;
  /** linha ligando o avatar ao próximo post (conversa) */
  threadLine?: boolean;
  /** esconde "Respondendo a" (quando o pai já aparece logo acima) */
  hideReplyingTo?: boolean;
  /** só leitura, sem ações nem clique (ex.: post sendo respondido no modal) */
  preview?: boolean;
};

export function TweetCard({ tweet, threadLine, hideReplyingTo, preview }: TweetCardProps) {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const { author, repostedBy } = tweet;

  // O card inteiro abre o post, exceto quando o clique é em link, botão, menu ou modal,
  // ou quando a pessoa está selecionando texto.
  function handleClick(event: MouseEvent<HTMLElement>) {
    if (preview) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, [role="menu"], dialog')) return;
    if (window.getSelection()?.toString()) return;
    navigate(tweetUrl(tweet));
  }

  return (
    <article
      onClick={handleClick}
      aria-labelledby={`tweet-${tweet.entryId}-author`}
      className={cn(
        'px-4 pt-3',
        !preview && 'cursor-pointer transition-colors hover:bg-foreground/[0.03]',
        !threadLine && 'border-b border-border',
      )}
    >
      {repostedBy && !preview && (
        <p className="mb-1 ml-8 flex items-center gap-2 text-[13px] font-bold text-muted">
          <Repeat2 className="size-4" aria-hidden="true" />
          <Link to={`/${repostedBy.username}`} className="hover:underline">
            {repostedBy.id === me.id ? 'Você repostou' : `${repostedBy.name} repostou`}
          </Link>
        </p>
      )}

      <div className="flex gap-3">
        <div className="flex shrink-0 flex-col items-center">
          <Link to={`/${author.username}`} aria-hidden="true" tabIndex={-1}>
            <Avatar src={author.avatarUrl} name={author.name} />
          </Link>
          {threadLine && <div className="mt-1 w-0.5 flex-1 bg-border" aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1 pb-2">
          <header className="flex items-start gap-1 text-[15px]">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1">
              <Link
                id={`tweet-${tweet.entryId}-author`}
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
            {!preview && (
              <div className="ml-auto">
                <TweetMenu tweet={tweet} />
              </div>
            )}
          </header>

          {!hideReplyingTo && <ReplyingTo tweet={tweet} />}
          {tweet.content && <RichText text={tweet.content} className="text-[15px] leading-5" />}
          <TweetMediaGrid media={tweet.media} />
          {tweet.isQuote && <QuotedTweetCard quote={tweet.quote} />}
          {!preview && <TweetActionBar tweet={tweet} />}
        </div>
      </div>
    </article>
  );
}
