import { type ConversationSummary, type Message, MessageEvent } from '@twitter-clone/shared';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser, otherProfile } from '@/test/fixtures';
import { authors } from '@/test/fixtures-tweets';
import { emitSocketEvent, sentEvents } from '@/test/fake-socket';
import { mockApi } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const loggedIn = { 'GET /auth/me': { status: 200, body: { user: authUser } } };
const page = (items: unknown[]) => ({ status: 200, body: { items, nextCursor: null } });
const CONV = '0196f0e5-0000-7000-8000-00000000c0de';

let seq = 0;
const message = (overrides: Partial<Message>): Message => {
  seq += 1;
  return {
    id: `0196f0e5-0000-7000-8000-${String(seq).padStart(12, '0')}`,
    conversationId: CONV,
    senderId: authors.bruno.id,
    content: `mensagem ${seq}`,
    image: null,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    ...overrides,
  };
};

const conversation = (overrides: Partial<ConversationSummary> = {}): ConversationSummary => ({
  id: CONV,
  other: authors.bruno,
  lastMessage: null,
  unreadCount: 0,
  otherLastReadAt: null,
  lastMessageAt: new Date().toISOString(),
  ...overrides,
});

const chatApi = (messages: Message[], conv = conversation()) => ({
  ...loggedIn,
  [`GET /conversations/${CONV}`]: { status: 200, body: { conversation: conv } },
  [`GET /conversations/${CONV}/messages`]: page(messages),
  [`POST /conversations/${CONV}/read`]: { status: 204 },
});

describe('caixa de entrada', () => {
  it('lista as conversas e destaca as não lidas', async () => {
    mockApi({
      ...loggedIn,
      'GET /conversations': page([
        conversation({ unreadCount: 2, lastMessage: message({ content: 'bora tomar um café?' }) }),
      ]),
    });
    renderApp('/messages');

    const row = await screen.findByRole('link', { name: 'Conversa com Bruno Lima (2 não lidas)' });
    expect(within(row).getByText('bora tomar um café?')).toBeVisible();
  });

  it('nova mensagem: busca a pessoa e abre a conversa', async () => {
    mockApi({
      ...chatApi([]),
      'GET /conversations': page([]),
      'GET /search/users': {
        status: 200,
        body: { users: [{ ...authors.bruno, bio: null, isFollowing: false, followsYou: false }] },
      },
      'POST /conversations': { status: 200, body: { conversation: conversation() } },
    });
    const { router } = renderApp('/messages');

    await userEvent.click(await screen.findByRole('button', { name: 'Escrever uma mensagem' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Nova mensagem' }));
    await userEvent.type(dialog.getByRole('searchbox', { name: 'Buscar pessoas' }), 'bru');
    await userEvent.click(await dialog.findByRole('button', { name: /Bruno Lima/ }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/messages/${CONV}`));
  });
});

describe('conversa', () => {
  it('mostra as mensagens, marca como lida e exibe "Visto" na minha última', async () => {
    let readCalled = false;
    const mine = message({ senderId: authUser.id, content: 'oi, tudo bem?' });
    const theirs = message({ content: 'tudo ótimo!', createdAt: new Date().toISOString() });
    mockApi({
      ...chatApi([theirs, mine], conversation({ otherLastReadAt: new Date().toISOString() })),
      [`POST /conversations/${CONV}/read`]: () => {
        readCalled = true;
        return { status: 204 };
      },
    });
    renderApp(`/messages/${CONV}`);

    expect(await screen.findByText('oi, tudo bem?')).toBeVisible();
    expect(screen.getByText('tudo ótimo!')).toBeVisible();
    expect(screen.getByText('Visto')).toBeVisible();
    await waitFor(() => expect(readCalled).toBe(true));
  });

  it('Enter envia e Shift+Enter quebra a linha', async () => {
    let sent: unknown;
    mockApi({
      ...chatApi([]),
      [`POST /conversations/${CONV}/messages`]: (body) => {
        sent = body;
        return {
          status: 201,
          body: { message: message({ senderId: authUser.id, content: 'linha 1\nlinha 2' }) },
        };
      },
    });
    renderApp(`/messages/${CONV}`);

    const input = await screen.findByRole('textbox', { name: 'Mensagem' });
    await userEvent.type(input, 'linha 1{Shift>}{Enter}{/Shift}linha 2');
    expect(input).toHaveValue('linha 1\nlinha 2');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(sent).toEqual({ content: 'linha 1\nlinha 2' }));
    expect(input).toHaveValue('');
    expect(await screen.findByText(/linha 1/)).toBeVisible();
  });

  it('avisa a outra pessoa que estou digitando', async () => {
    mockApi(chatApi([]));
    renderApp(`/messages/${CONV}`);

    await userEvent.type(await screen.findByRole('textbox', { name: 'Mensagem' }), 'o');

    expect(sentEvents).toContainEqual({
      event: MessageEvent.TYPING,
      payload: { conversationId: CONV, isTyping: true },
    });
  });

  it('recebe em tempo real: "digitando…" e depois a mensagem', async () => {
    mockApi(chatApi([]));
    renderApp(`/messages/${CONV}`);
    await screen.findByRole('textbox', { name: 'Mensagem' });

    act(() =>
      emitSocketEvent(MessageEvent.TYPING, {
        conversationId: CONV,
        userId: authors.bruno.id,
        isTyping: true,
      }),
    );
    expect(await screen.findByRole('status', { name: 'Bruno Lima está digitando' })).toBeVisible();

    act(() =>
      emitSocketEvent(MessageEvent.NEW, {
        conversationId: CONV,
        message: message({ content: 'chegou agora!' }),
      }),
    );
    expect(await screen.findByText('chegou agora!')).toBeVisible();
    expect(
      screen.queryByRole('status', { name: 'Bruno Lima está digitando' }),
    ).not.toBeInTheDocument();
  });

  it('conversa de outras pessoas aparece como não encontrada', async () => {
    mockApi({
      ...loggedIn,
      [`GET /conversations/${CONV}`]: {
        status: 404,
        body: { code: 'NOT_FOUND', message: 'Conversa não encontrada' },
      },
      [`GET /conversations/${CONV}/messages`]: {
        status: 404,
        body: { code: 'NOT_FOUND', message: 'Conversa não encontrada' },
      },
    });
    renderApp(`/messages/${CONV}`);

    expect(await screen.findByText('Conversa não encontrada')).toBeVisible();
  });
});

describe('atalhos', () => {
  it('o botão de envelope no perfil abre a conversa', async () => {
    mockApi({
      ...chatApi([]),
      'GET /users/bruno': { status: 200, body: { user: otherProfile } },
      'GET /users/bruno/tweets': page([]),
      'POST /conversations': { status: 200, body: { conversation: conversation() } },
    });
    const { router } = renderApp('/bruno');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Mandar mensagem para @bruno' }),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe(`/messages/${CONV}`));
  });

  it('a bolinha de Mensagens mostra as conversas não lidas', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([]),
      'GET /conversations/unread-count': { status: 200, body: { count: 2 } },
    });
    renderApp('/home');

    const nav = within(await screen.findByRole('navigation', { name: 'Principal' }));
    expect(await nav.findByLabelText('2 conversas não lidas')).toBeVisible();
  });
});
