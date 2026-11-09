import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser, otherProfile, ownProfile } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { renderApp } from '@/test/render';

const loggedIn = { 'GET /auth/me': { status: 200, body: { user: authUser } } };

describe('layout', () => {
  it('mostra a navegação principal com o link do próprio perfil', async () => {
    mockApi(loggedIn);
    renderApp('/home');

    const nav = within(await screen.findByRole('navigation', { name: 'Principal' }));
    expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/home');
    expect(nav.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/ana_souza');
  });

  it('itens de fases futuras abrem a página "Em breve"', async () => {
    mockApi(loggedIn);
    renderApp('/home');

    const nav = within(await screen.findByRole('navigation', { name: 'Principal' }));
    await userEvent.click(nav.getByRole('link', { name: 'Notificações' }));

    expect(await screen.findByRole('heading', { name: 'Notificações' })).toBeVisible();
    expect(screen.getByText('Em breve')).toBeVisible();
  });
});

describe('página de perfil', () => {
  it('mostra os dados do próprio perfil com o botão de editar', async () => {
    mockApi({ ...loggedIn, 'GET /users/ana_souza': { status: 200, body: { user: ownProfile } } });
    renderApp('/ana_souza');

    expect(await screen.findByRole('heading', { name: 'Ana Souza', level: 2 })).toBeVisible();
    expect(screen.getByText('Dev em formação')).toBeVisible();
    expect(screen.getByText('São Paulo')).toBeVisible();
    expect(screen.getByRole('link', { name: 'ana.dev' })).toHaveAttribute(
      'href',
      'https://ana.dev',
    );
    expect(screen.getByText('Entrou em novembro de 2026')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeVisible();
  });

  it('no perfil de outra pessoa mostra "Seguir" em vez de editar', async () => {
    mockApi({ ...loggedIn, 'GET /users/bruno': { status: 200, body: { user: otherProfile } } });
    renderApp('/bruno');

    expect(await screen.findByRole('heading', { name: 'Bruno Lima', level: 2 })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Seguir' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Editar perfil' })).not.toBeInTheDocument();
  });

  it('mostra "Esta conta não existe" para username inexistente', async () => {
    mockApi({
      ...loggedIn,
      'GET /users/fantasma': {
        status: 404,
        body: { code: 'NOT_FOUND', message: 'Esta conta não existe' },
      },
    });
    renderApp('/fantasma');

    expect(await screen.findByText('Esta conta não existe')).toBeVisible();
  });
});

describe('editar perfil', () => {
  it('salva as alterações e atualiza a página', async () => {
    let sentBody: Record<string, unknown> | undefined;
    mockApi({
      ...loggedIn,
      'GET /users/ana_souza': { status: 200, body: { user: ownProfile } },
      'PATCH /users/me': (body) => {
        sentBody = body as Record<string, unknown>;
        return { status: 200, body: { user: { ...ownProfile, ...sentBody } } };
      },
    });
    renderApp('/ana_souza');

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Editar perfil' }));

    const bio = dialog.getByLabelText('Bio');
    await userEvent.clear(bio);
    await userEvent.type(bio, 'Construindo um clone do Twitter');
    await userEvent.clear(dialog.getByLabelText('Site'));
    await userEvent.click(dialog.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Construindo um clone do Twitter')).toBeVisible();
    expect(sentBody).toMatchObject({ bio: 'Construindo um clone do Twitter', website: null });
    // sem imagem nova, não manda avatar/banner
    expect(sentBody).not.toHaveProperty('avatarUrl');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('valida os campos antes de enviar', async () => {
    const fetchMock = mockApi({
      ...loggedIn,
      'GET /users/ana_souza': { status: 200, body: { user: ownProfile } },
    });
    renderApp('/ana_souza');

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Editar perfil' }));
    await userEvent.clear(dialog.getByLabelText('Nome'));
    await userEvent.click(dialog.getByRole('button', { name: 'Salvar' }));

    expect(await dialog.findByText('Informe seu nome')).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.anything(),
    );
  });

  it('recusa arquivo que não é imagem', async () => {
    mockApi({ ...loggedIn, 'GET /users/ana_souza': { status: 200, body: { user: ownProfile } } });
    renderApp('/ana_souza');

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Editar perfil' }));
    const input = dialog.getAllByLabelText('Alterar avatar').find((el) => el.tagName === 'INPUT')!;
    await userEvent.upload(input, new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }), {
      applyAccept: false,
    });

    expect(await dialog.findByRole('alert')).toHaveTextContent('Use uma imagem JPG, PNG ou WebP.');
  });
});
