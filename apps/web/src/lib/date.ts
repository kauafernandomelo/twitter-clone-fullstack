import { differenceInSeconds, format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Tempo curto estilo Twitter: "agora", "45 s", "12 min", "3 h", "9 de nov", "9 de nov de 2025" */
export function formatTweetTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  const seconds = differenceInSeconds(now, date);

  if (seconds < 5) return 'agora';
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h`;

  const sameYear = date.getFullYear() === now.getFullYear();
  return format(date, sameYear ? "d 'de' MMM" : "d 'de' MMM 'de' yyyy", { locale: ptBR });
}

/** Data completa: "14:30 · 9 de nov de 2026" */
export function formatFullDate(iso: string) {
  return format(new Date(iso), "HH:mm '·' d 'de' MMM 'de' yyyy", { locale: ptBR });
}

/** Hora de uma mensagem: "14:30" hoje, "9 de nov, 14:30" em outros dias */
export function formatMessageTime(iso: string) {
  const date = new Date(iso);
  return format(date, isToday(date) ? 'HH:mm' : "d 'de' MMM, HH:mm", { locale: ptBR });
}
