import type { UserProfile } from '@twitter-clone/shared';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Link2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/Button';
import { FollowButton } from '@/features/follows/components/FollowButton';
import { FollowsYouBadge } from '@/features/follows/components/FollowsYouBadge';
import { MessageButton } from '@/features/messages/components/MessageButton';
import { withTransform } from '@/lib/cloudinary';

import { EditProfileModal } from './EditProfileModal';

type ProfileHeaderProps = { profile: UserProfile; isOwnProfile: boolean };

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const [editing, setEditing] = useState(false);
  const joinedAt = format(new Date(profile.createdAt), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <section>
      <div className="aspect-[3/1] bg-surface">
        {profile.bannerUrl && (
          <img
            src={withTransform(profile.bannerUrl, 'c_fill,w_1500,h_500,q_auto,f_auto')}
            alt=""
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="px-4 pt-3">
        <div className="flex items-start justify-between">
          <Avatar
            src={profile.avatarUrl}
            name={profile.name}
            size={null}
            className="-mt-[15%] aspect-square w-1/4 min-w-12 border-4 border-background"
          />
          {isOwnProfile ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <MessageButton username={profile.username} />
              <FollowButton username={profile.username} isFollowing={profile.isFollowing} />
            </div>
          )}
        </div>

        <div className="mt-3 mb-3">
          <h2 className="text-xl leading-6 font-extrabold break-words">{profile.name}</h2>
          <p className="flex items-center gap-1 text-[15px] text-muted">
            @{profile.username}
            {profile.followsYou && <FollowsYouBadge />}
          </p>
        </div>

        {profile.bio && (
          <p className="mb-3 text-[15px] break-words whitespace-pre-wrap">{profile.bio}</p>
        )}

        <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[15px] text-muted">
          {profile.location && (
            <li className="flex items-center gap-1">
              <MapPin className="size-[18px]" aria-hidden="true" />
              {profile.location}
            </li>
          )}
          {profile.website && (
            <li className="flex items-center gap-1">
              <Link2 className="size-[18px]" aria-hidden="true" />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-brand hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </li>
          )}
          <li className="flex items-center gap-1">
            <CalendarDays className="size-[18px]" aria-hidden="true" />
            Entrou em {joinedAt}
          </li>
        </ul>

        <div className="mb-4 flex gap-5 text-[15px]">
          <Link to={`/${profile.username}/following`} className="hover:underline">
            <span className="font-bold">{profile.followingCount}</span>{' '}
            <span className="text-muted">Seguindo</span>
          </Link>
          <Link to={`/${profile.username}/followers`} className="hover:underline">
            <span className="font-bold">{profile.followersCount}</span>{' '}
            <span className="text-muted">
              {profile.followersCount === 1 ? 'Seguidor' : 'Seguidores'}
            </span>
          </Link>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileModal profile={profile} open={editing} onClose={() => setEditing(false)} />
      )}
    </section>
  );
}
