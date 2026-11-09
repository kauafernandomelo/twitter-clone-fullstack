import { type ReactNode, useState } from 'react';

import { Modal } from '@/components/ui/Modal';

import { ComposeContext } from '../compose-context';
import { TweetComposer } from './TweetComposer';

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <ComposeContext value={() => setOpen(true)}>
      {children}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo post" variant="compact">
        <TweetComposer autoFocus onPosted={() => setOpen(false)} className="pb-4" />
      </Modal>
    </ComposeContext>
  );
}
