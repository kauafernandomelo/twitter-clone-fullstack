import { PageHeader } from '@/components/layout/PageHeader';
import { useCurrentUser } from '@/features/auth/api';
import { useBookmarks } from '@/features/tweets/api';
import { TweetList } from '@/features/tweets/components/TweetList';

export function BookmarksPage() {
  const user = useCurrentUser();

  return (
    <>
      <PageHeader title="Salvos" subtitle={`@${user.username}`} />
      <TweetList
        query={useBookmarks()}
        empty={
          <div className="px-8 py-16 text-center">
            <p className="text-[31px] leading-9 font-extrabold">Salve posts para ver depois</p>
            <p className="mt-2 text-[15px] text-muted">
              Toque no ícone de salvar de um post. Só você vê seus itens salvos.
            </p>
          </div>
        }
      />
    </>
  );
}
