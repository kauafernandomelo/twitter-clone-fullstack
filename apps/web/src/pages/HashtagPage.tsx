import { useParams } from 'react-router';

import { PageHeader } from '@/components/layout/PageHeader';
import { useHashtagTweets } from '@/features/search/api';
import { TweetList } from '@/features/tweets/components/TweetList';

export function HashtagPage() {
  const { tag = '' } = useParams();

  return (
    <>
      <PageHeader title={`#${tag}`} showBack />
      <TweetList
        query={useHashtagTweets(tag)}
        empty={
          <div className="px-8 py-16 text-center">
            <p className="text-[31px] leading-9 font-extrabold break-words">
              Nenhum post com #{tag}
            </p>
            <p className="mt-2 text-[15px] text-muted">
              Seja a primeira pessoa a usar essa hashtag.
            </p>
          </div>
        }
      />
    </>
  );
}
