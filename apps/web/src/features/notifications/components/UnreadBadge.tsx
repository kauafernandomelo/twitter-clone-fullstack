import { useUnreadCount } from '../api';

/** Bolinha azul com o número de notificações não lidas (some quando é zero). */
export function UnreadBadge({ className = '' }: { className?: string }) {
  const { data: count = 0 } = useUnreadCount();
  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} notificações não lidas`}
      className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-brand px-1 text-[11px] font-bold text-white ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
