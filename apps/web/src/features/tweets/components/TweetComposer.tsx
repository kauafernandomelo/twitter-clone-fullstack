import { type Tweet, TWEET_MAX_LENGTH, TWEET_MAX_MEDIA, tweetLength } from '@twitter-clone/shared';
import { Image as ImageIcon, X } from 'lucide-react';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/features/auth/api';
import { FormError } from '@/features/auth/components/FormError';
import { uploadImage } from '@/features/users/api';
import { useAutosize } from '@/hooks/use-autosize';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { validateImageFile } from '@/lib/images';

import { useCreateTweet } from '../api';
import { CharCounter } from './CharCounter';
import { QuotedTweetCard } from './QuotedTweetCard';

type Attachment = { id: string; file: File; previewUrl: string };

type TweetComposerProps = {
  onPosted?: () => void;
  autoFocus?: boolean;
  className?: string;
  /** compondo uma resposta a este post */
  replyTo?: Tweet;
  /** compondo uma citação deste post */
  quote?: Tweet;
};

export function TweetComposer({
  onPosted,
  autoFocus,
  className,
  replyTo,
  quote,
}: TweetComposerProps) {
  const user = useCurrentUser();
  const createTweet = useCreateTweet();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useAutosize(text);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();

  // libera as URLs de pré-visualização quando o componente sai da tela
  const attachmentsRef = useRef(attachments);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  useEffect(
    () => () => attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl)),
    [],
  );

  const length = tweetLength(text);
  const isEmpty = text.trim().length === 0 && attachments.length === 0;
  const canPost = !isEmpty && length <= TWEET_MAX_LENGTH && !submitting;

  function addFiles(files: FileList | null) {
    if (!files) return;
    const room = TWEET_MAX_MEDIA - attachments.length;
    const picked = Array.from(files).slice(0, room);
    const invalid = picked.map(validateImageFile).find(Boolean);

    if (files.length > room) setError(`Você pode adicionar até ${TWEET_MAX_MEDIA} imagens.`);
    else setError(invalid ?? null);

    const valid = picked.filter((file) => !validateImageFile(file));
    setAttachments((current) => [
      ...current,
      ...valid.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const removed = current.find((a) => a.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((a) => a.id !== id);
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canPost) return;

    setSubmitting(true);
    setError(null);
    try {
      // sobe as imagens em paralelo e só então cria o post
      const media = await Promise.all(attachments.map((a) => uploadImage(a.file, 'tweet')));
      await createTweet.mutateAsync({
        content: text,
        media,
        replyToId: replyTo?.id,
        quoteOfId: quote?.id,
      });

      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      setText('');
      setAttachments([]);
      onPosted?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível publicar. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={replyTo ? 'Escrever resposta' : 'Escrever post'}
      aria-busy={submitting}
      className={cn('flex gap-3 px-4 pt-3 pb-2', className)}
    >
      <Avatar src={user.avatarUrl} name={user.name} />

      <div className="min-w-0 flex-1">
        {replyTo && (
          <p className="pt-1 text-[15px] text-muted">
            Respondendo a <span className="text-brand">@{replyTo.author.username}</span>
          </p>
        )}
        <label htmlFor={textareaId} className="sr-only">
          Texto do post
        </label>
        <textarea
          ref={textareaRef}
          id={textareaId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            replyTo
              ? 'Poste sua resposta'
              : quote
                ? 'Adicione um comentário'
                : 'O que está acontecendo?'
          }
          autoFocus={autoFocus}
          rows={1}
          disabled={submitting}
          className="w-full resize-none bg-transparent py-3 text-xl placeholder:text-muted focus:outline-none"
        />

        {attachments.length > 0 && (
          <ul className={cn('mb-3 grid gap-2', attachments.length > 1 && 'grid-cols-2')}>
            {attachments.map((attachment, index) => (
              <li key={attachment.id} className="relative overflow-hidden rounded-2xl">
                <img
                  src={attachment.previewUrl}
                  alt={`Imagem ${index + 1} selecionada`}
                  className="aspect-video w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label={`Remover imagem ${index + 1}`}
                  disabled={submitting}
                  className="absolute top-1 right-1 rounded-full bg-black/70 p-1.5 hover:bg-black/50"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {quote && <QuotedTweetCard quote={quote} />}

        <FormError message={error ?? undefined} />

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= TWEET_MAX_MEDIA || submitting}
              aria-label="Adicionar imagens"
              className="rounded-full p-2 text-brand hover:bg-brand/10 disabled:opacity-50"
            >
              <ImageIcon className="size-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              aria-label="Escolher imagens"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = '';
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <CharCounter length={length} />
            <Button
              type="submit"
              size="sm"
              disabled={!canPost}
              loading={submitting}
              className="px-4"
            >
              {replyTo ? 'Responder' : 'Postar'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
