import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef } from 'react';

import { withTransform } from '@/lib/cloudinary';

export type LightboxImage = { url: string; width: number; height: number; alt: string };

type LightboxProps = {
  images: LightboxImage[];
  /** null = fechado */
  index: number | null;
  onIndexChange: (index: number | null) => void;
};

// Imagem em tela cheia. <dialog> nativo (foco preso, ESC fecha) + setas do teclado.
export function Lightbox({ images, index, onIndexChange }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const image = index !== null ? images[index] : undefined;
  const hasMany = images.length > 1;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // foco explícito dentro do lightbox: as setas do teclado e o leitor de tela começam aqui
      closeRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const go = (step: number) => {
    if (index === null) return;
    onIndexChange((index + step + images.length) % images.length);
  };

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (!hasMany) return;
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') go(-1);
  }

  const navButton =
    'absolute top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80';

  return (
    <dialog
      ref={ref}
      aria-label={
        image ? `${image.alt}${hasMany ? ` (${index! + 1} de ${images.length})` : ''}` : 'Imagem'
      }
      onCancel={(event) => {
        event.preventDefault();
        onIndexChange(null);
      }}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onIndexChange(null);
      }}
      className="m-0 h-dvh max-h-none w-dvw max-w-none bg-black/90 p-0 backdrop:bg-black/80"
    >
      {image && (
        <div
          className="flex size-full items-center justify-center p-4 sm:p-12"
          onClick={(event) => {
            if (event.target === event.currentTarget) onIndexChange(null);
          }}
        >
          <img
            src={withTransform(image.url, 'c_limit,w_2000,q_auto,f_auto')}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      <button
        ref={closeRef}
        type="button"
        onClick={() => onIndexChange(null)}
        aria-label="Fechar imagem"
        className="absolute top-3 left-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
      >
        <X className="size-5" />
      </button>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Imagem anterior"
            className={`${navButton} left-3`}
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próxima imagem"
            className={`${navButton} right-3`}
          >
            <ChevronRight className="size-6" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[13px] text-white">
            {index! + 1} de {images.length}
          </p>
        </>
      )}
    </dialog>
  );
}
