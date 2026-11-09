import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useCurrentUser } from '@/features/auth/api';
import { useSearchUsers } from '@/features/search/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { useStartConversation } from '../api';

type NewMessageModalProps = { open: boolean; onClose: () => void };

export function NewMessageModal({ open, onClose }: NewMessageModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Nova mensagem" variant="compact">
      <NewMessageSearch onStarted={onClose} />
    </Modal>
  );
}

function NewMessageSearch({ onStarted }: { onStarted: () => void }) {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim(), 200);
  const { data: users = [], isFetching } = useSearchUsers(debounced, { limit: 8 });
  const start = useStartConversation();

  function choose(username: string) {
    start.mutate(username, {
      onSuccess: (conversation) => {
        onStarted();
        navigate(`/messages/${conversation.id}`);
      },
    });
  }

  const results = users.filter((user) => user.id !== me.id);

  return (
    <div className="pb-4">
      <div className="relative border-b border-border px-4 pb-2">
        <Search aria-hidden="true" className="absolute top-2.5 left-7 size-4 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pessoas"
          aria-label="Buscar pessoas"
          className="h-10 w-full bg-transparent pr-3 pl-10 text-[15px] placeholder:text-muted focus:outline-none"
        />
      </div>
      {isFetching && results.length === 0 && (
        <div className="flex justify-center p-4">
          <Spinner />
        </div>
      )}
      <ul aria-label="Pessoas encontradas">
        {results.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              onClick={() => choose(user.username)}
              disabled={start.isPending}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-foreground/[0.03]"
            >
              <Avatar src={user.avatarUrl} name={user.name} />
              <span className="min-w-0 text-[15px]">
                <span className="block truncate font-bold">{user.name}</span>
                <span className="block truncate text-muted">@{user.username}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
