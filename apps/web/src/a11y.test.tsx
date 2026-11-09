import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser, ownProfile } from '@/test/fixtures';
import { authors, makeTweet } from '@/test/fixtures-tweets';
import { findA11yViolations } from '@/test/axe';
import { invalidRefresh, mockApi, unauthenticated } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const loggedIn = { 'GET /auth/me': { status: 200, body: { user: authUser } } };
const page = (items: unknown[]) => ({ status: 200, body: { items, nextCursor: null } });

const tweets = [
  makeTweet({ content: 'Post com #hashtag e @bruno', author: authors.bruno }),
  makeTweet({
    content: 'Post com imagens',
    media: [
      { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', width: 800, height: 600 },
      { url: 'https://res.cloudinary.com/x/image/upload/b.jpg', width: 800, height: 600 },
    ],
  }),
];

// Acessibilidade verificada automaticamente nas telas principais (axe-core).
describe('acessibilidade (axe)', () => {
  it('landing com o modal de login', async () => {
    mockApi({ 'GET /auth/me': unauthenticated, 'POST /auth/refresh': invalidRefresh });
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entre na sua conta' });

    expect(await findA11yViolations()).toEqual([]);
  });

  it('home com timeline', async () => {
    mockApi({ ...loggedIn, 'GET /tweets': page(tweets) });
    renderApp('/home');
    await screen.findByText('Post com imagens');

    expect(await findA11yViolations()).toEqual([]);
  });

  it('perfil', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/ana_souza': { status: 200, body: { user: ownProfile } },
      'GET /users/ana_souza/tweets': page(tweets),
    });
    renderApp('/ana_souza');
    await screen.findByText('Post com imagens');

    expect(await findA11yViolations()).toEqual([]);
  });

  it('página do post', async () => {
    const tweet = tweets[0]!;
    mockApi({
      ...loggedIn,
      [`GET /tweets/${tweet.id}`]: { status: 200, body: { tweet } },
      [`GET /tweets/${tweet.id}/replies`]: page([]),
    });
    renderApp(`/bruno/status/${tweet.id}`);
    await screen.findByRole('heading', { name: 'Post' });

    expect(await findA11yViolations()).toEqual([]);
  });

  it('lightbox aberto', async () => {
    mockApi({ ...loggedIn, 'GET /tweets': page(tweets) });
    renderApp('/home');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Abrir imagem 1 de 2 do post em tela cheia' }),
    );
    await screen.findByRole('dialog', { name: /Imagem 1 de 2 do post/ });

    expect(await findA11yViolations()).toEqual([]);
  });

  it('notificações', async () => {
    mockApi({
      ...loggedIn,
      'GET /notifications/unread-count': { status: 200, body: { count: 1 } },
      'POST /notifications/read': { status: 204 },
      'GET /notifications': page([
        {
          id: 'follow:1',
          type: 'follow',
          actors: [authors.bruno],
          actorsCount: 1,
          tweet: null,
          createdAt: new Date().toISOString(),
          read: false,
        },
      ]),
    });
    renderApp('/notifications');
    await screen.findByRole('article', { name: 'Bruno Lima seguiu você' });

    expect(await findA11yViolations()).toEqual([]);
  });

  it('chat', async () => {
    const id = '0196f0e5-0000-7000-8000-00000000c0de';
    mockApi({
      ...loggedIn,
      [`GET /conversations/${id}`]: {
        status: 200,
        body: {
          conversation: {
            id,
            other: authors.bruno,
            lastMessage: null,
            unreadCount: 0,
            otherLastReadAt: null,
            lastMessageAt: new Date().toISOString(),
          },
        },
      },
      [`GET /conversations/${id}/messages`]: page([
        {
          id: '0196f0e5-0000-7000-8000-000000000a01',
          conversationId: id,
          senderId: authors.bruno.id,
          content: 'oi!',
          image: null,
          createdAt: new Date().toISOString(),
        },
      ]),
      [`POST /conversations/${id}/read`]: { status: 204 },
    });
    renderApp(`/messages/${id}`);
    await screen.findByText('oi!');

    expect(await findA11yViolations()).toEqual([]);
  });
});
