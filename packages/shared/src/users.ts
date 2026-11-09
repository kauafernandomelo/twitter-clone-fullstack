import { z } from 'zod';

import { nameSchema } from './auth';

// Perfil público, como aparece em /:username
export type UserProfile = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  tweetsCount: number;
  followersCount: number;
  followingCount: number;
  /** quem está vendo segue este perfil */
  isFollowing: boolean;
  /** este perfil segue quem está vendo (selo "Segue você") */
  followsYou: boolean;
};

export type UserProfileResponse = { user: UserProfile };

// Usuário resumido, como aparece em listas (seguidores, seguindo, "Quem seguir")
export type UserSummary = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  isFollowing: boolean;
  followsYou: boolean;
};

export type SuggestionsResponse = { users: UserSummary[] };

// '' ou só espaços vira null (= campo apagado)
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null)
    .nullable();

const websiteSchema = z
  .string()
  .trim()
  .max(100, 'O site pode ter no máximo 100 caracteres')
  // aceita "meusite.com" e completa com https://
  .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
  .pipe(
    z.union([z.literal(''), z.url({ protocol: /^https?$/, message: 'Informe um link válido' })]),
  )
  .transform((value) => value || null)
  .nullable();

const imageUrlSchema = z.url({ protocol: /^https$/, message: 'URL de imagem inválida' }).nullable();

// Todos os campos são opcionais: o PATCH só altera o que vier no body.
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  bio: optionalText(160, 'A bio pode ter no máximo 160 caracteres').optional(),
  location: optionalText(30, 'A localização pode ter no máximo 30 caracteres').optional(),
  website: websiteSchema.optional(),
  avatarUrl: imageUrlSchema.optional(),
  bannerUrl: imageUrlSchema.optional(),
});

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
