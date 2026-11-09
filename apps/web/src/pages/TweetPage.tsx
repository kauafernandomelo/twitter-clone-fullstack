import { Link, Navigate, useNavigate, useParams } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useCurrentUser } from '@/features/auth/api';
import { useTweet } from '@/features/tweets/api';
import { EditedLabel } from '@/features/tweets/components/EditedLabel';
import { TweetActions } from '@/features/tweets/components/TweetActions';

import { TweetMediaGrid } from '@/features/tweets/components/TweetMediaGrid';
import { tweetUrl } from '@/features/tweets/utils';
import { ApiError } from '@/lib/api';
import { formatFullDate } from '@/lib/date';

export function TweetPage() {
  const { username = '', tweetId = '' } = useParams();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { data: tweet, isPending, error } = useTweet(tweetId);

  if (isPending) {
    return (
      <>
        <PageHeader title="Post" showBack />
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      </>
    );
  }

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <>
        <PageHeader title="Post" showBack />
        <div className="px-8 py-16 text-center">
          <p className="text-[31px] leading-9 font-extrabold">
            {notFound ? 'Este post não existe' : 'Algo deu errado'}
          </p>
          <p className="mt-2 text-[15px] text-muted">
            {notFound ? 'Talvez ele tenha sido apagado.' : 'Tente recarregar a página.'}
          </p>
        </div>
      </>
    );
  }

  // URL com o @ errado (ex.: link antigo depois de trocar o username) → corrige
  if (tweet.author.username !== username.toLowerCase()) {
    return <Navigate to={tweetUrl(tweet)} replace />;
  }

  const { author } = tweet;

  return (
    <>
      <PageHeader title="Post" showBack />
      <article className="border-b border-border px-4 pt-3">
        <header className="flex items-center gap-3">
          <Link to={`/${author.username}`}>
            <Avatar src={author.avatarUrl} name={author.name} />
          </Link>
          <div className="min-w-0 flex-1 text-[15px]">
            <Link to={`/${author.username}`} className="block truncate font-bold hover:underline">
              {author.name}
            </Link>
            <span className="block truncate text-muted">@{author.username}</span>
          </div>
          <TweetActions
            tweet={tweet}
            onDeleted={() => navigate(`/${currentUser.username}`, { replace: true })}
          />
        </header>

        {tweet.content && (
          <p className="mt-3 text-[17px] leading-6 break-words whitespace-pre-wrap">
            {tweet.content}
          </p>
        )}
        <TweetMediaGrid media={tweet.media} />

        <p className="my-4 flex flex-wrap gap-1 text-[15px] text-muted">
          <time dateTime={tweet.createdAt}>{formatFullDate(tweet.createdAt)}</time>
          <EditedLabel editedAt={tweet.editedAt} />
        </p>
      </article>
    </>
  );
}
