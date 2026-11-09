import { formatFullDate } from '@/lib/date';

export function EditedLabel({ editedAt }: { editedAt: string | null }) {
  if (!editedAt) return null;
  return (
    <span className="text-muted" title={`Editado em ${formatFullDate(editedAt)}`}>
      · Editado
    </span>
  );
}
