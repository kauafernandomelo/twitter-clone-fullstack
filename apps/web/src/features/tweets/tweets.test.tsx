import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser, ownProfile } from '@/test/fixtures';
import { authors, makeTweet } from '@/test/fixtures-tweets';
import { mockApi } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const loggedIn = { 'GET /auth/me': { status: 200, body: { user: authUser } } };
const page = (items: unknown[]) => ({ status: 200, body: { items, nextCursor: null } });

// o compositor da home (o do modal só existe quando o modal abre)
const composer = () => within(screen.getByRole('form', { name: 'Escrever post' }));
const getComposer = () => composer().getByRole('combobox', { name: 'Texto do post' });

describe('timeline da home', () => {
  it('mostra os posts com autor, tempo relativo e conteúdo', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([makeTweet({ content: 'Olá, mundo!', author: authors.bruno })]),
    });
    renderApp('/home');

    const article = await screen.findByRole('article', { name: 'Bruno Lima' });
    expect(within(article).getByText('Olá, mundo!')).toBeVisible();
    expect(within(article).getByText('@bruno')).toBeVisible();
    expect(within(article).getByText('5 min')).toBeVisible();
  });

  it('mostra estado vazio quando ninguém postou', async () => {
    mockApi({ ...loggedIn, 'GET /tweets': page([]) });
    renderApp('/home');
    expect(await screen.findByText('Ainda não há posts')).toBeVisible();
  });
});

describe('criar post', () => {
  it('publica e o post aparece no topo da timeline', async () => {
    let sent: unknown;
    mockApi({
      ...loggedIn,
      'GET /tweets': page([makeTweet({ content: 'post antigo' })]),
      'POST /tweets': (body) => {
        sent = body;
        return { status: 201, body: { tweet: makeTweet({ content: 'Meu post novo' }) } };
      },
    });
    renderApp('/home');
    await screen.findByText('post antigo');

    await userEvent.type(getComposer(), 'Meu post novo');
    await userEvent.click(composer().getByRole('button', { name: 'Postar' }));

    const articles = await screen.findAllByRole('article');
    expect(within(articles[0]!).getByText('Meu post novo')).toBeVisible();
    expect(sent).toEqual({ content: 'Meu post novo', media: [] });
    expect(getComposer()).toHaveValue('');
  });

  it('o botão Postar fica desativado vazio e acima de 280 caracteres', async () => {
    mockApi({ ...loggedIn, 'GET /tweets': page([]) });
    renderApp('/home');
    await screen.findByText('Ainda não há posts');
    const postButton = composer().getByRole('button', { name: 'Postar' });

    expect(postButton).toBeDisabled();

    await userEvent.click(getComposer());
    await userEvent.paste('a'.repeat(281));

    expect(postButton).toBeDisabled();
    expect(screen.getByText('-1')).toBeVisible();
    expect(screen.getByText('1 caracteres acima do limite')).toBeInTheDocument();
  });

  it('abre o modal de novo post pelo botão da sidebar', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([]),
      'GET /users/ana_souza': { status: 200, body: { user: ownProfile } },
    });
    renderApp('/ana_souza');

    const [sidebarButton] = await screen.findAllByRole('button', { name: 'Postar' });
    await userEvent.click(sidebarButton!);

    const dialog = within(await screen.findByRole('dialog', { name: 'Novo post' }));
    expect(dialog.getByRole('combobox', { name: 'Texto do post' })).toHaveFocus();
  });
});

