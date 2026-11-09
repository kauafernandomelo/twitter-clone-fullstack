import { Link, Navigate, useNavigate, useParams } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { InfiniteList } from '@/components/InfiniteList';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useCurrentUser } from '@/features/auth/api';
import { useReplies, useThread, useTweet } from '@/features/tweets/api';
import { EditedLabel } from '@/features/tweets/components/EditedLabel';
import { QuotedTweetCard } from '@/features/tweets/components/QuotedTweetCard';
import { ReplyingTo } from '@/features/tweets/components/ReplyingTo';
import { TweetActionBar } from '@/features/tweets/components/TweetActionBar';
import { TweetCard } from '@/features/tweets/components/TweetCard';
import { TweetComposer } from '@/features/tweets/components/TweetComposer';
import { TweetMediaGrid } from '@/features/tweets/components/TweetMediaGrid';
import { TweetMenu } from '@/features/tweets/components/TweetMenu';
import { tweetUrl } from '@/features/tweets/utils';
import { ApiError } from '@/lib/api';
import { formatFullDate } from '@/lib/date';

function Stat({ value, label }: { value: number; label: [string, string] }) {
  if (value === 0) return null;
  return (
    <span>
      <span className="font-bold text-foreground">{value}</span> {value === 1 ? label[0] : label[1]}
    </span>
  );
}

export function TweetPage() {
  const { username = '', tweetId = '' } = useParams();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { data: tweet, isPending, error } = useTweet(tweetId);
  const thread = useThread(tweetId, Boolean(tweet?.replyTo));
  const replies = useReplies(tweetId);

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

  const { author, stats } = tweet;
  const ancestors = thread.data ?? [];

  return (
    <>
      <PageHeader title="Post" showBack />

      {/* conversa acima: do primeiro post até o pai direto, ligados por uma linha */}
      {ancestors.map((ancestor, index) => (
        <TweetCard key={ancestor.id} tweet={ancestor} threadLine hideReplyingTo={index > 0} />
      ))}
      {thread.isPending && tweet.replyTo && (
        <div className="flex justify-center p-4">
          <Spinner />
        </div>
      )}

      <article aria-label={`Post de ${author.name}`} className="border-b border-border px-4 pt-3">
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
          <TweetMenu
            tweet={tweet}
            onDeleted={() => navigate(`/${currentUser.username}`, { replace: true })}
          />
        </header>

        {ancestors.length === 0 && (
          <div className="mt-2">
            <ReplyingTo tweet={tweet} />
          </div>
        )}
        {tweet.content && (
          <p className="mt-3 text-[17px] leading-6 break-words whitespace-pre-wrap">
            {tweet.content}
          </p>
        )}
        <TweetMediaGrid media={tweet.media} />
        {tweet.isQuote && <QuotedTweetCard quote={tweet.quote} />}

        <p className="my-4 flex flex-wrap gap-1 text-[15px] text-muted">
          <time dateTime={tweet.createdAt}>{formatFullDate(tweet.createdAt)}</time>
          <EditedLabel editedAt={tweet.editedAt} />
        </p>

        {stats.retweets + stats.quotes + stats.likes > 0 && (
          <p className="flex gap-5 border-t border-border py-3 text-[15px] text-muted">
            <Stat value={stats.retweets} label={['Repost', 'Reposts']} />
            <Stat value={stats.quotes} label={['Citação', 'Citações']} />
            <Stat value={stats.likes} label={['Curtida', 'Curtidas']} />
          </p>
        )}

        <div className="border-t border-border py-1">
          <TweetActionBar tweet={tweet} className="mx-auto max-w-none justify-around" />
        </div>
      </article>

      <TweetComposer replyTo={tweet} className="border-b border-border" />

      <InfiniteList
        query={replies}
        getKey={(reply) => reply.entryId}
        renderItem={(reply) => <TweetCard tweet={reply} hideReplyingTo />}
        empty={null}
        errorMessage="Não foi possível carregar as respostas."
      />
    </>
  );
}
