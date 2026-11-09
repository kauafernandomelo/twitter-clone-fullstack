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

## Fase 4 — Seguir + Feed ✅

- [x] Model `Follow` com id UUID v7 (lista paginável) e par único seguidor/seguido
- [x] Constraint `CHECK` no Postgres impede seguir a si mesmo (além da validação na API)
- [x] Seguir / deixar de seguir idempotentes (`POST`/`DELETE /api/users/:username/follow`)
- [x] Perfil com contadores **Seguindo** / **Seguidores** e selo **"Segue você"**
- [x] Botão "Seguir" / "Seguindo" (vira "Deixar de seguir" em vermelho no hover)
- [x] Update otimista: o botão e os contadores mudam na hora e desfazem se a API falhar
- [x] Páginas `/:username/followers` e `/:username/following` com abas e scroll infinito
- [x] Home com abas **Para você** (todos os posts recentes) e **Seguindo** (quem eu sigo + meus posts)
- [x] **Quem seguir** na coluna lateral: os mais seguidos que eu ainda não sigo
- [x] Componentes genéricos `InfiniteList` e `TabBar` (reaproveitados em posts, usuários e abas)
- [x] Testes: 11 novos na API + 10 novos no front

## Fase 5 — Interações ✅

- [x] Models `Like` e `Bookmark` (id UUID v7, par único usuário/post)
- [x] Respostas, citações e reposts como linhas em `tweets` (`reply_to_id`, `quote_of_id`, `retweet_of_id`)
- [x] Constraints `CHECK`: repost não tem texto nem é resposta/citação; post não referencia a si mesmo
- [x] **Curtir** com update otimista (desfaz se a API falhar)
- [x] **Responder** pelo modal (mostra o post original e "Respondendo a @fulano") ou direto na página do post
- [x] Página do post com a **conversa acima** (linha ligando os posts), estatísticas e **respostas** em ordem cronológica
- [x] **Repostar** / desfazer, com a entrada "Fulano repostou" nas timelines (uma por pessoa)
- [x] **Citar** com o post original embutido; se o original for apagado, aparece "não está disponível"
- [x] **Salvar** + página **Salvos** (privada; remover tira o post da página na hora)
- [x] Abas do perfil: Posts, Respostas, Mídia e Curtidas (**só no próprio perfil**, privadas como no Twitter atual)
- [x] Interagir pelo id de um repost age no post original
- [x] Testes: 15 novos na API + 10 novos no front

## Fase 6 — Busca + Hashtags ✅

