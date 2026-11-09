import { parseTweetText } from '@twitter-clone/shared';
import { Fragment } from 'react';
import { Link } from 'react-router';

import { cn } from '@/lib/cn';

type RichTextProps = {
  text: string;
  className?: string;
  /**
   * false = só pinta de azul, sem criar links (para usar dentro de algo que já é link,
   * como o card de citação: link dentro de link é HTML inválido).
   */
  links?: boolean;
};

/** Mostra links de longe sem o protocolo e cortados, como o Twitter faz. */
function displayUrl(href: string) {
  const clean = href.replace(/^https?:\/\/(www\.)?/, '');
  return clean.length > 30 ? `${clean.slice(0, 30)}…` : clean;
}

// Texto do post com #hashtags, @menções e URLs clicáveis.
export function RichText({ text, className, links = true }: RichTextProps) {
  const linkClass = 'text-brand hover:underline';

  return (
    <p className={cn('break-words whitespace-pre-wrap', className)}>
      {parseTweetText(text).map((segment, index) => {
        if (segment.type === 'text') return <Fragment key={index}>{segment.value}</Fragment>;
        if (!links) {
          return (
            <span key={index} className="text-brand">
              {segment.type === 'url' ? displayUrl(segment.href) : segment.value}
            </span>
          );
        }

        switch (segment.type) {
          case 'hashtag':
            return (
              <Link
                key={index}
                to={`/hashtag/${encodeURIComponent(segment.tag)}`}
                className={linkClass}
              >
                {segment.value}
              </Link>
            );
          case 'mention':
            return (
              <Link key={index} to={`/${segment.username}`} className={linkClass}>
                {segment.value}
              </Link>
            );
          case 'url':
            return (
              <a
                key={index}
                href={segment.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                title={segment.href}
                className={linkClass}
              >
                {displayUrl(segment.href)}
              </a>
            );
        }
      })}
    </p>
  );
}
