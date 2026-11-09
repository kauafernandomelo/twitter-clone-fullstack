import type { UserSummary } from '@twitter-clone/shared';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser } from '@/test/fixtures';
import { authors, makeTweet } from '@/test/fixtures-tweets';
import { mockApi } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const loggedIn = { 'GET /auth/me': { status: 200, body: { user: authUser } } };
const page = (items: unknown[]) => ({ status: 200, body: { items, nextCursor: null } });

const bruno: UserSummary = {
  id: 'user-2',
  name: 'Bruno Lima',
  username: 'bruno',
  avatarUrl: null,
  bio: 'Back-end',
  isFollowing: false,
  followsYou: false,
};

describe('texto do post', () => {
  it('transforma #hashtags, @menções e URLs em links', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([
        makeTweet({ content: 'Usando #React com @bruno — veja https://react.dev/learn' }),
      ]),
    });
    renderApp('/home');

    const article = await screen.findByRole('article', { name: 'Ana Souza' });
    expect(within(article).getByRole('link', { name: '#React' })).toHaveAttribute(
      'href',
      '/hashtag/react',
    );
    expect(within(article).getByRole('link', { name: '@bruno' })).toHaveAttribute('href', '/bruno');
    const external = within(article).getByRole('link', { name: 'react.dev/learn' });
    expect(external).toHaveAttribute('href', 'https://react.dev/learn');
    expect(external).toHaveAttribute('target', '_blank');
  });
});

describe('Explorar', () => {
  it('sem busca mostra os assuntos do momento, que levam à página da hashtag', async () => {
    mockApi({
      ...loggedIn,
      'GET /trends': { status: 200, body: { trends: [{ tag: 'react', count: 3 }] } },
      'GET /hashtags/react/tweets': page([makeTweet({ content: 'Aprendendo #React' })]),
    });
    renderApp('/explore');

    const trend = await screen.findByRole('link', { name: /#react/ });
    expect(within(trend).getByText('3 posts')).toBeVisible();
    await userEvent.click(trend);

    expect(await screen.findByRole('heading', { name: '#react' })).toBeVisible();
    expect(await screen.findByText(/Aprendendo/)).toBeVisible();
  });

  it('busca posts e troca para a aba Pessoas (o filtro fica na URL)', async () => {
    mockApi({
      ...loggedIn,
      'GET /search/tweets': page([
        makeTweet({ author: authors.bruno, content: 'post sobre prisma' }),
      ]),
      'GET /search/users': { status: 200, body: { users: [bruno] } },
    });
    const { router } = renderApp('/explore?q=prisma');

    expect(await screen.findByText('post sobre prisma')).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Pessoas' }));

    expect(await screen.findByRole('article', { name: 'Bruno Lima' })).toBeVisible();
    expect(router.state.location.search).toBe('?q=prisma&f=people');
  });

  it('mostra "nenhum resultado" quando a busca não acha nada', async () => {
    mockApi({ ...loggedIn, 'GET /search/tweets': page([]) });
    renderApp('/explore?q=xyzabc');

    expect(await screen.findByText('Nenhum resultado para “xyzabc”')).toBeVisible();
  });

  it('a busca da coluna lateral leva para o Explorar', async () => {
    mockApi({ ...loggedIn, 'GET /tweets': page([]), 'GET /search/tweets': page([]) });
    const { router } = renderApp('/home');

    const [searchInput] = await screen.findAllByRole('searchbox', { name: 'Buscar' });
    await userEvent.type(searchInput!, 'typescript{Enter}');

    expect(router.state.location.pathname).toBe('/explore');
    expect(router.state.location.search).toBe('?q=typescript');
  });
});

describe('autocomplete de @menções', () => {
  const composer = () =>
    within(screen.getByRole('form', { name: 'Escrever post' })).getByRole('combobox', {
      name: 'Texto do post',
    });

  it('sugere pessoas ao digitar @ e completa com Enter', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([]),
      'GET /search/users': { status: 200, body: { users: [bruno] } },
    });
    renderApp('/home');
    await screen.findByText('Ainda não há posts');

    await userEvent.type(composer(), 'Oi @br');
    const option = await screen.findByRole('option', { name: /Bruno Lima/ });
    expect(option).toHaveAttribute('aria-selected', 'true');
    expect(composer()).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Enter}');

    expect(composer()).toHaveValue('Oi @bruno ');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('também abre quando o texto entra sem teclado (colar, teclado de celular)', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([]),
      'GET /search/users': { status: 200, body: { users: [bruno] } },
    });
    renderApp('/home');
    await screen.findByText('Ainda não há posts');

    await userEvent.click(composer());
    await userEvent.paste('Oi @br'); // paste não dispara keyup

    expect(await screen.findByRole('option', { name: /Bruno Lima/ })).toBeVisible();
  });

  it('Esc fecha as sugestões sem apagar o texto', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([]),
      'GET /search/users': { status: 200, body: { users: [bruno] } },
    });
    renderApp('/home');
    await screen.findByText('Ainda não há posts');

    await userEvent.type(composer(), '@br');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(composer()).toHaveValue('@br');
  });
});
