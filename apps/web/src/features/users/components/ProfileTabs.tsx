import { useState } from 'react';

import { TabBar } from '@/components/ui/TabBar';
import { type ProfileTab, useUserTweets } from '@/features/tweets/api';
import { TweetList } from '@/features/tweets/components/TweetList';

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-8 py-10 text-center">
      <p className="text-[31px] leading-9 font-extrabold">{title}</p>
      <p className="mt-2 text-[15px] text-muted">{description}</p>
    </div>
  );
}

const TAB_LABELS: Record<ProfileTab, string> = {
  tweets: 'Posts',
  replies: 'Respostas',
  media: 'Mídia',
  likes: 'Curtidas',
};

function emptyFor(tab: ProfileTab, username: string, isOwnProfile: boolean) {
  const who = isOwnProfile ? 'Você' : `@${username}`;
  switch (tab) {
    case 'tweets':
      return {
        title: 'Nada por aqui ainda',
        description: `Quando ${who} postar, os posts vão aparecer aqui.`,
      };
    case 'replies':
      return {
        title: 'Nenhuma resposta ainda',
        description: `As respostas de ${who} vão aparecer aqui.`,
      };
    case 'media':
      return {
        title: 'Nenhuma foto ainda',
        description: `Os posts com imagens de ${who} vão aparecer aqui.`,
      };
    case 'likes':
      return {
        title: 'Nenhuma curtida ainda',
        description: 'Toque no coração de um post para curtir. Só você vê suas curtidas.',
      };
  }
}

function TabContent({
  username,
  tab,
  isOwnProfile,
}: {
  username: string;
  tab: ProfileTab;
  isOwnProfile: boolean;
}) {
  const query = useUserTweets(username, tab);
  return (
    <TweetList query={query} empty={<EmptyState {...emptyFor(tab, username, isOwnProfile)} />} />
  );
}

// Curtidas são privadas (como no Twitter desde 2024): a aba só aparece no próprio perfil.
export function ProfileTabs({
  username,
  isOwnProfile,
}: {
  username: string;
  isOwnProfile: boolean;
}) {
  const [active, setActive] = useState<ProfileTab>('tweets');
  const tabs: ProfileTab[] = isOwnProfile
    ? ['tweets', 'replies', 'media', 'likes']
    : ['tweets', 'replies', 'media'];

  return (
    <>
      <TabBar
        label="Conteúdo do perfil"
        tabs={tabs.map((tab) => ({
          label: TAB_LABELS[tab],
          active: active === tab,
          onSelect: () => setActive(tab),
        }))}
      />
      <div role="tabpanel">
        <TabContent
          key={`${username}:${active}`}
          username={username}
          tab={active}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </>
  );
}
