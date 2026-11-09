import type { UserSummary } from '@twitter-clone/shared';

import { Avatar } from '@/components/Avatar';
import { cn } from '@/lib/cn';

type MentionSuggestionsProps = {
  listboxId: string;
  users: UserSummary[];
  active: number;
  optionId: (index: number) => string;
  onHover: (index: number) => void;
  onSelect: (user: UserSummary) => void;
};

export function MentionSuggestions({
  listboxId,
  users,
  active,
  optionId,
  onHover,
  onSelect,
}: MentionSuggestionsProps) {
  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-label="Sugestões de menção"
      className="absolute top-full left-0 z-30 w-full max-w-[350px] overflow-hidden rounded-xl border border-border bg-background py-1 shadow-popover"
    >
      {users.map((user, index) => (
        <li
          key={user.id}
          id={optionId(index)}
          role="option"
          aria-selected={index === active}
          // mousedown (e não click) para o textarea não perder o foco antes da escolha
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(user);
          }}
          onMouseEnter={() => onHover(index)}
          className={cn(
            'flex cursor-pointer items-center gap-3 px-4 py-2',
            index === active && 'bg-foreground/10',
          )}
        >
          <Avatar src={user.avatarUrl} name={user.name} />
          <span className="min-w-0 text-[15px]">
            <span className="block truncate font-bold">{user.name}</span>
            <span className="block truncate text-muted">@{user.username}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
