import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/Button';

import { useStartConversation } from '../api';

/** Botão de envelope no perfil: abre (ou cria) a conversa com a pessoa. */
export function MessageButton({ username }: { username: string }) {
  const navigate = useNavigate();
  const start = useStartConversation();

  return (
    <Button
      variant="secondary"
      aria-label={`Mandar mensagem para @${username}`}
      loading={start.isPending}
      onClick={() =>
        start.mutate(username, {
          onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
        })
      }
      className="size-10 p-0"
    >
      <Mail className="size-5" />
    </Button>
  );
}
