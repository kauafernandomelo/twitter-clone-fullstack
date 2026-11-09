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

## Fase 2 — Layout + Perfil ✅

- [x] Layout de 3 colunas: sidebar | conteúdo (600px) | coluna lateral
- [x] Responsivo: sidebar com texto (desktop), só ícones (tablet), barra inferior (mobile)
- [x] Todos os itens de navegação; os de fases futuras abrem uma página "Em breve"
- [x] Menu da conta (sair) na sidebar e no topo da home no mobile
- [x] Campos de perfil: bio, localização, site, avatar, banner (+ migration)
- [x] `GET /api/users/:username` (perfil público, sem email)
- [x] `PATCH /api/users/me` (string vazia apaga o campo; site sem `https://` é completado)
- [x] Usernames reservados para não colidir com rotas (`/home`, `/explore`...)
- [x] Upload direto do navegador para o Cloudinary com assinatura gerada na API (o secret nunca sai do servidor)
- [x] A API só aceita imagens enviadas para a pasta do próprio usuário
- [x] **Página de perfil** (`/:username`): banner, avatar, nome, @, bio, localização, site, data de entrada, abas, conta inexistente
- [x] Modal **Editar perfil** com recorte manual de avatar (1:1) e banner (3:1), zoom e remoção do banner
- [x] Imagem recortada e redimensionada no navegador antes do upload (avatar 400×400, banner 1500×500)
- [x] Testes: 15 novos na API + 8 novos no front
- [ ] Testar o upload real no Cloudinary (falta configurar as credenciais no `.env`)

## Fase 3 — Tweets ✅

- [x] Models `Tweet` e `TweetMedia` (ids UUID v7 ordenados pelo tempo, imagens com largura/altura)
- [x] Criar post: até 280 caracteres (emoji conta como 1) e até 4 imagens
- [x] Upload das imagens do post direto para o Cloudinary (pasta `tweet` do usuário, validada na API)
- [x] **Editar** o texto a qualquer momento, com o selo **"· Editado"** (passando o mouse mostra quando)
- [x] Salvar sem mudar nada não marca como editado; post sem imagem não pode ficar vazio
- [x] **Apagar** com confirmação (as imagens vão junto, em cascata)
- [x] Só o autor vê o menu "..." e a API responde 403 para os outros
- [x] Compositor no topo da home + modal "Postar" (sidebar e botão flutuante no mobile)
- [x] Contador circular de caracteres (amarelo nos últimos 20, vermelho acima do limite)
- [x] `TweetCard`: tempo relativo ("5 min", "3 h", "9 de nov"), grade de 1 a 4 imagens, clique abre o post
- [x] Página do post (`/:username/status/:id`) com data completa e URL corrigida se o @ estiver errado
- [x] Timeline global na home + aba "Posts" no perfil, com scroll infinito (paginação por cursor)
- [x] Contador de posts no cabeçalho do perfil
- [x] Testes: 18 novos na API + 12 novos no front

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
- **Upload direto pro Cloudinary** (Fase 2): a API só assina (pasta + timestamp) e o arquivo vai do navegador para o Cloudinary, sem consumir banda nem memória do nosso servidor.
- **Recorte no navegador** (Fase 2): o canvas recorta e redimensiona antes do upload (uma foto de 4 MB vira ~100 KB).
- **Imagens antigas não são apagadas do Cloudinary** (Fase 2): ao trocar o avatar, a imagem anterior fica lá. Limpeza (via API admin do Cloudinary) fica para a Fase 9.
- **Seguidores**: os contadores entram na Fase 4.
- **Edição só do texto** (Fase 3): a imagem não muda depois de publicada; para trocar, apaga e posta de novo. Não há limite de tempo para editar nem histórico de versões; dá para adicionar depois se fizer falta.
- **Paginação por cursor com UUID v7** (Fase 3): o id já nasce ordenado pelo tempo, então `WHERE id < cursor ORDER BY id DESC` pagina sem `OFFSET` e sem índice extra.
- **Timeline global provisória** (Fase 3): a home mostra posts de todo mundo e vira "Para você" na Fase 4, ao lado de "Seguindo".
- **`npm audit`** (Fase 0): há 10 avisos moderados no `minimatch` dentro do ESLint 10. É só ferramenta de dev e não vai para produção. O fix sugerido faria downgrade do ESLint, então ficou como está.
