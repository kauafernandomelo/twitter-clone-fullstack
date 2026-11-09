import { Router } from 'express';

import { authRouter } from './modules/auth/auth.routes';
import { feedRouter } from './modules/feed/feed.routes';
import { suggestionsRouter } from './modules/follows/suggestions.routes';
import { healthRouter } from './modules/health/health.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { hashtagsRouter, searchRouter, trendsRouter } from './modules/search/search.routes';
import { bookmarksRouter } from './modules/tweets/bookmarks.routes';
import { tweetsRouter } from './modules/tweets/tweets.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { usersRouter } from './modules/users/users.routes';

// Ponto único onde cada módulo registra suas rotas.
export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/auth', authRouter);
routes.use('/users', usersRouter);
routes.use('/uploads', uploadsRouter);
routes.use('/tweets', tweetsRouter);
routes.use('/feed', feedRouter);
routes.use('/suggestions', suggestionsRouter);
routes.use('/bookmarks', bookmarksRouter);
routes.use('/search', searchRouter);
routes.use('/hashtags', hashtagsRouter);
routes.use('/trends', trendsRouter);
routes.use('/notifications', notificationsRouter);
