import type { Tweet } from '@twitter-clone/shared';
import { Link } from 'react-router';

/** "Respondendo a @fulano" (ou aviso se o post respondido foi apagado) */
export function ReplyingTo({ tweet }: { tweet: Pick<Tweet, 'isReply' | 'replyTo'> }) {
  if (!tweet.isReply) return null;
  if (!tweet.replyTo) {
    return (
      <p className="text-[15px] text-muted">Respondendo a um post que não está mais disponível</p>
    );
  }
  const { username } = tweet.replyTo.author;
  return (
    <p className="text-[15px] text-muted">
      Respondendo a{' '}
      <Link to={`/${username}`} className="text-brand hover:underline">
        @{username}
      </Link>
    </p>
  );
}
