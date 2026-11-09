import type { NotificationItem } from '@twitter-clone/shared';
import { Heart, Repeat2, User } from 'lucide-react';
import { Link } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { TweetCard } from '@/features/tweets/components/TweetCard';
import { tweetUrl } from '@/features/tweets/utils';
import { cn } from '@/lib/cn';

const icons = {
  like: <Heart className="size-7 fill-[#f91880] text-[#f91880]" aria-hidden="true" />,
  retweet: <Repeat2 className="size-7 text-success" aria-hidden="true" />,
  follow: <User className="size-7 fill-brand text-brand" aria-hidden="true" />,
};

const verbs = {
  like: 'curtiu seu post',
  retweet: 'repostou seu post',
  follow: 'seguiu você',
} as const;

const verbsPlural = {
  like: 'curtiram seu post',
  retweet: 'repostaram seu post',
  follow: 'seguiram você',
} as const;

/** "Maria", "Maria e Pedro", "Maria e mais 3 pessoas" */
function describe(item: NotificationItem, type: keyof typeof verbs) {
  const [first, second] = item.actors;
  const others = item.actorsCount - 1;
  if (!first) return verbsPlural[type];
  if (others === 0) return `${first.name} ${verbs[type]}`;
  if (others === 1 && second) return `${first.name} e ${second.name} ${verbsPlural[type]}`;
  return `${first.name} e mais ${others} pessoas ${verbsPlural[type]}`;
}

type NotificationRowProps = { item: NotificationItem; highlight: boolean };

export function NotificationRow({ item, highlight }: NotificationRowProps) {
  // resposta, citação e menção: mostra o post inteiro (dá para interagir direto)
  if (item.type === 'reply' || item.type === 'quote' || item.type === 'mention') {
    if (!item.tweet) return null;
    return (
      <div className={cn(highlight && 'bg-brand/5')}>
        <TweetCard tweet={item.tweet} />
      </div>
    );
  }

  const type = item.type;
  const text = describe(item, type);
  const target =
    type === 'follow'
      ? `/${item.actors[0]?.username ?? ''}`
      : item.tweet
        ? tweetUrl(item.tweet)
        : '#';

  return (
    <article
      aria-label={text}
      className={cn(
        'flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-foreground/[0.03]',
        highlight && 'bg-brand/5',
      )}
    >
      <div className="flex w-10 shrink-0 justify-end">{icons[type]}</div>
      <div className="min-w-0 flex-1">
        <div className="flex gap-1">
          {item.actors.map((actor) => (
            <Link key={actor.id} to={`/${actor.username}`} aria-label={actor.name}>
              <Avatar src={actor.avatarUrl} name={actor.name} size="sm" />
            </Link>
          ))}
        </div>
        <Link to={target} className="mt-2 block text-[15px] hover:underline">
          {text}
        </Link>
        {item.tweet?.content && (
          <p className="mt-1 line-clamp-3 text-[15px] break-words text-muted">
            {item.tweet.content}
          </p>
        )}
      </div>
    </article>
  );
}
