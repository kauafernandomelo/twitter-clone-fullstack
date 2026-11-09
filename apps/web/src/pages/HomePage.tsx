import { AccountMenu } from '@/components/layout/AccountMenu';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCurrentUser } from '@/features/auth/api';

// Vira a timeline na Fase 4.
export function HomePage() {
  const user = useCurrentUser();

  return (
    <>
      <PageHeader
        title="Início"
        // no celular não há sidebar: o menu da conta (sair) fica no avatar do topo
        start={<AccountMenu compact placement="bottom" className="-ml-1 sm:hidden" />}
      />
      <div className="border-t border-border px-8 py-16 text-center">
        <h2 className="text-[31px] leading-9 font-extrabold">Olá, {user.name}!</h2>
        <p className="mt-2 text-[15px] text-muted">
          Sua timeline vai aparecer aqui assim que você começar a seguir pessoas.
        </p>
      </div>
    </>
  );
}
