import { NavLink } from 'react-router';

import { cn } from '@/lib/cn';

type Tab = { label: string } & ({ to: string } | { active: boolean; onSelect: () => void });

// Abas no estilo Twitter (sublinhado azul). Aceita links (rotas) ou botões (estado local).
export function TabBar({ tabs, label }: { tabs: Tab[]; label: string }) {
  const content = (text: string, active: boolean) => (
    <span
      className={cn(
        'relative py-4',
        active ? 'font-bold text-foreground' : 'font-medium text-muted',
      )}
    >
      {text}
      {active && <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-brand" />}
    </span>
  );
  const itemClass =
    'flex flex-1 justify-center px-4 text-[15px] transition-colors hover:bg-foreground/10';

  return (
    <div role="tablist" aria-label={label} className="flex border-b border-border">
      {tabs.map((tab) =>
        'to' in tab ? (
          <NavLink key={tab.label} to={tab.to} replace end role="tab" className={itemClass}>
            {({ isActive }) => content(tab.label, isActive)}
          </NavLink>
        ) : (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={tab.active}
            onClick={tab.onSelect}
            className={itemClass}
          >
            {content(tab.label, tab.active)}
          </button>
        ),
      )}
    </div>
  );
}
