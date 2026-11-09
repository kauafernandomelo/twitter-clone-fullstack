import { TWEET_MAX_LENGTH } from '@twitter-clone/shared';

import { cn } from '@/lib/cn';

const SIZE = 20;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const WARNING_AT = TWEET_MAX_LENGTH - 20;

// Anel de progresso do Twitter: azul, amarelo nos últimos 20 e vermelho quando passa.
export function CharCounter({ length }: { length: number }) {
  if (length === 0) return null;

  const remaining = TWEET_MAX_LENGTH - length;
  const progress = Math.min(length / TWEET_MAX_LENGTH, 1);
  const color =
    remaining < 0 ? 'text-danger' : length >= WARNING_AT ? 'text-[#ffd400]' : 'text-brand';

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      {length >= WARNING_AT && (
        <span className={cn('text-[13px]', remaining < 0 ? 'text-danger' : 'text-muted')}>
          {remaining}
        </span>
      )}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-border"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          stroke="currentColor"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          className={cn('transition-[stroke-dashoffset]', color)}
        />
      </svg>
      <span className="sr-only">
        {remaining >= 0
          ? `${remaining} caracteres restantes`
          : `${-remaining} caracteres acima do limite`}
      </span>
    </div>
  );
}
