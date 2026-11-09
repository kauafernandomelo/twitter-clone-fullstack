import { z } from 'zod';

// Regras de cadastro/login. O MESMO schema valida o formulário no front e o body na API.

export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu nome')
  .max(50, 'O nome pode ter no máximo 50 caracteres');

export const usernameSchema = z
  .string()
  .trim()
  .min(4, 'O nome de usuário precisa ter pelo menos 4 caracteres')
  .max(15, 'O nome de usuário pode ter no máximo 15 caracteres')
  .regex(USERNAME_REGEX, 'Use apenas letras, números e _')
  .toLowerCase();

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Informe um email válido').max(254, 'Email muito longo'));

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .max(128, 'A senha pode ter no máximo 128 caracteres');

export const registerSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  // email OU @username (aceita com ou sem o @)
  identifier: z
    .string()
    .trim()
    .min(1, 'Informe seu email ou nome de usuário')
    .transform((value) => value.replace(/^@/, '').toLowerCase()),
  password: z.string().min(1, 'Informe sua senha'),
});

export type RegisterInput = z.input<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;

// Usuário autenticado, como a API devolve em /auth/me, /auth/login e /auth/register
export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = { user: AuthUser };
