import { MailPlus } from 'lucide-react';
import { useState } from 'react';

import { InfiniteList } from '@/components/InfiniteList';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useConversations } from '@/features/messages/api';
import { ConversationRow } from '@/features/messages/components/ConversationRow';
import { NewMessageModal } from '@/features/messages/components/NewMessageModal';

export function MessagesPage() {
  const [composing, setComposing] = useState(false);

  return (
    <>
      <div className="relative">
        <PageHeader title="Mensagens" />
        <button
          type="button"
          onClick={() => setComposing(true)}
          aria-label="Nova mensagem"
          className="absolute top-2 right-3 z-10 rounded-full p-2 hover:bg-foreground/10"
        >
          <MailPlus className="size-5" />
        </button>
      </div>

      <InfiniteList
        query={useConversations()}
        getKey={(conversation) => conversation.id}
        renderItem={(conversation) => <ConversationRow conversation={conversation} />}
        empty={
          <div className="px-8 py-16">
            <p className="text-[31px] leading-9 font-extrabold">
              Boas-vindas à sua caixa de entrada!
            </p>
            <p className="mt-2 text-[15px] text-muted">
              Converse em particular com outras pessoas, com mensagens que chegam na hora.
            </p>
            <Button size="lg" className="mt-6" onClick={() => setComposing(true)}>
              Escrever uma mensagem
            </Button>
          </div>
        }
        errorMessage="Não foi possível carregar suas conversas."
      />

      <NewMessageModal open={composing} onClose={() => setComposing(false)} />
    </>
  );
}
