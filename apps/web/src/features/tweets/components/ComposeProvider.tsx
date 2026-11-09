import { type ReactNode, useState } from 'react';

import { Modal } from '@/components/ui/Modal';

import { type ComposeOptions, ComposeContext } from '../compose-context';
import { TweetCard } from './TweetCard';
import { TweetComposer } from './TweetComposer';

export function ComposeProvider({ children }: { children: ReactNode }) {
  // null = fechado; objeto (mesmo vazio) = aberto com essas opções
  const [options, setOptions] = useState<ComposeOptions | null>(null);
  const close = () => setOptions(null);

  const title = options?.replyTo ? 'Responder' : options?.quote ? 'Citar post' : 'Novo post';

  return (
    <ComposeContext value={(next = {}) => setOptions(next)}>
      {children}
      <Modal open={options !== null} onClose={close} title={title} variant="compact">
        {options?.replyTo && (
          // o post sendo respondido, com a linha ligando até a resposta
          <TweetCard tweet={options.replyTo} threadLine preview />
        )}
        <TweetComposer
          autoFocus
          replyTo={options?.replyTo}
          quote={options?.quote}
          onPosted={close}
          className="pb-4"
        />
      </Modal>
    </ComposeContext>
  );
}
