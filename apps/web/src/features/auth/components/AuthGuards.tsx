import { Navigate, Outlet, useLocation } from 'react-router';

import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';

import { CurrentUserContext, useSession } from '../api';

type LocationState = { from?: { pathname: string } } | null;

function SessionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-muted">Não foi possível carregar sua sessão.</p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  );
}

// Só deixa passar quem está logado. Quem não está vai pro /login,
// guardando a página de origem para voltar pra ela depois de entrar.
export function ProtectedRoute() {
  const { data: user, isPending, isError, refetch } = useSession();
  const location = useLocation();

  if (isPending) return <FullPageSpinner />;
  if (isError) return <SessionError onRetry={() => refetch()} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <CurrentUserContext value={user}>
      <Outlet />
    </CurrentUserContext>
  );
}

// Páginas só para visitantes (landing, login, cadastro). Logado → vai pro app.
export function PublicOnlyRoute() {
  const { data: user, isPending, isError, refetch } = useSession();
  const location = useLocation();

  if (isPending) return <FullPageSpinner />;
  if (isError) return <SessionError onRetry={() => refetch()} />;
  if (user) {
    const from = (location.state as LocationState)?.from?.pathname ?? '/home';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
