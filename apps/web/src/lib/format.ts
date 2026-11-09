const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** 1234 → "1,2 mil", 0 → "" (o Twitter esconde contadores zerados nas ações) */
export function formatCount(value: number) {
  return value > 0 ? compact.format(value) : '';
}
