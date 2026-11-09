import { Outlet } from 'react-router';

import { MobileNav } from './MobileNav';
import { RightColumn } from './RightColumn';
import { Sidebar } from './Sidebar';

// Layout de 3 colunas da área logada: navegação | conteúdo (600px) | coluna lateral.
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1265px] justify-center">
      <Sidebar />
      <main className="min-h-dvh w-full max-w-[600px] border-border pb-[53px] sm:border-x sm:pb-0">
        <Outlet />
      </main>
      <RightColumn />
      <MobileNav />
    </div>
  );
}
