import { TWEET_MAX_LENGTH, type Tweet, tweetLength } from '@twitter-clone/shared';
import { type FormEvent, useState } from 'react';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormError } from '@/features/auth/components/FormError';
import { useAutosize } from '@/hooks/use-autosize';
import { ApiError } from '@/lib/api';

import { useUpdateTweet } from '../api';
import { CharCounter } from './CharCounter';
import { TweetMediaGrid } from './TweetMediaGrid';

type EditTweetModalProps = { tweet: Tweet; open: boolean; onClose: () => void };

export function EditTweetModal({ tweet, open, onClose }: EditTweetModalProps) {
  const formId = `edit-tweet-${tweet.id}`;
  const updateTweet = useUpdateTweet();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar post"
      variant="compact"
      headerAction={
        <Button
          variant="inverse"
          size="sm"
          type="submit"
          form={formId}
          loading={updateTweet.isPending}
        >
          Salvar
        </Button>
      }
    >
      <EditTweetForm formId={formId} tweet={tweet} onSaved={onClose} updateTweet={updateTweet} />
    </Modal>
  );
}

type EditTweetFormProps = {
  formId: string;
  tweet: Tweet;
  onSaved: () => void;
  updateTweet: ReturnType<typeof useUpdateTweet>;
};

function EditTweetForm({ formId, tweet, onSaved, updateTweet }: EditTweetFormProps) {
  const [text, setText] = useState(tweet.content);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useAutosize(text);
  const length = tweetLength(text);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (length > TWEET_MAX_LENGTH)
      return setError(`O post pode ter no máximo ${TWEET_MAX_LENGTH} caracteres`);
    if (!text.trim() && tweet.media.length === 0) return setError('O post não pode ficar vazio');

    try {
      await updateTweet.mutateAsync({ id: tweet.id, content: text });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar. Tente novamente.');
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex gap-3 px-4 pt-2 pb-6">
      <Avatar src={tweet.author.avatarUrl} name={tweet.author.name} />
      <div className="min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Texto do post"
          rows={1}
          className="w-full resize-none bg-transparent py-2 text-xl focus:outline-none"
        />
        <TweetMediaGrid media={tweet.media} />
        {tweet.media.length > 0 && (
          <p className="mt-2 text-[13px] text-muted">As imagens não podem ser alteradas.</p>
        )}
        <FormError message={error ?? undefined} />
        <div className="mt-3 flex justify-end border-t border-border pt-3">
          <CharCounter length={length} />
        </div>
      </div>
    </form>
  );
}
