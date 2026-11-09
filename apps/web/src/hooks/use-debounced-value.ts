import { useEffect, useState } from 'react';

/** Devolve o valor só depois de `delay` ms sem mudanças (evita uma busca por tecla). */
export function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
