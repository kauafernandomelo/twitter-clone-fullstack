import type { UserSummary } from '@twitter-clone/shared';
import { Link } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { useCurrentUser } from '@/features/auth/api';

import { FollowButton } from './FollowButton';
import { FollowsYouBadge } from './FollowsYouBadge';

type UserRowProps = { user: UserSummary; showBio?: boolean };

export function UserRow({ user, showBio = true }: UserRowProps) {
  const me = useCurrentUser();

  return (
    <article
      aria-label={user.name}
      className="flex gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.03]"
    >
      <Link to={`/${user.username}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <Avatar src={user.avatarUrl} name={user.name} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <Link to={`/${user.username}`} className="group min-w-0 text-[15px]">
            <span className="block truncate font-bold group-hover:underline">{user.name}</span>
            <span className="flex items-center gap-1 text-muted">
              <span className="truncate">@{user.username}</span>
              {user.followsYou && <FollowsYouBadge />}
            </span>
          </Link>
          {user.id !== me.id && (
            <FollowButton username={user.username} isFollowing={user.isFollowing} size="sm" />
          )}
        </div>
        {showBio && user.bio && (
          <p className="mt-1 text-[15px] break-words whitespace-pre-wrap">{user.bio}</p>
        )}
      </div>
    </article>
  );
}
