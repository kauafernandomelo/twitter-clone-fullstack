import type { UserSummary } from '@twitter-clone/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser, otherProfile, ownProfile } from '@/test/fixtures';
import { authors, makeTweet } from '@/test/fixtures-tweets';
import { mockApi } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const loggedIn = { 'GET /auth/me': { status: 200, body: { user: authUser } } };
const page = (items: unknown[]) => ({ status: 200, body: { items, nextCursor: null } });

const summary = (overrides: Partial<UserSummary>): UserSummary => ({
  id: 'user-x',
  name: 'Fulano',
  username: 'fulano',
  avatarUrl: null,
  bio: null,
  isFollowing: false,
  followsYou: false,
  ...overrides,
});

const brunoProfile = { ...otherProfile, followersCount: 10, followingCount: 3 };

describe('seguir pelo perfil', () => {
  it('mostra contadores com links e o selo "Segue você"', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/bruno': { status: 200, body: { user: { ...brunoProfile, followsYou: true } } },
      'GET /users/bruno/tweets': page([]),
    });
    renderApp('/bruno');

    const following = await screen.findByRole('link', { name: '3 Seguindo' });
    expect(following).toHaveAttribute('href', '/bruno/following');
    expect(screen.getByRole('link', { name: '10 Seguidores' })).toHaveAttribute(
      'href',
      '/bruno/followers',
    );
    expect(screen.getByText('Segue você')).toBeVisible();
  });

  it('seguir muda o botão e soma 1 nos seguidores na hora', async () => {
    let calls = 0;
    mockApi({
      ...loggedIn,
      'GET /users/bruno': { status: 200, body: { user: brunoProfile } },
      'GET /users/bruno/tweets': page([]),
      'POST /users/bruno/follow': () => {
        calls += 1;
        return { status: 204 };
      },
    });
    renderApp('/bruno');

    await userEvent.click(await screen.findByRole('button', { name: 'Seguir' }));

    expect(screen.getByRole('button', { name: 'Deixar de seguir @bruno' })).toBeVisible();
    expect(screen.getByRole('link', { name: '11 Seguidores' })).toBeVisible();
    await waitFor(() => expect(calls).toBe(1));
  });

  it('deixar de seguir faz o caminho inverso', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/bruno': { status: 200, body: { user: { ...brunoProfile, isFollowing: true } } },
      'GET /users/bruno/tweets': page([]),
      'DELETE /users/bruno/follow': { status: 204 },
    });
    renderApp('/bruno');

    await userEvent.click(await screen.findByRole('button', { name: 'Deixar de seguir @bruno' }));

    expect(screen.getByRole('button', { name: 'Seguir' })).toBeVisible();
    expect(screen.getByRole('link', { name: '9 Seguidores' })).toBeVisible();
  });

  it('desfaz a mudança se a API falhar', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/bruno': { status: 200, body: { user: brunoProfile } },
      'GET /users/bruno/tweets': page([]),
      'POST /users/bruno/follow': {
        status: 500,
        body: { code: 'INTERNAL_ERROR', message: 'erro' },
      },
    });
    renderApp('/bruno');

    await userEvent.click(await screen.findByRole('button', { name: 'Seguir' }));

    expect(await screen.findByRole('button', { name: 'Seguir' })).toBeVisible();
    expect(screen.getByRole('link', { name: '10 Seguidores' })).toBeVisible();
  });

  it('no próprio perfil não há botão de seguir', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/ana_souza': { status: 200, body: { user: ownProfile } },
      'GET /users/ana_souza/tweets': page([]),
    });
    renderApp('/ana_souza');

    expect(await screen.findByRole('button', { name: 'Editar perfil' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Seguir' })).not.toBeInTheDocument();
  });
});

describe('páginas de seguidores e seguindo', () => {
  it('lista seguidores com bio, selo e botão de seguir', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/bruno': { status: 200, body: { user: brunoProfile } },
      'GET /users/bruno/followers': page([
        summary({ id: 'c', name: 'Carla', username: 'carla', bio: 'Designer', followsYou: true }),
        summary({ id: authUser.id, name: authUser.name, username: authUser.username }),
      ]),
    });
    renderApp('/bruno/followers');

    const carla = await screen.findByRole('article', { name: 'Carla' });
    expect(within(carla).getByText('Designer')).toBeVisible();
    expect(within(carla).getByText('Segue você')).toBeVisible();
    expect(within(carla).getByRole('button', { name: 'Seguir' })).toBeVisible();

    // eu mesma apareço na lista, mas sem botão
    const me = screen.getByRole('article', { name: 'Ana Souza' });
    expect(within(me).queryByRole('button')).not.toBeInTheDocument();
  });

  it('as abas levam para "Seguindo"', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/bruno': { status: 200, body: { user: brunoProfile } },
      'GET /users/bruno/followers': page([]),
      'GET /users/bruno/following': page([
        summary({ name: 'Davi', username: 'davi', isFollowing: true }),
      ]),
    });
    const { router } = renderApp('/bruno/followers');

    expect(await screen.findByText('Ainda sem seguidores')).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Seguindo' }));

    expect(await screen.findByRole('article', { name: 'Davi' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/bruno/following');
  });
});

describe('home', () => {
  it('a aba "Seguindo" mostra o feed de quem eu sigo', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([makeTweet({ content: 'post de qualquer um', author: authors.bruno })]),
      'GET /feed/following': page([
        makeTweet({ content: 'post de quem eu sigo', author: authors.bruno }),
      ]),
    });
    renderApp('/home');

    expect(await screen.findByText('post de qualquer um')).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Seguindo' }));

    expect(await screen.findByText('post de quem eu sigo')).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Seguindo' })).toHaveAttribute('aria-selected', 'true');
  });

  it('feed "Seguindo" vazio sugere seguir pessoas', async () => {
    mockApi({ ...loggedIn, 'GET /tweets': page([]), 'GET /feed/following': page([]) });
    renderApp('/home');

    await userEvent.click(await screen.findByRole('tab', { name: 'Seguindo' }));

    expect(await screen.findByText('Seu feed está vazio')).toBeVisible();
  });
});

describe('quem seguir', () => {
  it('mostra sugestões e permite seguir direto da lista', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([]),
      'GET /suggestions': {
        status: 200,
        body: { users: [summary({ name: 'Carla', username: 'carla' })] },
      },
      'POST /users/carla/follow': { status: 204 },
    });
    renderApp('/home');

    const section = within(await screen.findByRole('region', { name: 'Quem seguir' }));
    await userEvent.click(section.getByRole('button', { name: 'Seguir' }));

    expect(section.getByRole('button', { name: 'Deixar de seguir @carla' })).toBeVisible();
  });
});
