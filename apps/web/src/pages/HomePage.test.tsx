import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra API online quando o health check responde', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ status: 'ok', uptime: 1, timestamp: '' }), { status: 200 }),
        ),
    );

    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Acontecendo agora' })).toBeInTheDocument();
    expect(await screen.findByText('online')).toBeInTheDocument();
  });

  it('mostra API offline quando a requisição falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    renderWithProviders(<HomePage />);

    expect(await screen.findByText('offline')).toBeInTheDocument();
  });
});
