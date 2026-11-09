import { AccountMenu } from '@/components/layout/AccountMenu';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTimeline } from '@/features/tweets/api';
import { TweetComposer } from '@/features/tweets/components/TweetComposer';
import { TweetList } from '@/features/tweets/components/TweetList';

// Por enquanto a timeline é global (posts de todo mundo). Na Fase 4 vira as abas
// "Para você" (esta) e "Seguindo".
export function HomePage() {
  const timeline = useTimeline();

  return (
    <>
      <PageHeader
        title="Início"
        // no celular não há sidebar: o menu da conta (sair) fica no avatar do topo
        start={<AccountMenu compact placement="bottom" className="-ml-1 sm:hidden" />}
      />
      {/* no celular o post é criado pelo botão flutuante */}
      <TweetComposer className="hidden border-y border-border sm:flex" />
      <TweetList
        query={timeline}
        empty={
          <div className="border-t border-border px-8 py-16 text-center">
            <p className="text-[31px] leading-9 font-extrabold">Ainda não há posts</p>
            <p className="mt-2 text-[15px] text-muted">Que tal escrever o primeiro?</p>
          </div>
        }
      />
    </>
  );
}
