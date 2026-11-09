import { useState } from 'react';

import { AccountMenu } from '@/components/layout/AccountMenu';
import { Logo } from '@/components/Logo';
import { TabBar } from '@/components/ui/TabBar';
import { useFollowingFeed, useTimeline } from '@/features/tweets/api';
import { TweetComposer } from '@/features/tweets/components/TweetComposer';
import { TweetList } from '@/features/tweets/components/TweetList';

type Feed = 'for-you' | 'following';

function EmptyFeed({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-8 py-16 text-center">
      <p className="text-[31px] leading-9 font-extrabold">{title}</p>
      <p className="mt-2 text-[15px] text-muted">{description}</p>
    </div>
  );
}

function ForYouFeed() {
  return (
    <TweetList
      query={useTimeline()}
      empty={<EmptyFeed title="Ainda não há posts" description="Que tal escrever o primeiro?" />}
    />
  );
}

function FollowingFeed() {
  return (
    <TweetList
      query={useFollowingFeed()}
      empty={
        <EmptyFeed
          title="Seu feed está vazio"
          description="Siga pessoas para ver os posts delas aqui. Veja sugestões em “Quem seguir”."
        />
      }
    />
  );
}

export function HomePage() {
  const [feed, setFeed] = useState<Feed>('for-you');

  return (
    <>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <h1 className="sr-only">Início</h1>
        {/* no celular não há sidebar: avatar (menu da conta) + logo no topo */}
        <div className="relative flex h-[53px] items-center px-4 sm:hidden">
          <AccountMenu compact placement="bottom" className="-ml-1" />
          <Logo className="absolute left-1/2 size-7 -translate-x-1/2" />
        </div>
        <TabBar
          label="Feeds"
          tabs={[
            { label: 'Para você', active: feed === 'for-you', onSelect: () => setFeed('for-you') },
            {
              label: 'Seguindo',
              active: feed === 'following',
              onSelect: () => setFeed('following'),
            },
          ]}
        />
      </div>

      {/* no celular o post é criado pelo botão flutuante */}
      <TweetComposer className="hidden border-b border-border sm:flex" />

      {feed === 'for-you' ? <ForYouFeed /> : <FollowingFeed />}
    </>
  );
}
