export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="border-danger/40 bg-danger/10 text-danger rounded-md border px-3 py-2 text-sm"
    >
      {message}
    </p>
  );
}
