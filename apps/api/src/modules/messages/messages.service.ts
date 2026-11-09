import {
  type ConversationSummary,
  type conversationsQuerySchema,
  type cursorQuerySchema,
  type Message,
  MessageEvent,
  type Paginated,
  type sendMessageSchema,
} from '@twitter-clone/shared';
import type { z } from 'zod';

import { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../lib/app-error';
import { isOwnUploadUrl } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { emitToUser } from '../../lib/socket';
import { findUserIdByUsername } from '../users/users.service';

type SendMessageData = z.output<typeof sendMessageSchema>;
type CursorQuery = z.output<typeof cursorQuerySchema>;
type ConversationsQuery = z.output<typeof conversationsQuerySchema>;

// 404 também para quem não participa: não revela nem que a conversa existe
const notFound = () => new AppError(404, 'Conversa não encontrada', 'NOT_FOUND');

const pairKey = (a: string, b: string) => [a, b].sort().join(':');

const authorSelect = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  imageUrl: true,
  imageWidth: true,
  imageHeight: true,
  createdAt: true,
} satisfies Prisma.MessageSelect;

type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;

function toMessage({ imageUrl, imageWidth, imageHeight, ...row }: MessageRow): Message {
  return {
    ...row,
    image:
      imageUrl && imageWidth && imageHeight
        ? { url: imageUrl, width: imageWidth, height: imageHeight }
        : null,
    createdAt: row.createdAt.toISOString(),
  };
}

const conversationSelect = {
  id: true,
  lastMessageAt: true,
  participants: { select: { userId: true, lastReadAt: true, user: { select: authorSelect } } },
  messages: { orderBy: { id: 'desc' }, take: 1, select: messageSelect },
} satisfies Prisma.ConversationSelect;

type ConversationRow = Prisma.ConversationGetPayload<{ select: typeof conversationSelect }>;

async function toSummary(userId: string, row: ConversationRow): Promise<ConversationSummary> {
  const me = row.participants.find((p) => p.userId === userId);
  const other = row.participants.find((p) => p.userId !== userId);
  if (!me || !other) throw notFound();

  const unreadCount = await prisma.message.count({
    where: {
      conversationId: row.id,
      senderId: { not: userId },
      ...(me.lastReadAt && { createdAt: { gt: me.lastReadAt } }),
    },
  });

  return {
    id: row.id,
    other: other.user,
    lastMessage: row.messages[0] ? toMessage(row.messages[0]) : null,
    unreadCount,
    otherLastReadAt: other.lastReadAt?.toISOString() ?? null,
    lastMessageAt: row.lastMessageAt.toISOString(),
  };
}

/** Garante que o usuário participa; devolve o id da outra pessoa. */
async function getOtherParticipant(userId: string, conversationId: string) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  if (!participants.some((p) => p.userId === userId)) throw notFound();
  const other = participants.find((p) => p.userId !== userId);
  if (!other) throw notFound();
  return other.userId;
}

export async function getConversation(userId: string, conversationId: string) {
  const row = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId } } },
    select: conversationSelect,
  });
  if (!row) throw notFound();
  return toSummary(userId, row);
}

/** Abre a conversa com alguém (cria se ainda não existir). */
export async function startConversation(userId: string, username: string) {
  const otherId = await findUserIdByUsername(username);
  if (otherId === userId) {
    throw new AppError(400, 'Você não pode mandar mensagem para si mesmo', 'VALIDATION_ERROR');
  }

  const key = pairKey(userId, otherId);
  const create = () =>
    prisma.conversation.upsert({
      where: { pairKey: key },
      update: {},
      create: { pairKey: key, participants: { create: [{ userId }, { userId: otherId }] } },
      select: { id: true },
    });

  let conversation: { id: string };
  try {
    conversation = await create();
  } catch (error) {
    // duas requests criando a mesma conversa ao mesmo tempo: a segunda bate no UNIQUE
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      conversation = await create();
    } else {
      throw error;
    }
  }
  return getConversation(userId, conversation.id);
}

/** Caixa de entrada: conversas com mensagens, as mais recentes primeiro. */
export async function listConversations(
  userId: string,
  { cursor, limit }: ConversationsQuery,
): Promise<Paginated<ConversationSummary>> {
  const rows = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
      messages: { some: {} },
      ...(cursor && { lastMessageAt: { lt: new Date(cursor) } }),
    },
    orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    select: conversationSelect,
  });

  const page = rows.slice(0, limit);
  const items = await Promise.all(page.map((row) => toSummary(userId, row)));
  return { items, nextCursor: rows.length > limit ? (items.at(-1)?.lastMessageAt ?? null) : null };
}

/** Mensagens da mais nova para a mais antiga (o front exibe de baixo para cima). */
export async function listMessages(
  userId: string,
  conversationId: string,
  { cursor, limit }: CursorQuery,
): Promise<Paginated<Message>> {
  await getOtherParticipant(userId, conversationId);
  const rows = await prisma.message.findMany({
    where: { conversationId, ...(cursor && { id: { lt: cursor } }) },
    orderBy: { id: 'desc' },
    take: limit + 1,
    select: messageSelect,
  });
  const items = rows.slice(0, limit).map(toMessage);
  return { items, nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null };
}

export async function sendMessage(userId: string, conversationId: string, data: SendMessageData) {
  const otherId = await getOtherParticipant(userId, conversationId);

  if (data.image && !isOwnUploadUrl(data.image.url, userId, 'message')) {
    throw new AppError(400, 'Dados inválidos', 'VALIDATION_ERROR', { image: ['Imagem inválida'] });
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: data.content,
        imageUrl: data.image?.url,
        imageWidth: data.image?.width,
        imageHeight: data.image?.height,
      },
      select: messageSelect,
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: created.createdAt },
    });
    // quem envia já "leu" a conversa até aqui
    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: created.createdAt },
    });
    return toMessage(created);
  });

  // a mensagem vai junto no evento: o chat aberto mostra na hora, sem nova request
  const payload = { conversationId, message };
  emitToUser(otherId, MessageEvent.NEW, payload);
  emitToUser(userId, MessageEvent.NEW, payload); // minhas outras abas
  return message;
}

export async function markRead(userId: string, conversationId: string) {
  const otherId = await getOtherParticipant(userId, conversationId);
  const lastReadAt = new Date();
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt },
  });
  const payload = { conversationId, userId, lastReadAt: lastReadAt.toISOString() };
  emitToUser(otherId, MessageEvent.READ, payload); // "Visto" para a outra pessoa
  emitToUser(userId, MessageEvent.READ, payload); // zera o contador nas minhas outras abas
}

/** Conversas com mensagens que eu ainda não li (bolinha no ícone de Mensagens). */
export async function unreadConversations(userId: string) {
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM conversation_participants p
    WHERE p.user_id = ${userId}::uuid
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.conversation_id = p.conversation_id
          AND m.sender_id <> ${userId}::uuid
          AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
      )`;
  return row?.count ?? 0;
}

/** Repassa "digitando…" para a outra pessoa (se quem envia participa da conversa). */
export async function relayTyping(userId: string, conversationId: string, isTyping: boolean) {
  const otherId = await getOtherParticipant(userId, conversationId);
  emitToUser(otherId, MessageEvent.TYPING, { conversationId, userId, isTyping });
}
