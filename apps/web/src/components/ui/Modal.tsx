import { ArrowLeft, X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /**
   * hero: título grande no corpo (login/cadastro).
   * compact: título pequeno no cabeçalho, ao lado de uma ação (ex.: "Editar perfil" + "Salvar").
   */
  variant?: 'hero' | 'compact';
  headerAction?: ReactNode;
  /** Troca o X por uma seta de voltar (para passos internos, como o recorte de imagem) */
  onBack?: () => void;
  className?: string;
};

// Usa o <dialog> nativo: foco preso dentro do modal, ESC pra fechar e backdrop de graça,
// com a acessibilidade que o navegador já implementa.
export function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'hero',
  headerAction,
  onBack,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() foca o primeiro elemento focável (o botão fechar) e ignora o autoFocus
      // do React. Em formulário, o esperado é começar no primeiro campo.
      dialog.querySelector<HTMLElement>('input:not([type=file]), textarea, select')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (onBack) onBack();
        else onClose();
      }}
      // clique fora do conteúdo (no backdrop) fecha
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'm-auto bg-background p-0 text-foreground backdrop:bg-[#5b7083]/40',
        'h-dvh max-h-none w-full max-w-none',
        // h-fit (e não h-auto): o <dialog> modal tem top/bottom 0, então com height:auto
        // ele estica até a altura máxima; fit-content faz ele abraçar o conteúdo.
        'sm:h-fit sm:max-h-[90vh] sm:w-[600px] sm:rounded-2xl',
        className,
      )}
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <header className="sticky top-0 z-10 flex h-[53px] shrink-0 items-center gap-6 bg-background/90 px-2 backdrop-blur">
          <button
            type="button"
            onClick={onBack ?? onClose}
            aria-label={onBack ? 'Voltar' : 'Fechar'}
            className="rounded-full p-2 hover:bg-foreground/10"
          >
            {onBack ? <ArrowLeft className="size-5" /> : <X className="size-5" />}
          </button>
          {variant === 'compact' && (
            <h2 id={titleId} className="flex-1 text-xl font-bold">
              {title}
            </h2>
          )}
          {headerAction && <div className="ml-auto pr-2">{headerAction}</div>}
        </header>

        {variant === 'hero' ? (
          <div className="flex-1 overflow-y-auto px-8 pb-12 sm:px-20">
            <h2 id={titleId} className="mb-8 text-[31px] leading-9 font-bold">
              {title}
            </h2>
            {/* só monta o conteúdo aberto: formulário novo a cada abertura */}
            {open && children}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">{open && children}</div>
        )}
      </div>
    </dialog>
  );
}
