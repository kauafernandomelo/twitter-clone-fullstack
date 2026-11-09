import { z } from 'zod';

export const searchTabSchema = z.enum(['top', 'latest']);
export type SearchTab = z.infer<typeof searchTabSchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Digite algo para buscar').max(100),
  /** top: por relevância · latest: mais recentes */
  tab: searchTabSchema.default('top'),
  /** offset (busca por relevância não tem um cursor natural) ou id (mais recentes) */
  cursor: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const userSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(50),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type Trend = { tag: string; count: number };
export type TrendsResponse = { trends: Trend[] };
