import type { SearchTab } from '@twitter-clone/shared';
import { useSearchParams } from 'react-router';

import { Spinner } from '@/components/ui/Spinner';
import { TabBar } from '@/components/ui/TabBar';
import { UserRow } from '@/features/follows/components/UserRow';
import { useSearchTweets, useSearchUsers } from '@/features/search/api';
import { SearchBox } from '@/features/search/components/SearchBox';
import { TrendsList } from '@/features/search/components/TrendsList';
import { TweetList } from '@/features/tweets/components/TweetList';

type Filter = SearchTab | 'people';

function NoResults({ q }: { q: string }) {
  return (
    <div className="px-8 py-16 text-center">
      <p className="text-[31px] leading-9 font-extrabold break-words">
        Nenhum resultado para “{q}”
      </p>
      <p className="mt-2 text-[15px] text-muted">Tente outros termos ou confira a ortografia.</p>
    </div>
  );
}

function TweetResults({ q, tab }: { q: string; tab: SearchTab }) {
  return <TweetList query={useSearchTweets(q, tab)} empty={<NoResults q={q} />} />;
}

function PeopleResults({ q }: { q: string }) {
  const { data: users, isPending, isError } = useSearchUsers(q, { limit: 20 });
  if (isPending) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }
  if (isError || users.length === 0) return <NoResults q={q} />;
  return (
    <div>
      {users.map((user) => (
        <UserRow key={user.id} user={user} />
      ))}
    </div>
  );
}

// O estado da busca mora na URL (?q=...&f=...): dá para compartilhar o link e o "voltar" funciona.
export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() ?? '';
  const filterParam = params.get('f');
  const filter: Filter = filterParam === 'latest' || filterParam === 'people' ? filterParam : 'top';

  const setFilter = (next: Filter) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next === 'top') updated.delete('f');
        else updated.set('f', next);
        return updated;
      },
      { replace: true },
    );

  return (
    <>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <h1 className="sr-only">Explorar</h1>
        <div className="px-4 py-2">
          {/* key: recria o campo quando a busca muda pela URL (ex.: clicar num assunto) */}
          <SearchBox key={q} initialValue={q} autoFocus={!q} />
        </div>
        {q && (
          <TabBar
            label="Resultados"
            tabs={[
              { label: 'Destaques', active: filter === 'top', onSelect: () => setFilter('top') },
              {
                label: 'Mais recentes',
                active: filter === 'latest',
                onSelect: () => setFilter('latest'),
              },
              {
                label: 'Pessoas',
                active: filter === 'people',
                onSelect: () => setFilter('people'),
              },
            ]}
          />
        )}
      </div>

      {!q ? (
        <section aria-labelledby="explore-trends" className="border-t border-border">
          <h2 id="explore-trends" className="px-4 py-3 text-xl font-extrabold">
            Assuntos do momento
          </h2>
          <TrendsList emptyMessage="Nenhum assunto em alta nas últimas 24 horas." />
        </section>
      ) : filter === 'people' ? (
        <PeopleResults key={q} q={q} />
      ) : (
        <TweetResults key={`${q}:${filter}`} q={q} tab={filter} />
      )}
    </>
  );
}
