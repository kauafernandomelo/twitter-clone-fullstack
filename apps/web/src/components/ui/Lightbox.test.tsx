import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { authUser } from '@/test/fixtures';
import { makeTweet } from '@/test/fixtures-tweets';
import { mockApi } from '@/test/mock-api';
import { renderApp } from '@/test/render';

describe('lightbox', () => {
  it('abre a imagem em tela cheia, navega com as setas e fecha com ESC', async () => {
    const tweet = makeTweet({
      content: 'duas fotos',
      media: [
        { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', width: 800, height: 600 },
        { url: 'https://res.cloudinary.com/x/image/upload/b.jpg', width: 800, height: 600 },
      ],
    });
    mockApi({
      'GET /auth/me': { status: 200, body: { user: authUser } },
      'GET /tweets': { status: 200, body: { items: [tweet], nextCursor: null } },
    });
    const { router } = renderApp('/home');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Abrir imagem 2 de 2 do post em tela cheia' }),
    );
    const dialog = await screen.findByRole('dialog', { name: /Imagem 2 de 2 do post/ });
    expect(within(dialog).getByText('2 de 2')).toBeVisible();
    // abrir a imagem não navega para a página do post
    expect(router.state.location.pathname).toBe('/home');

    await userEvent.keyboard('{ArrowRight}');
    expect(within(dialog).getByText('1 de 2')).toBeVisible();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar imagem' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
