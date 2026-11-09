/**
 * Parser do texto de um post: acha #hashtags, @menções e links.
 * Usado na API (para salvar hashtags/menções) e no front (para renderizar os links),
 * então as duas pontas concordam exatamente sobre o que é uma hashtag.
 */

export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'hashtag'; value: string; tag: string }
  | { type: 'mention'; value: string; username: string }
  | { type: 'url'; value: string; href: string };

// Hashtag: # + letras/números/_ (com acentos), precisa ter ao menos uma letra (#123 não vale).
// O caractere antes não pode ser letra/número (evita "email#tag" e "a#b").
const HASHTAG = /(?<![\p{L}\p{N}_&])#([\p{L}\p{N}_]*\p{L}[\p{L}\p{N}_]*)/gu;
// Menção: @ + username válido (mesma regra do cadastro). Não pega e-mails (fulano@gmail.com).
const MENTION = /(?<![\p{L}\p{N}_@])@([a-zA-Z0-9_]{1,15})(?![a-zA-Z0-9_])/gu;
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]'"]/g;

const MAX_HASHTAG_LENGTH = 100;

type Match = { start: number; end: number; segment: TextSegment };

function collect(text: string): Match[] {
  const matches: Match[] = [];

  for (const m of text.matchAll(URL_PATTERN)) {
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      segment: { type: 'url', value: m[0], href: m[0] },
    });
  }
  for (const m of text.matchAll(HASHTAG)) {
    const tag = m[1]!;
    if (tag.length > MAX_HASHTAG_LENGTH) continue;
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      segment: { type: 'hashtag', value: m[0], tag: tag.toLowerCase() },
    });
  }
  for (const m of text.matchAll(MENTION)) {
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      segment: { type: 'mention', value: m[0], username: m[1]!.toLowerCase() },
    });
  }

  // em caso de sobreposição (ex.: "#tag" dentro de uma URL), vale o que começa antes
  matches.sort((a, b) => a.start - b.start);
  const result: Match[] = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      result.push(match);
      lastEnd = match.end;
    }
  }
  return result;
}

/** Quebra o texto em pedaços (texto puro, hashtag, menção, link) na ordem em que aparecem. */
export function parseTweetText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const { start, end, segment } of collect(text)) {
    if (start > cursor) segments.push({ type: 'text', value: text.slice(cursor, start) });
    segments.push(segment);
    cursor = end;
  }
  if (cursor < text.length) segments.push({ type: 'text', value: text.slice(cursor) });
  return segments;
}

/** Hashtags únicas do texto, em minúsculas e sem o # */
export function extractHashtags(text: string) {
  return [
    ...new Set(
      collect(text).flatMap(({ segment }) => (segment.type === 'hashtag' ? [segment.tag] : [])),
    ),
  ];
}

/** Usernames mencionados (únicos, minúsculas, sem o @) */
export function extractMentions(text: string) {
  return [
    ...new Set(
      collect(text).flatMap(({ segment }) =>
        segment.type === 'mention' ? [segment.username] : [],
      ),
    ),
  ];
}
