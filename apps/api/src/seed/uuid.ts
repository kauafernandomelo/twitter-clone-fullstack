import { randomBytes } from 'node:crypto';

/**
 * UUID v7 com o horário que a gente escolher. O app ordena e pagina por id (o v7 já nasce
 * ordenado pelo tempo); como o seed cria posts "no passado", o id precisa carregar a mesma
 * data do created_at, senão um post de 3 dias atrás apareceria no topo do feed.
 * Formato (RFC 9562): 48 bits de timestamp em ms + versão 7 + variante + bits aleatórios.
 */
export function uuidv7At(date: Date) {
  const bytes = randomBytes(16);
  let ms = BigInt(date.getTime());
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number(ms & 0xffn);
    ms >>= 8n;
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
