import { MessageEvent, type MessageNewPayload, type TypingPayload } from '@twitter-clone/shared';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useCurrentUser } from '@/features/auth/api';
import { useConversation, useMarkConversationRead, useMessages } from '@/features/messages/api';
import { ChatComposer } from '@/features/messages/components/ChatComposer';
import { MessageBubble, TypingIndicator } from '@/features/messages/components/MessageBubble';
import { useInView } from '@/hooks/use-in-view';
import { formatMessageTime } from '@/lib/date';
import { onSocketEvent } from '@/lib/socket';

const GROUP_GAP_MS = 5 * 60_000;
const TYPING_TIMEOUT_MS = 6000;

export function ChatPage() {
  const { conversationId = '' } = useParams();
  const me = useCurrentUser();
  const conversation = useConversation(conversationId);
  const messages = useMessages(conversationId);
  const { mutate: markRead } = useMarkConversationRead(conversationId);
  const [otherTyping, setOtherTyping] = useState(false);

  const items = messages.data?.pages.flatMap((page) => page.items) ?? [];
  const other = conversation.data?.other;

  // marca como lida ao abrir e sempre que chega mensagem nova da outra pessoa
  const latest = items[0];
  const latestFromOther = latest && latest.senderId !== me.id ? latest.id : null;
  useEffect(() => {
    if (latestFromOther) markRead();
  }, [latestFromOther, markRead]);

  // "digitando…" da outra pessoa (some sozinho se o aviso de parar se perder)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopTyping = onSocketEvent(MessageEvent.TYPING, (payload) => {
      const event = payload as TypingPayload;
      if (event.conversationId !== conversationId) return;
      setOtherTyping(event.isTyping);
      clearTimeout(timer);
      if (event.isTyping) timer = setTimeout(() => setOtherTyping(false), TYPING_TIMEOUT_MS);
    });
    const stopNew = onSocketEvent(MessageEvent.NEW, (payload) => {
      const event = payload as MessageNewPayload;
      if (event.conversationId === conversationId && event.message.senderId !== me.id) {
        setOtherTyping(false);
      }
    });
    return () => {
      clearTimeout(timer);
      stopTyping();
      stopNew();
    };
  }, [conversationId, me.id]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = messages;
  const sentinelRef = useInView<HTMLDivElement>(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, Boolean(hasNextPage));

  if (conversation.isError) {
    return (
      <>
        <PageHeader title="Mensagens" showBack />
        <div className="px-8 py-16 text-center">
          <p className="text-[31px] leading-9 font-extrabold">Conversa não encontrada</p>
          <p className="mt-2 text-[15px] text-muted">Ela não existe ou você não participa dela.</p>
        </div>
      </>
    );
  }

  // "Visto" vai embaixo da minha mensagem mais recente, se a outra pessoa já leu até ela
  const myLatest = items.find((message) => message.senderId === me.id);
  const otherReadAt = conversation.data?.otherLastReadAt;
  const seenId = myLatest && otherReadAt && otherReadAt >= myLatest.createdAt ? myLatest.id : null;

  return (
    // altura da tela menos a barra inferior no celular
    <div className="flex h-[calc(100dvh-53px)] flex-col sm:h-dvh">
      <PageHeader
        title={other?.name ?? 'Mensagens'}
        subtitle={other ? `@${other.username}` : undefined}
        showBack
        start={
          other && (
            <Link to={`/${other.username}`} aria-label={`Perfil de ${other.name}`}>
              <Avatar src={other.avatarUrl} name={other.name} size="sm" />
            </Link>
          )
        }
      />

      {/* flex-col-reverse: a conversa "gruda" embaixo e as mais antigas carregam ao subir */}
      <div
        role="log"
        aria-label="Mensagens"
        aria-live="polite"
        className="flex flex-1 flex-col-reverse overflow-y-auto pt-4"
      >
        {otherTyping && other && <TypingIndicator name={other.name} />}

        {items.map((message, index) => {
          const newer = items[index - 1];
          const endsGroup =
            !newer ||
            newer.senderId !== message.senderId ||
            new Date(newer.createdAt).getTime() - new Date(message.createdAt).getTime() >
              GROUP_GAP_MS;
          const footer =
            message.id === seenId
              ? 'Visto'
              : endsGroup
                ? formatMessageTime(message.createdAt)
                : undefined;
          return (
            <MessageBubble
              key={message.id}
              message={message}
              mine={message.senderId === me.id}
              footer={footer}
            />
          );
        })}

        {(messages.isPending || isFetchingNextPage) && (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        )}
        <div ref={sentinelRef} className="h-px shrink-0" />
      </div>

      <ChatComposer conversationId={conversationId} />
    </div>
  );
}
