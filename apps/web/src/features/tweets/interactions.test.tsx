import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser, otherProfile, ownProfile } from '@/test/fixtures';
import { authors, makeTweet } from '@/test/fixtures-tweets';
import { mockApi } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const loggedIn = { 'GET /auth/me': { status: 200, body: { user: authUser } } };
const page = (items: unknown[]) => ({ status: 200, body: { items, nextCursor: null } });

describe('curtir', () => {
  it('curte na hora e manda para a API', async () => {
    const tweet = makeTweet({ author: authors.bruno, content: 'curta isso' });
    let calls = 0;
    mockApi({
      ...loggedIn,
      'GET /tweets': page([tweet]),
      [`POST /tweets/${tweet.id}/like`]: () => {
        calls += 1;
        return { status: 204 };
      },
    });
    renderApp('/home');

    await userEvent.click(await screen.findByRole('button', { name: 'Curtir (0)' }));

    const unlike = screen.getByRole('button', { name: 'Descurtir (1)' });
    expect(unlike).toHaveAttribute('aria-pressed', 'true');
    expect(within(unlike).getByText('1')).toBeVisible();
    await waitFor(() => expect(calls).toBe(1));
  });

  it('desfaz se a API falhar', async () => {
    const tweet = makeTweet({ author: authors.bruno });
    mockApi({
      ...loggedIn,
      'GET /tweets': page([tweet]),
      [`POST /tweets/${tweet.id}/like`]: {
        status: 500,
        body: { code: 'INTERNAL_ERROR', message: 'x' },
      },
    });
    renderApp('/home');

    await userEvent.click(await screen.findByRole('button', { name: 'Curtir (0)' }));

    expect(await screen.findByRole('button', { name: 'Curtir (0)' })).toBeVisible();
  });
});

