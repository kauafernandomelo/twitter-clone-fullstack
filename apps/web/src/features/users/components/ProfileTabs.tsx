import { useState } from 'react';

import { useUserTweets } from '@/features/tweets/api';
import { TweetList } from '@/features/tweets/components/TweetList';
import { TabBar } from '@/components/ui/TabBar';

const TABS = ['Posts', 'Respostas', 'Mídia', 'Curtidas'] as const;
type Tab = (typeof TABS)[number];

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-8 py-10 text-center">
      <p className="text-[31px] leading-9 font-extrabold">{title}</p>
      <p className="mt-2 text-[15px] text-muted">{description}</p>
    </div>
  );
}

function PostsTab({ username }: { username: string }) {
  const tweets = useUserTweets(username);
  return (
    <TweetList
      query={tweets}
      empty={
        <EmptyState
          title="Nada por aqui ainda"
          description={`Quando @${username} postar, os posts vão aparecer aqui.`}
        />
      }
    />
  );
}

// Respostas, Mídia e Curtidas ganham conteúdo na Fase 5.
export function ProfileTabs({ username }: { username: string }) {
  const [active, setActive] = useState<Tab>('Posts');

  return (
    <>
      <TabBar
        label="Conteúdo do perfil"
        tabs={TABS.map((tab) => ({
          label: tab,
          active: active === tab,
          onSelect: () => setActive(tab),
        }))}
      />
      <div role="tabpanel">
        {active === 'Posts' ? (
          <PostsTab username={username} />
        ) : (
          <EmptyState title="Em breve" description={`A aba ${active} chega nas próximas fases.`} />
        )}
      </div>
    </>
  );
}
