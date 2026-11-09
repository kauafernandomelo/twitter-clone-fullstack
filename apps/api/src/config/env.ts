import { z } from 'zod';

// Valida as variáveis de ambiente na subida: se faltar algo, a API nem inicia
// (falha rápida e com mensagem clara, em vez de quebrar no meio de uma request).
// "VAR=" (vazia) no .env conta como não definida
const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.url(),
  // Origem do site (CORS). No Render, se não for definida, usa a URL pública do serviço,
  // que o próprio Render fornece em RENDER_EXTERNAL_URL.
  WEB_ORIGIN: z.preprocess((value) => value || process.env.RENDER_EXTERNAL_URL, z.url()),
  JWT_ACCESS_SECRET: z.string().min(32, 'precisa ter pelo menos 32 caracteres'),
  // Opcionais: sem elas a API sobe normalmente, só o upload de imagens fica desativado.
  // Quantos proxies existem na frente da API (ex.: 1 no Railway/Render). Sem isso, atrás de um
  // proxy, o rate limit enxergaria o IP do proxy como se fosse de todo mundo.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  // Pasta do front compilado (apps/web/dist). Definida em produção: a API serve o site também.
  WEB_DIST_DIR: optionalString,
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', z.flattenError(parsed.error).fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
