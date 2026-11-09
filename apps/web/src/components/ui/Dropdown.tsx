import { type ReactNode, useCallback, useId, useRef, useState } from 'react';

import { useDismiss } from '@/hooks/use-dismiss';
import { cn } from '@/lib/cn';

export type DropdownItem = {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
};

type DropdownProps = {
  /** Conteúdo do botão que abre o menu */
  trigger: ReactNode;
  triggerLabel: string;
  items: DropdownItem[];
  align?: 'left' | 'right';
  triggerClassName?: string;
};

export function Dropdown({
  trigger,
  triggerLabel,
  items,
  align = 'right',
  triggerClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute top-0 z-20 min-w-[200px] overflow-hidden rounded-xl border border-border bg-background py-1 shadow-[0_0_15px_rgba(255,255,255,0.2)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-bold hover:bg-foreground/5',
                item.danger && 'text-danger',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
