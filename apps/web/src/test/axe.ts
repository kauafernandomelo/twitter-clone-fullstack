import axe from 'axe-core';

/**
 * Roda o axe-core (o motor de acessibilidade usado pelo Lighthouse e pelo DevTools)
 * na página renderizada e devolve as violações num formato legível.
 * Regras que dependem de layout/cores reais ficam de fora: o jsdom não calcula CSS.
 */
export async function findA11yViolations(container: Element = document.body) {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      // as páginas aparecem dentro do layout de teste, sem <title>/<html lang> do index.html
      'document-title': { enabled: false },
      'html-has-lang': { enabled: false },
      region: { enabled: false },
    },
  });
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n  ${violation.nodes.map((node) => node.target.join(' ')).join('\n  ')}`,
  );
}
