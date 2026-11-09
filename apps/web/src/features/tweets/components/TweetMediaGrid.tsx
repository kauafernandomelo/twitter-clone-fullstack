import type { TweetMedia } from '@twitter-clone/shared';

import { withTransform } from '@/lib/cloudinary';
import { cn } from '@/lib/cn';

// Layout do Twitter: 1 imagem na proporção original (com limite de altura);
// 2 lado a lado; 3 = uma alta à esquerda + duas empilhadas; 4 = grade 2x2.
export function TweetMediaGrid({ media }: { media: TweetMedia[] }) {
  if (media.length === 0) return null;

  if (media.length === 1) {
    const [image] = media as [TweetMedia];
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-border">
        <img
          src={withTransform(image.url, 'c_limit,w_1200,q_auto,f_auto')}
          alt="Imagem do post"
          width={image.width}
          height={image.height}
          loading="lazy"
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
          className="max-h-[510px] w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mt-3 grid aspect-video grid-cols-2 gap-0.5 overflow-hidden rounded-2xl border border-border',
        media.length > 2 && 'grid-rows-2',
      )}
    >
      {media.map((image, index) => (
        <img
          key={image.url}
          src={withTransform(image.url, 'c_fill,w_800,h_800,q_auto,f_auto')}
          alt={`Imagem ${index + 1} de ${media.length} do post`}
          loading="lazy"
          className={cn(
            'size-full object-cover',
            media.length === 3 && index === 0 && 'row-span-2',
          )}
        />
      ))}
    </div>
  );
}
