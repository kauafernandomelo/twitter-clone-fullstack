import type { Tweet } from '@twitter-clone/shared';
import { createContext, use } from 'react';

/** Sem opções = post novo; com replyTo = resposta; com quote = citação. */
export type ComposeOptions = { replyTo?: Tweet; quote?: Tweet };

// Qualquer lugar do app (sidebar, botão flutuante, ações do post) pode abrir o modal de post.
export const ComposeContext = createContext<((options?: ComposeOptions) => void) | null>(null);

export function useOpenCompose() {
  const open = use(ComposeContext);
  if (!open) throw new Error('useOpenCompose precisa estar dentro do ComposeProvider');
  return open;
}
