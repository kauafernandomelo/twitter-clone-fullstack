import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

import { useToggleFollow } from '../api';

type FollowButtonProps = {
  username: string;
  isFollowing: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

// "Seguir" (branco) / "Seguindo", que vira "Deixar de seguir" em vermelho ao passar o mouse.
export function FollowButton({ username, isFollowing, size = 'md', className }: FollowButtonProps) {
  const toggle = useToggleFollow();
  const onClick = () => toggle.mutate({ username, follow: !isFollowing });

  if (!isFollowing) {
    return (
      <Button variant="inverse" size={size} onClick={onClick} className={className}>
        Seguir
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={onClick}
      aria-label={`Deixar de seguir @${username}`}
      className={cn(
        'group min-w-[110px] hover:border-danger/50 hover:bg-danger/10 hover:text-danger',
        className,
      )}
    >
      <span className="group-hover:hidden">Seguindo</span>
      <span className="hidden group-hover:inline">Deixar de seguir</span>
    </Button>
  );
}
