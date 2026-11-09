import type { RouteObject } from 'react-router';

import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/components/AuthGuards';
import { HomePage } from '@/pages/HomePage';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

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
    children: [{ path: '/home', element: <HomePage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
];
