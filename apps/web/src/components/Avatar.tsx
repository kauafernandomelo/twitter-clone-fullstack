import { User } from 'lucide-react';

import { withTransform } from '@/lib/cloudinary';
import { cn } from '@/lib/cn';

const sizes = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
} as const;

type AvatarProps = {
  src: string | null | undefined;
  name: string;
  /** null = tamanho controlado pelo className (ex.: avatar proporcional do perfil) */
  size?: keyof typeof sizes | null;
  className?: string;
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const classes = cn(
    'shrink-0 rounded-full bg-surface object-cover',
    size && sizes[size],
    className,
  );

  if (!src) {
    return (
      <div role="img" aria-label={name} className={cn(classes, 'flex items-center justify-center')}>
        <User aria-hidden="true" className="size-1/2 text-muted" />
      </div>
    );
  }

  return (
    <img
      src={withTransform(src, 'c_fill,w_400,h_400,q_auto,f_auto')}
      alt={name}
      className={classes}
    />
  );
}
