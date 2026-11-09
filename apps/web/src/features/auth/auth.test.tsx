import type { AuthUser } from '@twitter-clone/shared';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { invalidRefresh, mockApi, unauthenticated } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const user: AuthUser = {
  id: '1',
  name: 'Ana Souza',
  username: 'ana_souza',
  email: 'ana@example.com',
  createdAt: '2026-11-09T00:00:00.000Z',
};

// O conteúdo atrás do modal fica inerte no navegador; nos testes buscamos dentro do dialog.
async function findDialog() {
  return within(await screen.findByRole('dialog'));
}

const loggedOut = {
  'GET /auth/me': unauthenticated,
  'POST /auth/refresh': invalidRefresh,
};

describe('rotas protegidas', () => {
  it('visitante em /home é mandado para o login', async () => {
    mockApi(loggedOut);
    const { router } = renderApp('/home');

    expect(await screen.findByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('usuário logado na landing vai direto para /home', async () => {
    mockApi({ 'GET /auth/me': { status: 200, body: { user } } });
    const { router } = renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Olá, Ana Souza!' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/home');
  });

  it('renova a sessão sozinho quando o access token expirou', async () => {
    let refreshed = false;
    mockApi({
      'GET /auth/me': () => (refreshed ? { status: 200, body: { user } } : unauthenticated),
      'POST /auth/refresh': () => {
        refreshed = true;
        return { status: 204 };
      },
    });
    renderApp('/home');

    expect(await screen.findByRole('heading', { name: 'Olá, Ana Souza!' })).toBeVisible();
  });
});

describe('login', () => {
  it('mostra erros de validação sem chamar a API', async () => {
    const fetchMock = mockApi(loggedOut);
    renderApp('/login');
    const dialog = await findDialog();

    await userEvent.click(dialog.getByRole('button', { name: 'Entrar' }));

    expect(await dialog.findByText('Informe seu email ou nome de usuário')).toBeVisible();
    expect(dialog.getByText('Informe sua senha')).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.anything(),
    );
  });

  it('entra com sucesso e vai para /home', async () => {
    let sentBody: unknown;
    mockApi({
      ...loggedOut,
      'POST /auth/login': (body) => {
        sentBody = body;
        return { status: 200, body: { user } };
      },
    });
    const { router } = renderApp('/login');

    const dialog = await findDialog();

    await userEvent.type(dialog.getByLabelText('Email ou nome de usuário'), '@Ana_Souza');
    await userEvent.type(dialog.getByLabelText('Senha'), 'senha-forte-123');
    await userEvent.click(dialog.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Olá, Ana Souza!' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/home');
    expect(sentBody).toEqual({ identifier: 'ana_souza', password: 'senha-forte-123' });
  });

  it('mostra a mensagem da API quando a senha está errada', async () => {
    mockApi({
      ...loggedOut,
      'POST /auth/login': {
        status: 401,
        body: { code: 'INVALID_CREDENTIALS', message: 'Usuário ou senha incorretos' },
      },
    });
    renderApp('/login');

    const dialog = await findDialog();

    await userEvent.type(dialog.getByLabelText('Email ou nome de usuário'), 'ana');
    await userEvent.type(dialog.getByLabelText('Senha'), 'errada');
    await userEvent.click(dialog.getByRole('button', { name: 'Entrar' }));

    expect(await dialog.findByRole('alert')).toHaveTextContent('Usuário ou senha incorretos');
  });
});

describe('cadastro', () => {
  async function fillSignup() {
    const dialog = await findDialog();
    await userEvent.type(dialog.getByLabelText('Nome'), 'Ana Souza');
    await userEvent.type(dialog.getByLabelText('Nome de usuário'), 'ana_souza');
    await userEvent.type(dialog.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(dialog.getByLabelText('Senha'), 'senha-forte-123');
    await userEvent.click(dialog.getByRole('button', { name: 'Criar conta' }));
  }

  it('cria a conta e entra direto', async () => {
    mockApi({ ...loggedOut, 'POST /auth/register': { status: 201, body: { user } } });
    renderApp('/signup');

    await fillSignup();

    expect(await screen.findByRole('heading', { name: 'Olá, Ana Souza!' })).toBeVisible();
  });

  it('mostra o erro no campo certo quando o username já existe', async () => {
    mockApi({
      ...loggedOut,
      'POST /auth/register': {
        status: 409,
        body: {
          code: 'CONFLICT',
          message: 'Email ou nome de usuário já cadastrado',
          details: { username: ['Este nome de usuário já está em uso'] },
        },
      },
    });
    renderApp('/signup');

    await fillSignup();

    expect(await screen.findByText('Este nome de usuário já está em uso')).toBeVisible();
    expect(screen.getByLabelText('Nome de usuário')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('logout', () => {
  it('sai e volta para a landing', async () => {
    let loggedIn = true;
    mockApi({
      'GET /auth/me': () => (loggedIn ? { status: 200, body: { user } } : unauthenticated),
      'POST /auth/refresh': invalidRefresh,
      'POST /auth/logout': () => {
        loggedIn = false;
        return { status: 204 };
      },
    });
    const { router } = renderApp('/home');

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Acontecendo agora' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/');
  });
});
