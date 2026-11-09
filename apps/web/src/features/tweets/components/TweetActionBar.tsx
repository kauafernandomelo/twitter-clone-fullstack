import type { Tweet } from '@twitter-clone/shared';
import { Bookmark, Heart, MessageCircle, PenLine, Repeat2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

import { useToggleInteraction } from '../api';
import { useOpenCompose } from '../compose-context';

type ActionButtonProps = {
  label: string;
  icon: ReactNode;
  count?: number;
  active?: boolean;
  color: 'brand' | 'success' | 'like';
  onClick?: () => void;
  asTrigger?: boolean;
};

const colors = {
  brand: { hover: 'group-hover:bg-brand/10 group-hover:text-brand', active: 'text-brand' },
  success: { hover: 'group-hover:bg-success/10 group-hover:text-success', active: 'text-success' },
  like: {
    hover: 'group-hover:bg-[#f91880]/10 group-hover:text-[#f91880]',
    active: 'text-[#f91880]',
  },
};

function ActionContent({
  icon,
  count,
  active,
  color,
}: Omit<ActionButtonProps, 'label' | 'onClick'>) {
  return (
    <span
      className={cn('flex items-center text-[13px] text-muted', active && colors[color].active)}
    >
      <span className={cn('rounded-full p-2 transition-colors', colors[color].hover)}>{icon}</span>
      <span
        className={cn('min-w-4 transition-colors', !active && colors[color].hover.split(' ')[1])}
      >
        {count !== undefined ? formatCount(count) : ''}
      </span>
    </span>
  );
}

function ActionButton({ label, onClick, ...content }: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={content.active}
      onClick={onClick}
      className="group -ml-2 flex items-center"
    >
      <ActionContent {...content} />
    </button>
  );
}

type TweetActionBarProps = { tweet: Tweet; className?: string };

// Responder · Repostar/Citar · Curtir · Salvar
export function TweetActionBar({ tweet, className }: TweetActionBarProps) {
  const openCompose = useOpenCompose();
  const like = useToggleInteraction('like');
  const retweet = useToggleInteraction('retweet');
  const bookmark = useToggleInteraction('bookmark');
  const { stats, viewer } = tweet;
  const iconClass = 'size-[18px]';

  return (
    <div className={cn('mt-1 flex max-w-[425px] items-center justify-between', className)}>
      <ActionButton
        label={`Responder (${stats.replies})`}
        icon={<MessageCircle className={iconClass} />}
        count={stats.replies}
        color="brand"
        onClick={() => openCompose({ replyTo: tweet })}
      />

      <Dropdown
        align="left"
        triggerLabel={
          viewer.retweeted ? 'Desfazer repost' : `Repostar (${stats.retweets + stats.quotes})`
        }
        triggerClassName="group -ml-2 flex items-center"
        trigger={
          <ActionContent
            icon={<Repeat2 className={iconClass} />}
            count={stats.retweets + stats.quotes}
            active={viewer.retweeted}
            color="success"
          />
        }
        items={[
          {
            label: viewer.retweeted ? 'Desfazer repost' : 'Repostar',
            icon: <Repeat2 className={iconClass} />,
            onSelect: () => retweet.mutate({ id: tweet.id, on: !viewer.retweeted }),
          },
          {
            label: 'Citar',
            icon: <PenLine className={iconClass} />,
            onSelect: () => openCompose({ quote: tweet }),
          },
        ]}
      />

      <ActionButton
        label={viewer.liked ? `Descurtir (${stats.likes})` : `Curtir (${stats.likes})`}
        icon={<Heart className={iconClass} fill={viewer.liked ? 'currentColor' : 'none'} />}
        count={stats.likes}
        active={viewer.liked}
        color="like"
        onClick={() => like.mutate({ id: tweet.id, on: !viewer.liked })}
      />

      <ActionButton
        label={viewer.bookmarked ? 'Remover dos itens salvos' : 'Salvar'}
        icon={<Bookmark className={iconClass} fill={viewer.bookmarked ? 'currentColor' : 'none'} />}
        active={viewer.bookmarked}
        color="brand"
        onClick={() => bookmark.mutate({ id: tweet.id, on: !viewer.bookmarked })}
      />
    </div>
  );
}
