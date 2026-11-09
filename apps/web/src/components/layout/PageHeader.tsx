import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  /** Elemento à esquerda do título (ex.: avatar no mobile) */
  start?: ReactNode;
};

// Cabeçalho fixo no topo da coluna central, com fundo translúcido (igual ao Twitter).
export function PageHeader({ title, subtitle, showBack, start }: PageHeaderProps) {
  const navigate = useNavigate();

  function goBack() {
    // se a pessoa abriu o link direto, não há "voltar" no histórico do app
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/home');
  }

  return (
    <header className="sticky top-0 z-10 flex h-[53px] items-center gap-6 bg-background/80 px-4 backdrop-blur-md">
      {showBack && (
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="-ml-2 rounded-full p-2 hover:bg-foreground/10"
        >
          <ArrowLeft className="size-5" />
        </button>
      )}
      {start}
      <div className="min-w-0">
        <h1 className="truncate text-xl leading-6 font-bold">{title}</h1>
        {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
