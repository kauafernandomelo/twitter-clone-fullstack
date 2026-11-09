import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env';
import { logger } from './lib/logger';
import { readWebApp, serveWebApp, type WebApp } from './lib/web-app';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { apiRateLimit } from './middlewares/rate-limit';
import { routes } from './routes';

type AppOptions = {
  /** pasta do front compilado; padrão: WEB_DIST_DIR (só em produção) */
  webDistDir?: string;
};

// A app é criada separada do listen() para os testes usarem sem abrir porta.
export function createApp({ webDistDir = env.WEB_DIST_DIR }: AppOptions = {}) {
  const app = express();
  const web: WebApp | null = webDistDir ? readWebApp(webDistDir) : null;

  app.disable('x-powered-by');
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);

  // Content Security Policy: o navegador só executa/carrega o que estiver listado aqui.
  // Se alguém conseguir injetar HTML, um <script> de fora não roda.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", ...(web?.inlineScriptHashes ?? [])],
          // imagens do Cloudinary e pré-visualizações locais (blob:) de upload/recorte
          imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
          // upload vai direto do navegador para o Cloudinary; o resto (REST e WebSocket) é same-origin
          connectSrc: ["'self'", 'https://api.cloudinary.com'],
        },
      },
    }),
  );
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use('/api', apiRateLimit);
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));

  app.use('/api', routes);
  if (web) serveWebApp(app, web);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
