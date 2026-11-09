import { z } from 'zod';

// Valida as variáveis de ambiente na subida: se faltar algo, a API nem inicia
// (falha rápida e com mensagem clara, em vez de quebrar no meio de uma request).
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.url(),
  WEB_ORIGIN: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', z.flattenError(parsed.error).fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
