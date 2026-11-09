import { useHealth } from '@/features/health/api';

// Página provisória da Fase 0: só prova que front, API e tema estão ligados.
// Vira a timeline na Fase 4.
export function HomePage() {
  const { data, isPending, isError } = useHealth();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="fill-brand size-14">
        <path d="M23.6 4.6c-.9.4-1.8.6-2.8.8 1-.6 1.8-1.6 2.1-2.7-.9.6-2 1-3.1 1.2a4.9 4.9 0 0 0-8.4 4.5C7.4 8.2 3.8 6.3 1.4 3.3a4.9 4.9 0 0 0 1.5 6.6c-.8 0-1.6-.3-2.2-.6 0 2.4 1.7 4.4 3.9 4.8-.7.2-1.5.2-2.2.1.6 2 2.4 3.4 4.6 3.4A9.9 9.9 0 0 1 0 19.5 13.9 13.9 0 0 0 7.5 21.7c9.1 0 14-7.5 14-14v-.6c1-.7 1.8-1.6 2.1-2.5z" />
      </svg>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold">Acontecendo agora</h1>
        <p className="text-muted">Fase 0 — fundação do projeto pronta.</p>
      </div>

      <p role="status" className="border-border bg-surface rounded-full border px-4 py-2 text-sm">
        API: {isPending && <span className="text-muted">verificando…</span>}
        {isError && <span className="text-danger">offline</span>}
        {data && <span className="text-success">online</span>}
      </p>
    </main>
  );
}
