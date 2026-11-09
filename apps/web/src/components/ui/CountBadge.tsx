import { cn } from '@/lib/cn';

/** Bolinha azul com um número (some quando é zero). Usada em Notificações e Mensagens. */
export function CountBadge({
  count,
  label,
  className,
}: {
  count: number;
  label: string;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={label}
      className={cn(
        'absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-brand px-1 text-[11px] font-bold text-white',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