describe('repostar', () => {
  it('mostra "Fulano repostou" nas entradas de repost', async () => {
    const original = makeTweet({ author: authors.ana, content: 'post original' });
    mockApi({
      ...loggedIn,
      'GET /tweets': page([{ ...original, entryId: 'repost-1', repostedBy: authors.bruno }]),
    });
    renderApp('/home');

    expect(await screen.findByText('Bruno Lima repostou')).toBeVisible();
    expect(screen.getByText('post original')).toBeVisible();
  });

  it('repostar pelo menu marca o botão como repostado', async () => {
    const tweet = makeTweet({ author: authors.bruno });
    let called = false;
    // "servidor" fake: depois do repost, a timeline volta com o estado atualizado
    mockApi({
      ...loggedIn,
      'GET /tweets': () =>
        page([
          called
            ? {
                ...tweet,
                stats: { ...tweet.stats, retweets: 1 },
                viewer: { ...tweet.viewer, retweeted: true },
              }
            : tweet,
        ]),
      [`POST /tweets/${tweet.id}/retweet`]: () => {
        called = true;
        return { status: 204 };
      },
    });
    renderApp('/home');

    await userEvent.click(await screen.findByRole('button', { name: 'Repostar (0)' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Repostar' }));

    expect(await screen.findByRole('button', { name: 'Desfazer repost' })).toBeVisible();
    await waitFor(() => expect(called).toBe(true));
  });
});

describe('responder', () => {
  it('abre o modal com o post original e publica a resposta', async () => {
    const tweet = makeTweet({ author: authors.bruno, content: 'qual sua linguagem favorita?' });
    let sent: Record<string, unknown> | undefined;
    mockApi({
      ...loggedIn,
      'GET /tweets': page([tweet]),
      'POST /tweets': (body) => {
        sent = body as Record<string, unknown>;
        return {
          status: 201,
          body: {
            tweet: makeTweet({
              content: 'TypeScript!',
              isReply: true,
              replyTo: { id: tweet.id, author: { username: 'bruno' } },
            }),
          },
        };
      },
    });
    renderApp('/home');

    await userEvent.click(await screen.findByRole('button', { name: 'Responder (0)' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Responder' }));
    expect(dialog.getByText('qual sua linguagem favorita?')).toBeVisible();

    await userEvent.type(dialog.getByPlaceholderText('Poste sua resposta'), 'TypeScript!');
    await userEvent.click(dialog.getByRole('button', { name: 'Responder' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sent).toMatchObject({ content: 'TypeScript!', replyToId: tweet.id });
    // a contagem de respostas do post original sobe na hora
    expect(screen.getByRole('button', { name: 'Responder (1)' })).toBeVisible();
  });
});

describe('citar', () => {
  it('cita pelo menu de repost, com o post original embutido', async () => {
    const tweet = makeTweet({ author: authors.bruno, content: 'post para citar' });
    let sent: Record<string, unknown> | undefined;
    mockApi({
      ...loggedIn,
      'GET /tweets': page([tweet]),
      'POST /tweets': (body) => {
        sent = body as Record<string, unknown>;
        return {
          status: 201,
          body: { tweet: makeTweet({ content: 'concordo', isQuote: true, quote: tweet }) },
        };
      },
    });
    renderApp('/home');

    await userEvent.click(await screen.findByRole('button', { name: 'Repostar (0)' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Citar' }));

    const dialog = within(await screen.findByRole('dialog', { name: 'Citar post' }));
    expect(dialog.getByRole('link', { name: 'Post citado de Bruno Lima' })).toBeVisible();
    await userEvent.type(dialog.getByPlaceholderText('Adicione um comentário'), 'concordo');
    await userEvent.click(dialog.getByRole('button', { name: 'Postar' }));

    await waitFor(() => expect(sent).toMatchObject({ content: 'concordo', quoteOfId: tweet.id }));
  });

  it('avisa quando o post citado foi apagado', async () => {
    mockApi({
      ...loggedIn,
      'GET /tweets': page([makeTweet({ content: 'citei algo', isQuote: true, quote: null })]),
    });
    renderApp('/home');

    expect(await screen.findByText('Este post não está disponível.')).toBeVisible();
  });
});

describe('página do post', () => {
  it('mostra a conversa acima, as estatísticas e as respostas', async () => {
    const root = makeTweet({ author: authors.bruno, content: 'post raiz' });
    const main = makeTweet({
      content: 'resposta da ana',
      isReply: true,
      replyTo: { id: root.id, author: { username: 'bruno' } },
      stats: { replies: 1, retweets: 0, quotes: 0, likes: 2 },
    });
    const reply = makeTweet({ author: authors.bruno, content: 'tréplica' });
    mockApi({
      ...loggedIn,
      [`GET /tweets/${main.id}`]: { status: 200, body: { tweet: main } },
      [`GET /tweets/${main.id}/thread`]: { status: 200, body: { ancestors: [root] } },
      [`GET /tweets/${main.id}/replies`]: page([reply]),
    });
    renderApp(`/ana_souza/status/${main.id}`);

    expect(await screen.findByText('post raiz')).toBeVisible();
    expect(screen.getByText('resposta da ana')).toBeVisible();
    expect(await screen.findByText('tréplica')).toBeVisible();
    expect(screen.getByText('Curtidas')).toBeVisible();
    expect(screen.getByRole('form', { name: 'Escrever resposta' })).toBeVisible();
  });
});

describe('itens salvos', () => {
  it('lista os salvos e remover tira o post da página na hora', async () => {
    const tweet = makeTweet({
      author: authors.bruno,
      content: 'post salvo',
      viewer: { liked: false, retweeted: false, bookmarked: true },
    });
    mockApi({
      ...loggedIn,
      'GET /bookmarks': page([tweet]),
      [`DELETE /tweets/${tweet.id}/bookmark`]: { status: 204 },
    });
    renderApp('/bookmarks');

    expect(await screen.findByText('post salvo')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Remover dos itens salvos' }));

    expect(await screen.findByText('Salve posts para ver depois')).toBeVisible();
    expect(screen.queryByText('post salvo')).not.toBeInTheDocument();
  });
});

describe('abas do perfil', () => {
  it('a aba Curtidas só aparece no próprio perfil', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/ana_souza': { status: 200, body: { user: ownProfile } },
      'GET /users/ana_souza/tweets': page([]),
      'GET /users/ana_souza/likes': page([
        makeTweet({ author: authors.bruno, content: 'curti esse' }),
      ]),
      'GET /users/bruno': { status: 200, body: { user: otherProfile } },
      'GET /users/bruno/tweets': page([]),
    });
    const { router } = renderApp('/ana_souza');

    await userEvent.click(await screen.findByRole('tab', { name: 'Curtidas' }));
    expect(await screen.findByText('curti esse')).toBeVisible();

    await router.navigate('/bruno');
    await screen.findByRole('heading', { name: 'Bruno Lima', level: 2 });
    expect(screen.getByRole('tab', { name: 'Respostas' })).toBeVisible();
    expect(screen.queryByRole('tab', { name: 'Curtidas' })).not.toBeInTheDocument();
  });
});
