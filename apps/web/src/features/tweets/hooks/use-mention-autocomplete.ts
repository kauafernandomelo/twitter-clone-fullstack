import type { UserSummary } from '@twitter-clone/shared';
import { type ChangeEvent, type KeyboardEvent, type RefObject, useId, useState } from 'react';

import { useSearchUsers } from '@/features/search/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

// "@par" logo antes do cursor (o @ não pode estar colado em letra, para não pegar e-mails)
const MENTION_BEFORE_CARET = /(?:^|[^\p{L}\p{N}_@])@([a-zA-Z0-9_]{1,15})$/u;

/**
 * Autocomplete de @menções para um textarea controlado.
 * Devolve o estado da lista e os handlers para ligar no textarea. O textarea mantém o papel
 * nativo de caixa de texto (ARIA não permite "combobox" em textarea) e aponta para a lista
 * com aria-controls/aria-activedescendant.
 */
export function useMentionAutocomplete(
  text: string,
  setText: (value: string) => void,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
) {
  const listboxId = useId();
  const [caret, setCaret] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);

  const query = MENTION_BEFORE_CARET.exec(text.slice(0, caret))?.[1] ?? '';
  const debouncedQuery = useDebouncedValue(query, 150);
  const dismissed = dismissedAt === `${caret}:${query}`;
  const { data: users = [] } = useSearchUsers(debouncedQuery, {
    limit: 5,
    enabled: query.length > 0 && !dismissed,
  });

  const open = query.length > 0 && !dismissed && users.length > 0;
  const active = Math.min(activeIndex, Math.max(users.length - 1, 0));

  function syncCaret() {
    setCaret(textareaRef.current?.selectionStart ?? 0);
  }

  function select(user: UserSummary) {
    const start = caret - query.length - 1; // posição do @
    const inserted = `@${user.username} `;
    const next = text.slice(0, start) + inserted + text.slice(caret);
    const nextCaret = start + inserted.length;
    setText(next);
    setCaret(nextCaret);
    setActiveIndex(0);
    // move o cursor para depois da menção (depois que o React aplicar o novo valor)
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!open) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((active + 1) % users.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((active - 1 + users.length) % users.length);
        break;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        select(users[active]!);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation(); // não fecha o modal junto
        setDismissedAt(`${caret}:${query}`);
        break;
    }
  }

  const optionId = (index: number) => `${listboxId}-option-${index}`;

  return {
    open,
    users,
    active,
    setActiveIndex,
    select,
    optionId,
    listboxId,
    /** props para espalhar no textarea */
    textareaProps: {
      'aria-autocomplete': 'list' as const,
      'aria-controls': open ? listboxId : undefined,
      'aria-activedescendant': open ? optionId(active) : undefined,
      onKeyDown,
      // o cursor é lido também no onChange: colar pelo menu, ditado e teclados de celular
      // mudam o texto sem disparar keyup
      onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
        setCaret(event.target.selectionStart);
      },
      onSelect: syncCaret,
      onClick: syncCaret,
      onKeyUp: syncCaret,
    },
  };
}
