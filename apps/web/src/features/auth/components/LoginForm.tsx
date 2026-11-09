import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@twitter-clone/shared';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { applyApiErrors } from '@/lib/form';

import { useLogin } from '../api';
import { FormError } from './FormError';

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login.mutateAsync(data);
      // sucesso: a sessão vai pro cache e o PublicOnlyRoute redireciona sozinho
    } catch (error) {
      applyApiErrors(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormError message={errors.root?.server?.message} />

      <TextField
        label="Email ou nome de usuário"
        autoComplete="username"
        autoFocus
        error={errors.identifier?.message}
        {...register('identifier')}
      />
      <PasswordField
        label="Senha"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" variant="inverse" size="lg" fullWidth loading={isSubmitting}>
        Entrar
      </Button>

      <p className="text-[15px] text-muted">
        Não tem uma conta?{' '}
        <Link to="/signup" replace className="text-brand hover:underline">
          Inscreva-se
        </Link>
      </p>
    </form>
  );
}
