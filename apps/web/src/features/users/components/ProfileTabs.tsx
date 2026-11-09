import { useState } from 'react';

import { useUserTweets } from '@/features/tweets/api';
import { TweetList } from '@/features/tweets/components/TweetList';
import { cn } from '@/lib/cn';

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
      <div role="tablist" aria-label="Conteúdo do perfil" className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className="flex flex-1 justify-center px-4 text-[15px] transition-colors hover:bg-foreground/10"
          >
            <span
              className={cn(
                'relative py-4',
                active === tab ? 'font-bold text-foreground' : 'font-medium text-muted',
              )}
            >
              {tab}
              {active === tab && (
                <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-brand" />
              )}
            </span>
          </button>
        ))}
      </div>
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
