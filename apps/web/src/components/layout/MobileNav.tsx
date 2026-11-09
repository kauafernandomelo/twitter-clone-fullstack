import { Feather } from 'lucide-react';
import { NavLink } from 'react-router';

import { useCurrentUser } from '@/features/auth/api';
import { useOpenCompose } from '@/features/tweets/compose-context';

import { getNavItems } from './nav-items';

// Barra inferior do celular (sem "Salvos", que fica acessível pelo perfil no Twitter também).
export function MobileNav() {
  const user = useCurrentUser();
  const openCompose = useOpenCompose();
  const items = getNavItems(user.username).filter((item) => item.to !== '/bookmarks');

  return (
    <>
      <button
        type="button"
        onClick={openCompose}
        aria-label="Novo post"
        className="fixed right-4 bottom-[69px] z-20 flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-hover sm:hidden"
      >
        <Feather className="size-6" />
      </button>
      <nav
        aria-label="Navegação inferior"
        className="fixed inset-x-0 bottom-0 z-20 flex h-[53px] items-center justify-around border-t border-border bg-background/90 backdrop-blur sm:hidden"
      >
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} aria-label={label} className="flex flex-1 justify-center py-3">
            {({ isActive }) => (
              <Icon className="size-[26px]" strokeWidth={isActive ? 2.75 : 1.75} />
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
