import { useEffect, useState } from 'react';

import { InfiniteList } from '@/components/InfiniteList';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabBar } from '@/components/ui/TabBar';
import {
  type NotificationFilter,
  useMarkAllRead,
  useNotifications,
} from '@/features/notifications/api';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';

function Empty({ filter }: { filter: NotificationFilter }) {
  return (
    <div className="px-8 py-16 text-center">
      <p className="text-[31px] leading-9 font-extrabold">
        {filter === 'all' ? 'Nada para ver aqui, por enquanto' : 'Nenhuma menção ainda'}
      </p>
      <p className="mt-2 text-[15px] text-muted">
        {filter === 'all'
          ? 'Curtidas, reposts, respostas, menções e novos seguidores aparecem aqui.'
          : 'Quando alguém responder, citar ou mencionar você, vai aparecer aqui.'}
      </p>
    </div>
  );
}

function NotificationList({ filter }: { filter: NotificationFilter }) {
  const query = useNotifications(filter);
  const { mutate: markAllRead } = useMarkAllRead();
  // O que estava "não lido" quando a página abriu continua destacado enquanto ela estiver aberta,
  // mesmo depois de marcar tudo como lido (como no Twitter).
  const [highlighted, setHighlighted] = useState<Set<string> | null>(null);
  const items = query.data?.pages.flatMap((page) => page.items);

  // Guarda o retrato da primeira carga durante o render (padrão recomendado pelo React para
  // "lembrar algo de um render anterior"), sem um efeito que dispararia um render a mais.
  if (items && highlighted === null) {
    setHighlighted(new Set(items.filter((item) => !item.read).map((item) => item.id)));
  }

  // efeito só para o que é de fato externo: avisar a API, uma vez, quando a lista chegou
  const loaded = highlighted !== null;
  useEffect(() => {
    if (loaded) markAllRead();
  }, [loaded, markAllRead]);

  return (
    <InfiniteList
      query={query}
      getKey={(item) => item.id}
      renderItem={(item) => (
        <NotificationRow item={item} highlight={!item.read || Boolean(highlighted?.has(item.id))} />
      )}
      empty={<Empty filter={filter} />}
      errorMessage="Não foi possível carregar as notificações."
    />
  );
}

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all');

  return (
    <>
      <PageHeader title="Notificações" />
      <TabBar
        label="Tipos de notificação"
        tabs={[
          { label: 'Todas', active: filter === 'all', onSelect: () => setFilter('all') },
          {
            label: 'Menções',
            active: filter === 'mentions',
            onSelect: () => setFilter('mentions'),
          },
        ]}
      />
      <NotificationList key={filter} filter={filter} />
    </>
  );
}
