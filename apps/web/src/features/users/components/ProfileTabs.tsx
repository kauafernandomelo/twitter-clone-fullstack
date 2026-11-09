import { useState } from 'react';

import { cn } from '@/lib/cn';

const TABS = ['Posts', 'Respostas', 'Mídia', 'Curtidas'] as const;

// As abas ganham conteúdo nas próximas fases (Posts na 3; Respostas, Mídia e Curtidas na 5).
export function ProfileTabs({ username }: { username: string }) {
  const [active, setActive] = useState<(typeof TABS)[number]>('Posts');

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
      <div role="tabpanel" className="px-8 py-10 text-center">
        <p className="text-[31px] leading-9 font-extrabold">Nada por aqui ainda</p>
        <p className="mt-2 text-[15px] text-muted">
          Quando @{username} tiver {active.toLowerCase()}, eles vão aparecer aqui.
        </p>
      </div>
    </>
  );
}
