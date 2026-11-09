import type { RouteObject } from 'react-router';

import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/components/AuthGuards';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { FollowListPage } from '@/pages/FollowListPage';
import { HomePage } from '@/pages/HomePage';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TweetPage } from '@/pages/TweetPage';

// Separado do createBrowserRouter para os testes montarem as mesmas rotas em memória.
export const routes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LandingPage modal="login" /> },
      { path: '/signup', element: <LandingPage modal="signup" /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <HomePage /> },
          {
            path: '/explore',
            element: (
              <ComingSoonPage title="Explorar" description="Busca de pessoas, posts e hashtags." />
            ),
          },
          {
            path: '/notifications',
            element: (
              <ComingSoonPage
                title="Notificações"
                description="Curtidas, respostas, menções e novos seguidores."
              />
            ),
          },
          {
            path: '/messages',
            element: (
              <ComingSoonPage title="Mensagens" description="Conversas privadas em tempo real." />
            ),
          },
          { path: '/bookmarks', element: <BookmarksPage /> },
          // rotas estáticas acima têm prioridade sobre este parâmetro
          { path: '/:username', element: <ProfilePage /> },
          { path: '/:username/status/:tweetId', element: <TweetPage /> },
          { path: '/:username/followers', element: <FollowListPage tab="followers" /> },
          { path: '/:username/following', element: <FollowListPage tab="following" /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];
