import { z } from 'zod';

export const TWEET_MAX_LENGTH = 280;
export const TWEET_MAX_MEDIA = 4;

/**
 * Conta caracteres como o usuário enxerga: um emoji (😀) vale 1, não 2.
 * `"😀".length` no JS é 2 (UTF-16), mas `[..."😀"].length` é 1 (code points),
 * que é também como o Postgres conta no VARCHAR(280).
 */
export function tweetLength(text: string) {
  return [...text].length;
}

const contentSchema = z
  .string()
  .trim()
  .refine((text) => tweetLength(text) <= TWEET_MAX_LENGTH, {
    message: `O post pode ter no máximo ${TWEET_MAX_LENGTH} caracteres`,
  });

export const tweetMediaInputSchema = z.object({
  url: z.url({ protocol: /^https$/ }),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const createTweetSchema = z
  .object({
    content: contentSchema.default(''),
    media: z
      .array(tweetMediaInputSchema)
      .max(TWEET_MAX_MEDIA, `No máximo ${TWEET_MAX_MEDIA} imagens por post`)
      .default([]),
  })
  .refine((tweet) => tweet.content.length > 0 || tweet.media.length > 0, {
    message: 'Escreva algo ou adicione uma imagem',
    path: ['content'],
  });

// Edição muda só o texto. Se o post não tiver imagem, o texto não pode ficar vazio (checado na API).
export const updateTweetSchema = z.object({ content: contentSchema });

export const cursorQuerySchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateTweetInput = z.input<typeof createTweetSchema>;
export type UpdateTweetInput = z.input<typeof updateTweetSchema>;
export type TweetMediaInput = z.infer<typeof tweetMediaInputSchema>;

export type TweetAuthor = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type TweetMedia = { url: string; width: number; height: number };

export type Tweet = {
  id: string;
  content: string;
  media: TweetMedia[];
  author: TweetAuthor;
  createdAt: string;
  /** null = nunca editado */
  editedAt: string | null;
};

export type TweetResponse = { tweet: Tweet };

// Formato padrão de lista paginada: nextCursor null = acabou
export type Paginated<T> = { items: T[]; nextCursor: string | null };
