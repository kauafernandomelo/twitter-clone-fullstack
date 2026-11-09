import { useParams } from 'react-router';

import { InfiniteList } from '@/components/InfiniteList';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabBar } from '@/components/ui/TabBar';
import { useFollowers, useFollowing } from '@/features/follows/api';
import { UserRow } from '@/features/follows/components/UserRow';
import { useProfile } from '@/features/users/api';

type Tab = 'followers' | 'following';

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-8 py-10 text-center">
      <p className="text-[31px] leading-9 font-extrabold">{title}</p>
      <p className="mt-2 text-[15px] text-muted">{description}</p>
    </div>
  );
}

function FollowersList({ username }: { username: string }) {
  return (
    <InfiniteList
      query={useFollowers(username)}
      getKey={(user) => user.id}
      renderItem={(user) => <UserRow user={user} />}
      empty={
        <Empty
          title="Ainda sem seguidores"
          description={`Quando alguém seguir @${username}, vai aparecer aqui.`}
        />
      }
    />
  );
}

function FollowingList({ username }: { username: string }) {
  return (
    <InfiniteList
      query={useFollowing(username)}
      getKey={(user) => user.id}
      renderItem={(user) => <UserRow user={user} />}
      empty={
        <Empty
          title="Ainda não segue ninguém"
          description={`Quando @${username} seguir alguém, vai aparecer aqui.`}
        />
      }
    />
  );
}

export function FollowListPage({ tab }: { tab: Tab }) {
  const { username = '' } = useParams();
  const { data: profile } = useProfile(username);

  return (
    <>
      <PageHeader title={profile?.name ?? `@${username}`} subtitle={`@${username}`} showBack />
      <TabBar
        label="Conexões"
        tabs={[
          { label: 'Seguidores', to: `/${username}/followers` },
          { label: 'Seguindo', to: `/${username}/following` },
        ]}
      />
      {tab === 'followers' ? (
        <FollowersList username={username} />
      ) : (
        <FollowingList username={username} />
      )}
    </>
  );
}
