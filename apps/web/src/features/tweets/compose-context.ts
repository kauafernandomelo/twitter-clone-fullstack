import { createContext, use } from 'react';

// Qualquer lugar do layout (sidebar, botão flutuante do mobile) pode abrir o modal de post.
export const ComposeContext = createContext<(() => void) | null>(null);

export function useOpenCompose() {
  const open = use(ComposeContext);
  if (!open) throw new Error('useOpenCompose precisa estar dentro do ComposeProvider');
  return open;
}
