import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';

// Rede de segurança: qualquer erro inesperado ao renderizar uma página cai aqui, em vez de
// deixar a tela em branco. O erro técnico vai para o console (para quem estiver depurando).
export function RouteErrorPage() {
  const error = useRouteError();
  if (!isRouteErrorResponse(error)) console.error(error);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="size-12" />
      <div className="space-y-2">
        <h1 className="text-[31px] leading-9 font-extrabold">Algo deu errado</h1>
        <p className="text-[15px] text-muted">
          Não foi culpa sua. Tente recarregar a página; se continuar, volte daqui a pouco.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>Recarregar</Button>
        <Link
          to="/home"
          reloadDocument
          className="inline-flex h-10 items-center rounded-full border border-border px-5 font-bold hover:bg-foreground/10"
        >
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
