import { Search, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';

import { cn } from '@/lib/cn';

type SearchBoxProps = { initialValue?: string; className?: string; autoFocus?: boolean };

// Enter leva para /explore?q=... (a busca de verdade acontece na página Explorar).
export function SearchBox({ initialValue = '', className, autoFocus }: SearchBoxProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    if (q) navigate(`/explore?q=${encodeURIComponent(q)}`);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar"
        aria-label="Buscar"
        autoFocus={autoFocus}
        maxLength={100}
        className="h-11 w-full rounded-full border border-border bg-surface pr-10 pl-11 text-[15px] placeholder:text-muted focus:border-brand focus:bg-background focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => setValue('')}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-brand p-0.5 text-black"
        >
          <X className="size-3.5" />
        </button>
      )}
    </form>
  );
}
