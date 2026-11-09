import { useCallback, useLayoutEffect, useRef } from 'react';

/** Textarea que cresce conforme o texto (sem barra de rolagem interna). */
export function useAutosize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useLayoutEffect(resize, [value, resize]);

  return ref;
}
