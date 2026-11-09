import { Feather } from 'lucide-react';
import { Link, NavLink } from 'react-router';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/features/auth/api';
import { cn } from '@/lib/cn';

import { AccountMenu } from './AccountMenu';
import { getNavItems } from './nav-items';

// Desktop: ícone + texto (xl). Tablet: só ícones. Mobile: escondida (vira a MobileNav).
export function Sidebar() {
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 hidden h-dvh w-[88px] shrink-0 flex-col justify-between px-2 py-1 sm:flex xl:w-[275px] xl:px-3">
      <div className="flex flex-col items-center xl:items-stretch">
        <Link
          to="/home"
          aria-label="Página inicial"
          className="mb-1 flex size-[52px] items-center justify-center rounded-full hover:bg-foreground/10"
        >
          <Logo className="size-8" />
        </Link>

        <nav aria-label="Principal" className="flex flex-col items-center xl:items-stretch">
          {getNavItems(user.username).map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} aria-label={label} className="group py-1">
              {({ isActive }) => (
                <span className="inline-flex items-center gap-5 rounded-full p-3 transition-colors group-hover:bg-foreground/10 xl:pr-6">
                  <Icon className="size-[26px]" strokeWidth={isActive ? 2.75 : 1.75} />
                  <span className={cn('hidden text-xl xl:inline', isActive && 'font-bold')}>
                    {label}
                  </span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <Button size="lg" disabled title="Em breve" className="mt-4 hidden w-[90%] xl:inline-flex">
          Postar
        </Button>
        <Button
          disabled
          title="Em breve"
          aria-label="Postar"
          className="mt-4 size-[52px] p-0 xl:hidden"
        >
          <Feather className="size-6" />
        </Button>
      </div>

      <AccountMenu className="my-3" />
    </header>
  );
}
