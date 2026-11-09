import {
  type ConversationResponse,
  conversationsQuerySchema,
  type ConversationSummary,
  cursorQuerySchema,
  type Message,
  type MessageResponse,
  type Paginated,
  sendMessageSchema,
  startConversationSchema,
  type UnreadCountResponse,
} from '@twitter-clone/shared';
import { type Request, Router } from 'express';

import { parseIdParam } from '../../lib/params';
import { getUserId, requireAuth } from '../../middlewares/require-auth';
import * as messagesService from './messages.service';

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

const conversationId = (req: Request) => parseIdParam(req.params.id, 'Conversa não encontrada');

conversationsRouter.get('/', async (req, res) => {
  const page = await messagesService.listConversations(
    getUserId(req),
    conversationsQuerySchema.parse(req.query),
  );
  res.json(page satisfies Paginated<ConversationSummary>);
});

conversationsRouter.post('/', async (req, res) => {
  const { username } = startConversationSchema.parse(req.body);
  const conversation = await messagesService.startConversation(getUserId(req), username);
  res.json({ conversation } satisfies ConversationResponse);
});

conversationsRouter.get('/unread-count', async (req, res) => {
  const count = await messagesService.unreadConversations(getUserId(req));
  res.json({ count } satisfies UnreadCountResponse);
});

conversationsRouter.get('/:id', async (req, res) => {
  const conversation = await messagesService.getConversation(getUserId(req), conversationId(req));
  res.json({ conversation } satisfies ConversationResponse);
});

conversationsRouter.get('/:id/messages', async (req, res) => {
  const page = await messagesService.listMessages(
    getUserId(req),
    conversationId(req),
    cursorQuerySchema.parse(req.query),
  );
  res.json(page satisfies Paginated<Message>);
});

conversationsRouter.post('/:id/messages', async (req, res) => {
  const data = sendMessageSchema.parse(req.body);
  const message = await messagesService.sendMessage(getUserId(req), conversationId(req), data);
  res.status(201).json({ message } satisfies MessageResponse);
});

conversationsRouter.post('/:id/read', async (req, res) => {
  await messagesService.markRead(getUserId(req), conversationId(req));
  res.status(204).end();
});
