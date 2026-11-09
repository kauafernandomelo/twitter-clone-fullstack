import type { TweetMedia } from '@twitter-clone/shared';
import { useState } from 'react';

import { Lightbox } from '@/components/ui/Lightbox';
import { withTransform } from '@/lib/cloudinary';
import { cn } from '@/lib/cn';

type TweetMediaGridProps = {
  media: TweetMedia[];
  /**
   * false = imagens sem clique próprio (dentro de algo que já é link, como o card de citação;
   * um botão dentro de um link é HTML inválido)
   */
  interactive?: boolean;
};

const altFor = (index: number, total: number) =>
  total === 1 ? 'Imagem do post' : `Imagem ${index + 1} de ${total} do post`;

// Layout do Twitter: 1 imagem na proporção original (com limite de altura);
// 2 lado a lado; 3 = uma alta à esquerda + duas empilhadas; 4 = grade 2x2.
// Clicar abre a imagem em tela cheia (lightbox).
export function TweetMediaGrid({ media, interactive = true }: TweetMediaGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (media.length === 0) return null;

  const single = media.length === 1;

  const renderImage = (image: TweetMedia, index: number) => {
    const img = (
      <img
        src={withTransform(
          image.url,
          single ? 'c_limit,w_1200,q_auto,f_auto' : 'c_fill,w_800,h_800,q_auto,f_auto',
        )}
        alt={altFor(index, media.length)}
        width={single ? image.width : undefined}
        height={single ? image.height : undefined}
        loading="lazy"
        style={single ? { aspectRatio: `${image.width} / ${image.height}` } : undefined}
        className={cn('w-full object-cover', single ? 'max-h-[510px]' : 'size-full')}
      />
    );

    const cellClass = cn(!single && media.length === 3 && index === 0 && 'row-span-2');
    if (!interactive) {
      return (
        <div key={image.url} className={cellClass}>
          {img}
        </div>
      );
    }
    return (
      <button
        key={image.url}
        type="button"
        onClick={() => setOpenIndex(index)}
        aria-label={`Abrir ${altFor(index, media.length).toLowerCase()} em tela cheia`}
        className={cn('block cursor-zoom-in', cellClass)}
      >
        {img}
      </button>
    );
  };

  return (
    <>
      <div
        className={cn(
          'mt-3 overflow-hidden rounded-2xl border border-border',
          !single && 'grid aspect-video grid-cols-2 gap-0.5',
          media.length > 2 && 'grid-rows-2',
        )}
      >
        {media.map(renderImage)}
      </div>

      {interactive && (
        <Lightbox
          images={media.map((image, index) => ({ ...image, alt: altFor(index, media.length) }))}
          index={openIndex}
          onIndexChange={setOpenIndex}
        />
      )}
    </>
  );
}
