import { createBrowserRouter } from 'react-router';

import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Rotas da aplicação. Login/cadastro (Fase 1) e perfil (Fase 2) entram aqui.
export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