- [x] Parser de texto no `packages/shared` (#hashtags com acento, @menções, links), igual na API e no front
- [x] #hashtags, @menções e URLs clicáveis no texto dos posts (sem links aninhados dentro de citações)
- [x] Tabelas `tweet_hashtags` e `mentions`, sincronizadas numa transação ao criar e editar o post
- [x] **Busca full-text do Postgres**: dicionário português (stemming), sem acentos (`unaccent`), índice GIN mantido por trigger
- [x] Página **Explorar** com abas Destaques (relevância, `ts_rank`), Mais recentes e Pessoas; o estado fica na URL
- [x] Busca de "#tag" vai direto para a hashtag exata
- [x] Busca de pessoas por início do @ ou parte do nome
- [x] Página de **#hashtag** (`/hashtag/:tag`)
- [x] **Assuntos do momento**: hashtags mais usadas nas últimas 24h (coluna lateral e Explorar)
- [x] Caixa de busca funcional na coluna lateral
- [x] **Autocomplete de @menções** no compositor (↑↓, Enter/Tab, Esc, mouse; padrão ARIA combobox)
- [x] Testes: 10 novos na API + 8 novos no front

## Fase 7 — Notificações ✅

- [x] Model `Notification` (destinatário, autor da ação, tipo, post) com enum de tipos
- [x] Gatilhos: curtiu, repostou, respondeu, citou, mencionou (inclusive ao editar) e seguiu
- [x] Ações em si mesmo não notificam; quem recebe "respondeu" não recebe também "mencionou"
- [x] Desfazer (descurtir, desfazer repost, deixar de seguir, tirar a menção) remove a notificação
- [x] Notificações criadas só depois do commit; post apagado leva junto as notificações dele (`CASCADE`)
- [x] **Agrupamento** em SQL: curtidas/reposts do mesmo post e follows do mesmo dia viram uma linha ("Maria e mais 2 pessoas curtiram")
- [x] Página de notificações com abas **Todas** / **Menções**; itens não lidos destacados
- [x] **Tempo real com Socket.IO**: mesma porta da API, autenticado pelo cookie httpOnly, uma sala por usuário
- [x] Reconexão renova a sessão se o token expirou
- [x] Contador de não lidas no sino (sidebar e mobile) e no título da aba: "(3) Twitter Clone"
- [x] Abrir a página marca tudo como lido (as outras abas abertas também zeram)
- [x] Testes: 12 novos na API (inclusive socket real) + 5 novos no front

## Fase 8 — Mensagens diretas ✅

- [x] Models `Conversation` (com `pair_key` única: uma conversa por par de pessoas, garantido no banco), `ConversationParticipant` e `Message`
- [x] Constraint `CHECK`: mensagem precisa ter texto ou imagem
- [x] Qualquer pessoa pode iniciar conversa (pelo modal "Nova mensagem" ou pelo envelope no perfil)
- [x] Quem não participa recebe 404 em tudo (não revela nem que a conversa existe)
- [x] Caixa de entrada com a última mensagem, hora e não lidas destacadas
- [x] Chat com balões (meus à direita), hora por sequência de mensagens e rolagem que "gruda" embaixo (`flex-col-reverse`), carregando as antigas ao subir
- [x] Texto (até 1000 caracteres, com links) e **imagens** (upload direto no Cloudinary, pasta `message` validada na API)
- [x] **Tempo real**: a mensagem chega na hora (o evento leva a mensagem, sem nova request)
- [x] **"Visto"** na minha última mensagem quando a outra pessoa leu
- [x] **"digitando…"** repassado pelo servidor só entre participantes (com limite de tempo se o aviso de parar se perder)
- [x] Enter envia, Shift+Enter quebra a linha
- [x] Bolinha de conversas não lidas no ícone de Mensagens
- [x] Testes: 10 novos na API (inclusive socket real) + 11 novos no front

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
- **Feed "Seguindo" montado na leitura** (Fase 4): uma query com `author.followers.some(...)` usa os índices de `follows`. Escala bem até muitos milhares de usuários; no Twitter real o feed é pré-montado (fan-out on write), o que não faz sentido aqui.
- **Sugestões em `/api/suggestions`** (Fase 4): fora de `/api/users/...` para não disputar a rota com um usuário chamado "suggestions".
- **Edição só do texto** (Fase 3): a imagem não muda depois de publicada; para trocar, apaga e posta de novo. Não há limite de tempo para editar nem histórico de versões; dá para adicionar depois se fizer falta.
- **Paginação por cursor com UUID v7** (Fase 3): o id já nasce ordenado pelo tempo, então `WHERE id < cursor ORDER BY id DESC` pagina sem `OFFSET` e sem índice extra.
- **Timeline global provisória** (Fase 3): a home mostra posts de todo mundo e vira "Para você" na Fase 4, ao lado de "Seguindo".
- **Repost como linha em `tweets`** (Fase 5): a timeline continua sendo uma lista só, paginada por id, sem juntar duas fontes. O `entryId` diferencia a entrada do repost do post original na mesma lista.
- **Resposta/citação de post apagado** (Fase 5): `reply_to_id`/`quote_of_id` viram NULL (`ON DELETE SET NULL`), mas `is_reply`/`is_quote` continuam true para a interface mostrar "post indisponível". Reposts são apagados junto com o original (`CASCADE`).
- **Contador de "Reposts"** (Fase 5): nas ações, soma reposts e citações (como no Twitter); na página do post aparecem separados.
- **Full-text com trigger, não coluna gerada** (Fase 6): `unaccent` não é IMMUTABLE, então há um wrapper `immutable_unaccent` e um trigger preenche `search_vector`. A coluna é `Unsupported("tsvector")` no schema, para o Prisma não tentar apagá-la (o `migrate diff` do schema contra o banco sai vazio).
- **Migrations fora do modo interativo** (Fase 5/6): o SQL sai de `prisma migrate diff`, as partes que o Prisma não expressa (CHECK, extensão, função, trigger) são escritas à mão, e tudo é aplicado com `migrate deploy`.
- **Busca por relevância pagina por offset** (Fase 6): não existe cursor natural num ranking; limitado a 1000 resultados. "Mais recentes" pagina por id, como o resto do app.
- **Hashtags de posts antigos** (Fase 6): só os posts criados ou editados depois desta fase têm hashtags indexadas. A busca full-text cobre todos (a migration preencheu o índice).
- **Agrupamento na leitura, não na escrita** (Fase 7): cada ação é uma linha simples (fácil de desfazer); a query agrupa com `GROUP BY` sobre uma chave calculada. O cursor é o id mais recente do grupo; um grupo que recebe uma curtida nova sobe para o topo, como no Twitter.
- **Socket.IO só avisa, não carrega dados** (Fase 7): o evento diz "mudou algo" e o front recarrega via REST. Uma única fonte de verdade, sem duplicar a serialização no socket.
- **Sem Web Push por enquanto** (Fase 7): notificação com a aba fechada exige service worker, chaves VAPID e HTTPS; faz mais sentido depois do deploy (Fase 10).
- **No chat, o socket leva a mensagem** (Fase 8): nas notificações o evento só avisa "mudou"; no chat, a mensagem vai junto para aparecer instantaneamente. Ela entra no cache sem duplicar, porque chega pela resposta do POST e pelo eco do socket.
- **Listeners de socket independentes da conexão** (Fase 8): uma página aberta direto pela URL registra listeners antes de o layout abrir a conexão (os efeitos do React rodam de dentro para fora). O `lib/socket` guarda os listeners e os liga quando a conexão nasce. Bug encontrado na checagem visual, coberto por teste.
- **`npm audit`** (Fase 0): há 10 avisos moderados no `minimatch` dentro do ESLint 10. É só ferramenta de dev e não vai para produção. O fix sugerido faria downgrade do ESLint, então ficou como está.
