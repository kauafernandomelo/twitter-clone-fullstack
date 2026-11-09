import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/** Bloco cinza pulsante: a "silhueta" do conteúdo enquanto ele carrega. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-foreground/10', className)}
    />
  );
}

/** Silhueta de um post (avatar + linhas). */
export function TweetSkeleton() {
  return (
    <div className="flex gap-3 border-b border-border px-4 py-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </div>
  );
}

/** Silhueta de uma pessoa numa lista (seguidores, conversas). */
export function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3.5 w-1/4" />
      </div>
    </div>
  );
}

/** Repete uma silhueta N vezes, anunciando "Carregando" para leitores de tela. */
export function SkeletonList({ count = 3, item }: { count?: number; item: ReactNode }) {
  return (
    <div role="status" aria-label="Carregando">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>{item}</div>
      ))}
    </div>
  );
}
