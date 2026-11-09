import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Esta página não existe.</h1>
      <Link
        to="/"
        className="rounded-full bg-brand px-5 py-2 font-bold text-white hover:bg-brand-hover"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
