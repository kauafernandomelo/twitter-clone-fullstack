import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { useCurrentUser, useLogout } from '@/features/auth/api';

// Placeholder da área logada. Na Fase 2 ganha o layout de 3 colunas; na Fase 4 vira a timeline.
export function HomePage() {
  const user = useCurrentUser();
  const logout = useLogout();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="size-12" />
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold">Olá, {user.name}!</h1>
        <p className="text-muted">@{user.username}</p>
      </div>
      <Button variant="outline" loading={logout.isPending} onClick={() => logout.mutate()}>
        Sair
      </Button>
    </main>
  );
}
