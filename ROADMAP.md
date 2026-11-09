# Roadmap — Twitter Clone

Checklist vivo do projeto. Cada fase é desenvolvida numa branch própria (`feat/fase-N-...`) e só é marcada como concluída depois de revisada e aprovada.

**Legenda:** `[x]` feito · `[ ]` pendente

---

## Fase 0 — Fundação ✅

- [x] Repositório git próprio + branch `feat/fase-0-fundacao`
- [x] Monorepo com npm workspaces (`apps/api`, `apps/web`, `packages/shared`)
- [x] TypeScript strict compartilhado (`tsconfig.base.json`)
- [x] ESLint (flat config) + Prettier (com ordenação de classes Tailwind)
- [x] Docker Compose: Postgres de dev (porta 5434) e de teste (porta 5435, em memória)
- [x] Prisma 7 configurado (`prisma.config.ts`, driver adapter `pg`, client gerado em `src/generated`)
- [x] API Express 5: helmet, CORS com credenciais, cookie-parser, logs com pino, env validado com Zod
- [x] Formato padrão de erro `{ code, message, details? }` + 404 padrão
- [x] `GET /api/health`
- [x] Web: Vite + React 19 + Tailwind v4 (tokens de cor do tema) + React Router + TanStack Query
- [x] Proxy `/api` no Vite (cookies de auth na mesma origem em dev)
- [x] Cliente HTTP `api()` com erro tipado (`ApiError`)
- [x] Testes: Vitest + Supertest (API) e Vitest + Testing Library (web)
- [x] `.env.example`, README com o passo a passo

## Fase 1 — Autenticação ✅

- [x] Models `User` e `RefreshToken` + primeira migration (ids UUID v7, tabelas em snake_case)
- [x] Schemas Zod de cadastro/login no `packages/shared` (mesma validação no front e na API)
- [x] `POST /api/auth/register` (hash argon2id, username e email únicos, 409 apontando o campo)
- [x] `POST /api/auth/login` com email **ou** @username (mesma mensagem para usuário inexistente e senha errada, com tempo de resposta igual)
- [x] `POST /api/auth/logout` (revoga a sessão e limpa os cookies)
- [x] `POST /api/auth/refresh` com rotação de refresh token + detecção de reuso (revoga a família)
- [x] `GET /api/auth/me` + middleware `requireAuth`
- [x] Cookies `httpOnly` + `SameSite=Lax`; refresh token restrito ao path `/api/auth`
- [x] Rate limit nas rotas de login e cadastro (20 tentativas a cada 15 min por IP)
- [x] Landing page + modais de **Cadastro** e **Login** (rotas `/signup` e `/login` abrem direto)
- [x] Componentes de UI: `Button`, `TextField` (label flutuante), `PasswordField`, `Modal` (`<dialog>` nativo), `Spinner`
- [x] Sessão no TanStack Query + `ProtectedRoute` / `PublicOnlyRoute` (volta para a página de origem depois do login)
- [x] Renovação automática do token quando recebe 401 (um único refresh para requests simultâneas)
- [x] Erros da API mapeados para os campos do formulário
- [x] Testes: 17 de integração da API (banco real de teste) + 9 de fluxo no front

## Fase 2 — Layout + Perfil

- [ ] Layout de 3 colunas (sidebar, conteúdo, coluna lateral) responsivo
- [ ] Sidebar com navegação + menu da conta (sair)
- [ ] `GET /api/users/:username`
- [ ] **Página de perfil** (`/:username`): banner, avatar, nome, @, bio, data de entrada, contadores
- [ ] Upload de imagens com Cloudinary (assinatura gerada no backend)
- [ ] Modal de **editar perfil** (nome, bio, localização, site, avatar, banner)
- [ ] Testes

## Fase 3 — Tweets

- [ ] Model `Tweet` + `TweetMedia`
- [ ] Criar tweet (280 caracteres, contador circular, até 4 imagens)
- [ ] Apagar o próprio tweet
- [ ] Componente `TweetCard`
- [ ] Página do tweet (`/:username/status/:id`)
- [ ] Aba "Posts" no perfil com paginação por cursor
- [ ] Testes

