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
    /** responder a este post */
    replyToId: z.uuid().optional(),
    /** citar este post */
    quoteOfId: z.uuid().optional(),
  })
  .refine((tweet) => tweet.content.length > 0 || tweet.media.length > 0, {
    message: 'Escreva algo ou adicione uma imagem',
    path: ['content'],
  })
  .refine((tweet) => !(tweet.replyToId && tweet.quoteOfId), {
    message: 'Um post não pode ser resposta e citação ao mesmo tempo',
    path: ['quoteOfId'],
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

/** Post citado, mostrado dentro de outro post (sem estatísticas nem ações) */
export type QuotedTweet = {
  id: string;
  content: string;
  media: TweetMedia[];
  author: TweetAuthor;
  createdAt: string;
};

export type TweetStats = {
  replies: number;
  /** reposts simples */
  retweets: number;
  /** citações */
  quotes: number;
  likes: number;
};

/** O que quem está vendo já fez com este post */
export type TweetViewerState = {
  liked: boolean;
  retweeted: boolean;
  bookmarked: boolean;
};

export type Tweet = {
  /** id do post original (é o que se curte, responde, abre...) */
  id: string;
  /**
   * id da "entrada" na lista. Num repost, é o id da linha do repost e não do original:
   * serve de chave única na lista (o mesmo post pode aparecer como original e como repost).
   */
  entryId: string;
  content: string;
  media: TweetMedia[];
  author: TweetAuthor;
  createdAt: string;
  /** null = nunca editado */
  editedAt: string | null;
  /** é resposta; replyTo null aqui significa que o post respondido foi apagado */
  isReply: boolean;
  replyTo: { id: string; author: { username: string } } | null;
  /** é citação; quote null aqui significa que o post citado foi apagado */
  isQuote: boolean;
  quote: QuotedTweet | null;
  stats: TweetStats;
  viewer: TweetViewerState;
  /** preenchido quando a entrada é um repost ("Fulano repostou") */
  repostedBy: TweetAuthor | null;
};

/** Contexto de uma conversa: os posts acima (do mais antigo ao mais recente) */
export type ThreadResponse = { ancestors: Tweet[] };

export type TweetResponse = { tweet: Tweet };

// Formato padrão de lista paginada: nextCursor null = acabou
export type Paginated<T> = { items: T[]; nextCursor: string | null };
