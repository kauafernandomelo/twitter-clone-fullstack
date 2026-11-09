import {
  type NotificationItem,
  notificationsQuerySchema,
  type Paginated,
  type UnreadCountResponse,
} from '@twitter-clone/shared';
import { Router } from 'express';

import { getUserId, requireAuth } from '../../middlewares/require-auth';
import * as notificationsService from './notifications.service';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req, res) => {
  const page = await notificationsService.list(
    getUserId(req),
    notificationsQuerySchema.parse(req.query),
  );
  res.json(page satisfies Paginated<NotificationItem>);
});

notificationsRouter.get('/unread-count', async (req, res) => {
  const count = await notificationsService.unreadCount(getUserId(req));
  res.json({ count } satisfies UnreadCountResponse);
});

notificationsRouter.post('/read', async (req, res) => {
  await notificationsService.markAllRead(getUserId(req));
  res.status(204).end();
});
