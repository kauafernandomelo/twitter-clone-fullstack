import { Ellipsis } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Avatar } from '@/components/Avatar';
import { useCurrentUser, useLogout } from '@/features/auth/api';
import { cn } from '@/lib/cn';

type AccountMenuProps = {
  /** compact: só o avatar (cabeçalho do mobile) */
  compact?: boolean;
  /** onde o menu abre: acima do botão (sidebar, no rodapé) ou abaixo (cabeçalho, no topo) */
  placement?: 'top' | 'bottom';
  className?: string;
};

export function AccountMenu({ compact, placement = 'top', className }: AccountMenuProps) {
  const user = useCurrentUser();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // fecha ao clicar fora ou apertar ESC
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute left-0 z-20 w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-background py-3 shadow-[0_0_15px_rgba(255,255,255,0.2)]',
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          <button
            type="button"
            role="menuitem"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            className="w-full px-4 py-3 text-left font-bold hover:bg-foreground/5"
          >
            Sair de @{user.username}
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label="Menu da conta"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-3 rounded-full text-left transition-colors hover:bg-foreground/10',
          compact ? 'p-1' : 'p-3',
        )}
      >
        <Avatar src={user.avatarUrl} name={user.name} size={compact ? 'sm' : 'md'} />
        {!compact && (
          <>
            <span className="hidden min-w-0 flex-1 xl:block">
              <span className="block truncate font-bold">{user.name}</span>
              <span className="block truncate text-muted">@{user.username}</span>
            </span>
            <Ellipsis className="hidden size-5 xl:block" />
          </>
        )}
      </button>
    </div>
  );
}