## Fase 4 — Seguir + Feed

- [ ] Model `Follow`
- [ ] Seguir / deixar de seguir (atualização otimista)
- [ ] Páginas de seguidores / seguindo
- [ ] Feed "Seguindo" (scroll infinito)
- [ ] Feed "Para você"
- [ ] "Quem seguir" na coluna lateral
- [ ] Testes

## Fase 5 — Interações

- [ ] Curtir / descurtir
- [ ] Responder (threads) + exibição da conversa
- [ ] Retweet / desfazer retweet
- [ ] Quote tweet
- [ ] Bookmarks + página "Itens salvos"
- [ ] Abas do perfil: Respostas, Mídia, Curtidas
- [ ] Testes

## Fase 6 — Busca + Hashtags

- [ ] Extração de #hashtags e @menções ao criar o tweet
- [ ] Links clicáveis para @ e # no texto do tweet
- [ ] Busca de usuários e tweets (página Explorar)
- [ ] Página de #hashtag
- [ ] "Assuntos do momento"
- [ ] Testes

## Fase 7 — Notificações

- [ ] Model `Notification` (curtiu, seguiu, respondeu, retweetou, mencionou)
- [ ] Página de notificações (todas / menções)
- [ ] Socket.IO autenticado
- [ ] Contador de não lidas em tempo real
- [ ] Testes

## Fase 8 — Mensagens diretas

- [ ] Models `Conversation`, `ConversationParticipant`, `Message`
- [ ] Lista de conversas + nova conversa
- [ ] Chat em tempo real (Socket.IO)
- [ ] Indicador de lida
- [ ] Testes

## Fase 9 — Polimento

- [ ] Tema claro/escuro
- [ ] Skeletons, estados vazios e de erro
- [ ] Acessibilidade (foco, aria, navegação por teclado)
- [ ] Layout mobile (barra inferior)
- [ ] Rate limiting global e revisão de segurança

## Fase 10 — Deploy + CI

- [ ] GitHub Actions: lint, typecheck, testes (com Postgres de serviço)
- [ ] Deploy da API + banco (Railway/Render)
- [ ] Deploy do front (Vercel)
- [ ] Variáveis de produção, cookies `Secure` e domínio

---

## Registro de decisões técnicas

- **Vite 7 em vez de 8** (Fase 0): o binário do Rolldown 1.2.x, usado pelo Vite 8, usa instruções que o CPU da máquina de dev (i7-3770, sem AVX2) não tem, e o processo morre com _Illegal instruction_. Por isso o `overrides` no `package.json` raiz força o Vite 7.3 (Rollup + esbuild). Dá para reavaliar quando o Vite 8 passar a usar um Rolldown compatível.
- **TypeScript 6.0** (Fase 0): o TS 7 (compilador nativo) ainda não é suportado pelo `typescript-eslint`.
- **Prisma 7.10** (Fase 0): a tag `latest` do npm aponta para um RC da v8, então fixamos a última versão estável.
- **Postgres nas portas 5434/5435** (Fase 0): a 5432 já está ocupada por um Postgres instalado no sistema.
- **Username sempre minúsculo** (Fase 1): garante unicidade sem diferenciar maiúsculas e URLs estáveis (`/fulano`). O usuário pode digitar maiúsculas; normalizamos.
- **Refresh token opaco, não JWT** (Fase 1): fica salvo (como hash SHA-256) no banco para poder ser revogado. Há uma janela de 10 s de tolerância na rotação para não derrubar quem tem duas abas abertas.
- **Cookies em produção** (pendente na Fase 10): hoje é `SameSite=Lax` com proxy na mesma origem. No deploy, usar rewrite da Vercel (`/api` → API) para manter a mesma origem e evitar `SameSite=None`.
- **Prisma 7 não roda `generate` no `migrate dev`** (Fase 1): o script `db:migrate` já encadeia os dois.
- **`npm audit`** (Fase 0): há 10 avisos moderados no `minimatch` dentro do ESLint 10. É só ferramenta de dev e não vai para produção. O fix sugerido faria downgrade do ESLint, então ficou como está.
