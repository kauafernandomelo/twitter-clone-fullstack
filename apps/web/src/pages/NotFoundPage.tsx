import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Esta página não existe.</h1>
      <Link
        to="/"
        className="bg-brand hover:bg-brand-hover rounded-full px-5 py-2 font-bold text-white"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
