import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Tempo real: troca o Socket.IO por um emissor falso controlado pelos testes
vi.mock('@/lib/socket', () => import('./fake-socket'));

// jsdom não implementa showModal/close do <dialog>
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

// jsdom não tem IntersectionObserver (usado no scroll infinito). Nos testes ele nunca dispara.
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // atribuição direta (e não vi.stubGlobal): o unstubAllGlobals do afterEach não pode removê-lo
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
