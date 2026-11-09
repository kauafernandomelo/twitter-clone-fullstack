import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from './api';

// Joga os erros da API dentro do formulário: erros por campo (ex.: 409 "email já cadastrado")
// aparecem embaixo do input; o resto vira uma mensagem geral em `errors.root.server`.
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  if (error instanceof ApiError && error.details) {
    const fields = Object.entries(error.details).filter(([, messages]) => messages?.[0]);
    for (const [field, messages] of fields) {
      setError(field as Path<T>, { message: messages![0] }, { shouldFocus: true });
    }
    if (fields.length > 0) return;
  }

  setError('root.server', {
    message: error instanceof ApiError ? error.message : 'Algo deu errado. Tente novamente.',
  });
}
