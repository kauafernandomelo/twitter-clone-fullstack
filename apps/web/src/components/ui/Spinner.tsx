import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/cn';

export function Spinner({
  className,
  label = 'Carregando',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <LoaderCircle
      role="status"
      aria-label={label}
      className={cn('size-6 animate-spin text-brand', className)}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
