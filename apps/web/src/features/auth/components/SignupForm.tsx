import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@twitter-clone/shared';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { applyApiErrors } from '@/lib/form';

import { useRegister } from '../api';
import { FormError } from './FormError';

export function SignupForm() {
  const signup = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched', // valida ao sair do campo, sem gritar enquanto a pessoa digita
    defaultValues: { name: '', username: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signup.mutateAsync(data);
    } catch (error) {
      applyApiErrors(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormError message={errors.root?.server?.message} />

      <TextField
        label="Nome"
        autoComplete="name"
        autoFocus
        maxLength={50}
        error={errors.name?.message}
        {...register('name')}
      />
      <TextField
        label="Nome de usuário"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={15}
        error={errors.username?.message}
        {...register('username')}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" variant="inverse" size="lg" fullWidth loading={isSubmitting}>
        Criar conta
      </Button>

      <p className="text-muted text-[15px]">
        Já tem uma conta?{' '}
        <Link to="/login" replace className="text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
