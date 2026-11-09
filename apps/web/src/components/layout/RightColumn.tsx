import { Search } from 'lucide-react';

import { WhoToFollow } from '@/features/follows/components/WhoToFollow';

// Coluna lateral direita: busca (Fase 6), assuntos do momento e "Quem seguir".
export function RightColumn() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[290px] shrink-0 flex-col gap-4 py-1 pl-6 lg:flex xl:w-[350px] xl:pl-8">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          disabled
          placeholder="Buscar (em breve)"
          aria-label="Buscar"
          className="h-11 w-full rounded-full border border-border bg-transparent pr-4 pl-11 text-[15px] placeholder:text-muted disabled:cursor-not-allowed"
        />
      </div>

      <section className="rounded-2xl border border-border">
        <h2 className="px-4 py-3 text-xl font-extrabold">O que está acontecendo</h2>
        <p className="px-4 pb-4 text-[15px] text-muted">
          Os assuntos do momento aparecem aqui em breve.
        </p>
      </section>

      <WhoToFollow />

      <footer className="px-4 text-[13px] text-muted">
        © {new Date().getFullYear()} Twitter Clone — projeto de estudo
      </footer>
    </aside>
  );
}
