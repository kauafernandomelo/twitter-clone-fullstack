import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

// Usa o <dialog> nativo: foco preso dentro do modal, ESC pra fechar e backdrop de graça,
// com a acessibilidade que o navegador já implementa.
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() foca o primeiro elemento focável (o botão fechar) e ignora o autoFocus
      // do React. Em formulário, o esperado é começar no primeiro campo.
      dialog.querySelector<HTMLElement>('input, textarea, select')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // clique fora do conteúdo (no backdrop) fecha
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'bg-background text-foreground m-auto p-0 backdrop:bg-[#5b7083]/40',
        'h-dvh max-h-none w-full max-w-none',
        'sm:h-auto sm:max-h-[90vh] sm:w-[600px] sm:rounded-2xl',
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center px-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="hover:bg-foreground/10 rounded-full p-2"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-8 pb-12 sm:px-20">
          <h2 id={titleId} className="mb-8 text-[31px] leading-9 font-bold">
            {title}
          </h2>
          {/* só monta o conteúdo aberto: formulário novo a cada abertura */}
          {open && children}
        </div>
      </div>
    </dialog>
  );
}
