import { useEffect, useRef } from 'react';

/**
 * Chama `onVisible` quando o elemento entra na tela. Usado no scroll infinito:
 * um "sentinela" no fim da lista dispara o carregamento da próxima página.
 */
export function useInView<T extends HTMLElement>(onVisible: () => void, enabled = true) {
  const ref = useRef<T>(null);
  const callback = useRef(onVisible);

  // guarda a versão mais recente do callback sem recriar o observer a cada render
  useEffect(() => {
    callback.current = onVisible;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    // rootMargin: começa a carregar um pouco antes de chegar no fim
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) callback.current();
      },
      { rootMargin: '400px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
