import type { Tweet } from '@twitter-clone/shared';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown } from '@/components/ui/Dropdown';
import { useCurrentUser } from '@/features/auth/api';

import { useDeleteTweet } from '../api';
import { EditTweetModal } from './EditTweetModal';

type TweetMenuProps = { tweet: Tweet; onDeleted?: () => void };

// Menu "..." do post. Por enquanto só o autor tem ações (editar/apagar).
export function TweetMenu({ tweet, onDeleted }: TweetMenuProps) {
  const user = useCurrentUser();
  const deleteTweet = useDeleteTweet();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (tweet.author.id !== user.id) return null;

  return (
    <>
      <Dropdown
        triggerLabel="Mais opções"
        trigger={<Ellipsis className="size-[18px]" />}
        triggerClassName="-my-2 rounded-full p-2 text-muted hover:bg-brand/10 hover:text-brand"
        items={[
          {
            label: 'Editar',
            icon: <Pencil className="size-[18px]" />,
            onSelect: () => setEditing(true),
          },
          {
            label: 'Apagar',
            icon: <Trash2 className="size-[18px]" />,
            danger: true,
            onSelect: () => setConfirmingDelete(true),
          },
        ]}
      />

      <EditTweetModal tweet={tweet} open={editing} onClose={() => setEditing(false)} />

      <ConfirmDialog
        open={confirmingDelete}
        title="Apagar post?"
        description="Isso não pode ser desfeito. O post será removido do seu perfil e da timeline de todo mundo."
        confirmLabel="Apagar"
        danger
        loading={deleteTweet.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() =>
          deleteTweet.mutate(tweet, {
            onSuccess: () => {
              setConfirmingDelete(false);
              onDeleted?.();
            },
          })
        }
      />
    </>
  );
}
