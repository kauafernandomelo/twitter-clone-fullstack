import { type NotificationItem, SocketEvent } from '@twitter-clone/shared';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser } from '@/test/fixtures';
import { authors, makeTweet } from '@/test/fixtures-tweets';
import { emitSocketEvent } from '@/test/fake-socket';
import { mockApi } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const loggedIn = { 'GET /auth/me': { status: 200, body: { user: authUser } } };
const page = (items: unknown[]) => ({ status: 200, body: { items, nextCursor: null } });
const unread = (count: number) => ({ status: 200, body: { count } });

const carla = { id: 'user-3', name: 'Carla', username: 'carla', avatarUrl: null };
const davi = { id: 'user-4', name: 'Davi', username: 'davi', avatarUrl: null };

const notification = (overrides: Partial<NotificationItem>): NotificationItem => ({
  id: 'n-1',
  type: 'like',
  actors: [authors.bruno],
  actorsCount: 1,
  tweet: null,
  createdAt: new Date().toISOString(),
  read: false,
  ...overrides,
});

describe('contador de não lidas', () => {
  it('aparece no sino e no título da aba', async () => {
    mockApi({ ...loggedIn, 'GET /tweets': page([]), 'GET /notifications/unread-count': unread(3) });
    renderApp('/home');

    const nav = within(await screen.findByRole('navigation', { name: 'Principal' }));
    expect(await nav.findByLabelText('3 notificações não lidas')).toBeVisible();
    await waitFor(() => expect(document.title).toBe('(3) Twitter Clone'));
  });

  it('atualiza na hora quando chega um evento em tempo real', async () => {
    let count = 0;
    mockApi({
      ...loggedIn,
      'GET /tweets': page([]),
      'GET /notifications/unread-count': () => unread(count),
    });
    renderApp('/home');
    await screen.findByText('Ainda não há posts');
    expect(screen.queryByLabelText(/notificações não lidas/)).not.toBeInTheDocument();

    count = 2;
    act(() => emitSocketEvent(SocketEvent.NOTIFICATION));

    const nav = within(screen.getByRole('navigation', { name: 'Principal' }));
    expect(await nav.findByLabelText('2 notificações não lidas')).toBeVisible();
  });
});

describe('página de notificações', () => {
  it('mostra curtidas e follows agrupados, e respostas como post', async () => {
    const myTweet = makeTweet({ content: 'meu post popular' });
    mockApi({
      ...loggedIn,
      'GET /notifications/unread-count': unread(3),
      'POST /notifications/read': { status: 204 },
      'GET /notifications': page([
        notification({
          id: 'like:1',
          type: 'like',
          actors: [authors.bruno, carla, davi],
          actorsCount: 3,
          tweet: myTweet,
        }),
        notification({
          id: 'follow:1',
          type: 'follow',
          actors: [authors.bruno, carla],
          actorsCount: 2,
        }),
        notification({
          id: 'single:1',
          type: 'reply',
          tweet: makeTweet({ author: authors.bruno, content: 'respondi seu post' }),
        }),
      ]),
    });
    renderApp('/notifications');

    const likes = await screen.findByRole('article', {
      name: 'Bruno Lima e mais 2 pessoas curtiram seu post',
    });
    expect(within(likes).getByText('meu post popular')).toBeVisible();
    expect(screen.getByRole('article', { name: 'Bruno Lima e Carla seguiram você' })).toBeVisible();
    expect(screen.getByText('respondi seu post')).toBeVisible();
  });

  it('abrir a página marca tudo como lido e zera o contador', async () => {
    let marked = false;
    mockApi({
      ...loggedIn,
      'GET /notifications/unread-count': () => unread(marked ? 0 : 1),
      'GET /notifications': page([notification({ type: 'follow' })]),
      'POST /notifications/read': () => {
        marked = true;
        return { status: 204 };
      },
    });
    renderApp('/notifications');

    await screen.findByRole('article', { name: 'Bruno Lima seguiu você' });
    await waitFor(() => expect(marked).toBe(true));
    const nav = within(screen.getByRole('navigation', { name: 'Principal' }));
    await waitFor(() =>
      expect(nav.queryByLabelText(/notificações não lidas/)).not.toBeInTheDocument(),
    );
  });

  it('a aba Menções pede só respostas, citações e menções', async () => {
    const fetchMock = mockApi({
      ...loggedIn,
      'GET /notifications/unread-count': unread(0),
      'POST /notifications/read': { status: 204 },
      'GET /notifications': page([]),
    });
    renderApp('/notifications');

    await userEvent.click(await screen.findByRole('tab', { name: 'Menções' }));

    expect(await screen.findByText('Nenhuma menção ainda')).toBeVisible();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('filter=mentions'))).toBe(
      true,
    );
  });
});
