import { Outlet } from 'react-router';

import { RealtimeMessages } from '@/features/messages/components/RealtimeMessages';
import { RealtimeNotifications } from '@/features/notifications/components/RealtimeNotifications';
import { ComposeProvider } from '@/features/tweets/components/ComposeProvider';

import { MobileNav } from './MobileNav';
import { RightColumn } from './RightColumn';
import { Sidebar } from './Sidebar';

// Layout de 3 colunas da área logada: navegação | conteúdo (600px) | coluna lateral.
export function AppLayout() {
  return (
    <ComposeProvider>
      {/* primeiro item do Tab: quem usa teclado pula a navegação direto para o conteúdo */}
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-full bg-brand px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex min-h-dvh max-w-[1265px] justify-center">
        <Sidebar />
        <main
          id="conteudo"
          tabIndex={-1}
          className="min-h-dvh w-full max-w-[600px] border-border pb-[53px] focus:outline-none sm:border-x sm:pb-0"
        >
          <Outlet />
        </main>
        <RightColumn />
        <MobileNav />
        <RealtimeNotifications />
        <RealtimeMessages />
      </div>
    </ComposeProvider>
  );
}
