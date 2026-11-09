import { MESSAGE_MAX_LENGTH, MessageEvent } from '@twitter-clone/shared';
import { Image as ImageIcon, SendHorizontal, X } from 'lucide-react';
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';

import { FormError } from '@/features/auth/components/FormError';
import { uploadImage } from '@/features/users/api';
import { useAutosize } from '@/hooks/use-autosize';
import { ApiError } from '@/lib/api';
import { validateImageFile } from '@/lib/images';
import { emitToServer } from '@/lib/socket';

import { useSendMessage } from '../api';

const TYPING_IDLE_MS = 3000;

export function ChatComposer({ conversationId }: { conversationId: string }) {
  const send = useSendMessage(conversationId);
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const textareaRef = useAutosize(text);
  const fileRef = useRef<HTMLInputElement>(null);

  // "digitando…": avisa ao começar e para depois de 3 s sem digitar
  const typing = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function stopTyping() {
    clearTimeout(idleTimer.current);
    if (typing.current) {
      typing.current = false;
      emitToServer(MessageEvent.TYPING, { conversationId, isTyping: false });
    }
  }

  function notifyTyping() {
    if (!typing.current) {
      typing.current = true;
      emitToServer(MessageEvent.TYPING, { conversationId, isTyping: true });
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }

  // ao sair da conversa: para de "digitar" e libera a pré-visualização da imagem.
  // useEffectEvent lê o estado mais recente sem precisar entrar nas dependências do efeito.
  const cleanup = useEffectEvent(() => {
    stopTyping();
    if (image) URL.revokeObjectURL(image.preview);
  });
  useEffect(() => () => cleanup(), []);

  const canSend = (text.trim().length > 0 || image !== null) && !sending;

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(null);
    stopTyping();
    try {
      const uploaded = image ? await uploadImage(image.file, 'message') : undefined;
      await send.mutateAsync({ content: text, image: uploaded });
      setText('');
      if (image) URL.revokeObjectURL(image.preview);
      setImage(null);
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  // Enter envia; Shift+Enter quebra a linha
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  function pickImage(file: File | undefined) {
    if (!file) return;
    const invalid = validateImageFile(file);
    setError(invalid);
    if (invalid) return;
    if (image) URL.revokeObjectURL(image.preview);
    setImage({ file, preview: URL.createObjectURL(file) });
  }

  return (
    <form
      onSubmit={submit}
      aria-label="Enviar mensagem"
      className="border-t border-border px-3 py-2"
    >
      <FormError message={error ?? undefined} />
      {image && (
        <div className="relative mb-2 inline-block">
          <img src={image.preview} alt="Imagem anexada" className="max-h-40 rounded-2xl" />
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(image.preview);
              setImage(null);
            }}
            aria-label="Remover imagem"
            className="absolute top-1 right-1 rounded-full bg-black/70 p-1.5 hover:bg-black/50"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-1 rounded-2xl bg-surface px-2 py-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Anexar imagem"
          disabled={sending}
          className="rounded-full p-2 text-brand hover:bg-brand/10"
        >
          <ImageIcon className="size-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          aria-label="Escolher imagem"
          onChange={(event) => {
            pickImage(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            notifyTyping();
          }}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          placeholder="Escreva uma mensagem"
          aria-label="Mensagem"
          rows={1}
          maxLength={MESSAGE_MAX_LENGTH}
          className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Enviar"
          className="rounded-full p-2 text-brand hover:bg-brand/10 disabled:opacity-40"
        >
          <SendHorizontal className="size-5" />
        </button>
      </div>
    </form>
  );
}
