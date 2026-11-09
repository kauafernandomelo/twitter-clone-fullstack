import { useEffect, useId, useRef } from 'react';

import { Button } from './Button';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Diálogo pequeno de confirmação ("Apagar post?"), também com <dialog> nativo.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="m-auto w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl bg-background p-8 text-foreground backdrop:bg-[#5b7083]/40"
    >
      {open && (
        <>
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          <p id={descriptionId} className="mt-2 text-[15px] text-muted">
            {description}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant={danger ? 'danger' : 'inverse'}
              size="lg"
              fullWidth
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </>
      )}
    </dialog>
  );
}
