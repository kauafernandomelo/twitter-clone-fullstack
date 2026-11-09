import type { ConversationSummary } from '@twitter-clone/shared';
import { Link } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { useCurrentUser } from '@/features/auth/api';
import { cn } from '@/lib/cn';
import { formatTweetTime } from '@/lib/date';

export function ConversationRow({ conversation }: { conversation: ConversationSummary }) {
  const me = useCurrentUser();
  const { other, lastMessage, unreadCount } = conversation;
  const unread = unreadCount > 0;

  const preview = !lastMessage
    ? ''
    : `${lastMessage.senderId === me.id ? 'Você: ' : ''}${lastMessage.content || 'Enviou uma imagem'}`;

  return (
    <Link
      to={`/messages/${conversation.id}`}
      aria-label={`Conversa com ${other.name}${unread ? ` (${unreadCount} não lidas)` : ''}`}
      className="flex gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.03]"
    >
      <Avatar src={other.avatarUrl} name={other.name} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[15px]">
          <span className="truncate font-bold">{other.name}</span>
          <span className="truncate text-muted">@{other.username}</span>
          <span className="text-muted">·</span>
          <span className="shrink-0 text-muted">{formatTweetTime(conversation.lastMessageAt)}</span>
        </p>
        <p
          className={cn(
            'truncate text-[15px]',
            unread ? 'font-bold text-foreground' : 'text-muted',
          )}
        >
          {preview}
        </p>
      </div>
      {unread && (
        <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full bg-brand" />
      )}
    </Link>
  );
}