describe('editar e apagar', () => {
  it('só o autor vê o menu de opções', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([
        makeTweet({ content: 'meu', author: authors.ana }),
        makeTweet({ content: 'do bruno', author: authors.bruno }),
      ]),
    });
    renderApp('/home');

    const mine = await screen.findByRole('article', { name: 'Ana Souza' });
    const theirs = screen.getByRole('article', { name: 'Bruno Lima' });
    expect(within(mine).getByRole('button', { name: 'Mais opções' })).toBeVisible();
    expect(within(theirs).queryByRole('button', { name: 'Mais opções' })).not.toBeInTheDocument();
  });

  it('edita o texto e o post passa a mostrar "Editado"', async () => {
    const tweet = makeTweet({ content: 'texto com erro' });
    mockApi({
      ...loggedIn,
      'GET /tweets': page([tweet]),
      [`PATCH /tweets/${tweet.id}`]: (body) => ({
        status: 200,
        body: {
          tweet: { ...tweet, ...(body as object), editedAt: new Date().toISOString() },
        },
      }),
    });
    renderApp('/home');

    const article = await screen.findByRole('article', { name: 'Ana Souza' });
    await userEvent.click(within(article).getByRole('button', { name: 'Mais opções' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));

    const dialog = within(await screen.findByRole('dialog', { name: 'Editar post' }));
    const textbox = dialog.getByRole('textbox', { name: 'Texto do post' });
    await userEvent.clear(textbox);
    await userEvent.type(textbox, 'texto corrigido');
    await userEvent.click(dialog.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('texto corrigido')).toBeVisible();
    expect(screen.getByText('· Editado')).toBeVisible();
    expect(screen.queryByText('texto com erro')).not.toBeInTheDocument();
  });

  it('apaga depois de confirmar', async () => {
    const tweet = makeTweet({ content: 'vou apagar' });
    mockApi({
      ...loggedIn,
      'GET /tweets': page([tweet]),
      [`DELETE /tweets/${tweet.id}`]: { status: 204 },
    });
    renderApp('/home');

    const article = await screen.findByRole('article', { name: 'Ana Souza' });
    await userEvent.click(within(article).getByRole('button', { name: 'Mais opções' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));

    const confirm = within(await screen.findByRole('alertdialog', { name: 'Apagar post?' }));
    await userEvent.click(confirm.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Ainda não há posts')).toBeVisible();
  });
});

describe('página do post', () => {
  it('mostra o post com a data completa', async () => {
    const tweet = makeTweet({
      content: 'post em destaque',
      createdAt: '2026-11-09T17:30:00.000Z',
      editedAt: '2026-11-09T17:35:00.000Z',
    });
    mockApi({ ...loggedIn, [`GET /tweets/${tweet.id}`]: { status: 200, body: { tweet } } });
    renderApp(`/ana_souza/status/${tweet.id}`);

    expect(await screen.findByText('post em destaque')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Post' })).toBeVisible();
    expect(screen.getByText(/9 de nov de 2026/)).toBeVisible();
    expect(screen.getByText('· Editado')).toBeVisible();
  });

  it('mostra "Este post não existe" para id inválido', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets/nao-existe': {
        status: 404,
        body: { code: 'NOT_FOUND', message: 'Este post não existe' },
      },
    });
    renderApp('/ana_souza/status/nao-existe');

    expect(await screen.findByText('Este post não existe')).toBeVisible();
  });

  it('clicar no card abre a página do post', async () => {
    const tweet = makeTweet({ content: 'clique em mim', author: authors.bruno });
    mockApi({
      ...loggedIn,
      'GET /tweets': page([tweet]),
      [`GET /tweets/${tweet.id}`]: { status: 200, body: { tweet } },
    });
    const { router } = renderApp('/home');

    await userEvent.click(await screen.findByText('clique em mim'));

    expect(router.state.location.pathname).toBe(`/bruno/status/${tweet.id}`);
    expect(await screen.findByRole('heading', { name: 'Post' })).toBeVisible();
  });
});

describe('perfil', () => {
  it('lista os posts da pessoa e mostra o total no cabeçalho', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/ana_souza': { status: 200, body: { user: { ...ownProfile, tweetsCount: 2 } } },
      'GET /users/ana_souza/tweets': page([
        makeTweet({ content: 'segundo' }),
        makeTweet({ content: 'primeiro' }),
      ]),
    });
    renderApp('/ana_souza');

    expect(await screen.findByText('segundo')).toBeVisible();
    expect(screen.getByText('primeiro')).toBeVisible();
    expect(screen.getByText('2 posts')).toBeVisible();
  });
});
