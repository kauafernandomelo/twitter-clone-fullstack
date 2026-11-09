import { useLocation } from 'react-router';

import { WhoToFollow } from '@/features/follows/components/WhoToFollow';
import { SearchBox } from '@/features/search/components/SearchBox';
import { TrendsList } from '@/features/search/components/TrendsList';

// Coluna lateral direita: busca, assuntos do momento e "Quem seguir".
export function RightColumn() {
  // na própria página Explorar a busca e os assuntos já estão no centro
  const onExplore = useLocation().pathname === '/explore';

  return (
    <aside className="sticky top-0 hidden h-dvh w-[290px] shrink-0 flex-col gap-4 overflow-y-auto py-1 pl-6 lg:flex xl:w-[350px] xl:pl-8">
      {!onExplore && (
        <>
          <SearchBox />
          <section
            aria-labelledby="trends-title"
            className="overflow-hidden rounded-2xl border border-border"
          >
            <h2 id="trends-title" className="px-4 py-3 text-xl font-extrabold">
              O que está acontecendo
            </h2>
            <TrendsList emptyMessage="Nenhum assunto em alta agora. Use #hashtags nos seus posts!" />
          </section>
        </>
      )}

      <WhoToFollow />

      <footer className="px-4 text-[13px] text-muted">
        © {new Date().getFullYear()} Twitter Clone — projeto de estudo
      </footer>
    </aside>
  );
}
