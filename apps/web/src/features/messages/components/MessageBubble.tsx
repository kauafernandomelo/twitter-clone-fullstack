import type { Message } from '@twitter-clone/shared';

import { RichText } from '@/features/tweets/components/RichText';
import { withTransform } from '@/lib/cloudinary';
import { cn } from '@/lib/cn';

type MessageBubbleProps = {
  message: Message;
  mine: boolean;
  /** texto embaixo do balão (hora, ou "Visto") — só na última mensagem de cada sequência */
  footer?: string;
};

export function MessageBubble({ message, mine, footer }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex flex-col px-4',
        mine ? 'items-end' : 'items-start',
        footer ? 'mb-3' : 'mb-1',
      )}
    >
      {message.image && (
        <img
          src={withTransform(message.image.url, 'c_limit,w_600,q_auto,f_auto')}
          alt="Imagem enviada"
          width={message.image.width}
          height={message.image.height}
          style={{ aspectRatio: `${message.image.width} / ${message.image.height}` }}
          className="mb-1 max-h-[320px] w-auto max-w-[75%] rounded-2xl object-cover"
        />
      )}
      {message.content && (
        <div
          className={cn(
            'max-w-[75%] rounded-3xl px-4 py-2.5 text-[15px] leading-5',
            mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-surface text-foreground',
          )}
        >
          <RichText
            text={message.content}
            className={mine ? '[&_a]:text-white [&_a]:underline' : ''}
          />
        </div>
      )}
      {footer && <span className="mt-1 text-[13px] text-muted">{footer}</span>}
    </div>
  );
}

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div
      className="mb-3 flex items-center gap-2 px-4"
      role="status"
      aria-label={`${name} está digitando`}
    >
      <div className="flex gap-1 rounded-3xl rounded-bl-md bg-surface px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-2 animate-bounce rounded-full bg-muted"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
