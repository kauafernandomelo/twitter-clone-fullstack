import { useSuggestions } from '../api';
import { UserRow } from './UserRow';

// "Quem seguir" da coluna lateral: some se não houver sugestões ou se der erro.
export function WhoToFollow() {
  const { data: users } = useSuggestions();
  if (!users || users.length === 0) return null;

  return (
    <section
      aria-labelledby="who-to-follow"
      className="overflow-hidden rounded-2xl border border-border"
    >
      <h2 id="who-to-follow" className="px-4 py-3 text-xl font-extrabold">
        Quem seguir
      </h2>
      {users.map((user) => (
        <UserRow key={user.id} user={user} showBio={false} />
      ))}
    </section>
  );
}
