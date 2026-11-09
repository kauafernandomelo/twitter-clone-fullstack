# Twitter Clone

[![CI](https://github.com/kauafernandomelo/twitter-clone-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/kauafernandomelo/twitter-clone-fullstack/actions/workflows/ci.yml)

Clone full-stack do Twitter feito com **React + TypeScript** no front e **Node + Express + PostgreSQL** no back, com tempo real via **Socket.IO**.

O histórico de construção, fase a fase, e as decisões técnicas estão no [ROADMAP.md](ROADMAP.md).

## Funcionalidades

- **Contas:** cadastro e login por email ou @username, sessão com JWT + refresh token rotativo em cookie `httpOnly`
- **Perfil:** bio, localização, site, avatar e banner com recorte, seguidores e seguindo
- **Posts:** até 280 caracteres e 4 imagens, edição com selo "Editado", exclusão
- **Interações:** curtir, responder (com conversa), repostar, citar e salvar
- **Feed:** abas "Para você" e "Seguindo", com scroll infinito
- **Busca:** full-text em português (entende flexões e ignora acentos), #hashtags, assuntos do momento, pessoas
- **@menções:** links no texto e autocomplete no compositor
- **Notificações em tempo real:** agrupadas ("Maria e mais 2 pessoas curtiram"), contador no sino e no título da aba
- **Mensagens diretas em tempo real:** imagens, "Visto" e "digitando…"
- **Tema claro e escuro**, lightbox de imagens, skeletons e acessibilidade verificada com axe-core

## Stack

| Camada    | Tecnologias                                                               |
| --------- | ------------------------------------------------------------------------- |
| Front-end | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, TanStack Query |
| Back-end  | Node.js, Express 5, TypeScript, Prisma 7, Zod, Socket.IO, pino            |
| Banco     | PostgreSQL 17 (full-text search, constraints `CHECK`, triggers)           |
| Imagens   | Cloudinary (upload direto do navegador, assinado pela API)                |
| Testes    | Vitest, Supertest, Testing Library, axe-core                              |
| Qualidade | ESLint, Prettier, TypeScript strict, GitHub Actions                       |
| Produção  | Docker, Render, Neon                                                      |

## Estrutura

```
.
├── apps/
│   ├── api/              # API REST + Socket.IO (Express + Prisma)
│   │   ├── prisma/       # schema e migrations
│   │   └── src/
│   │       ├── config/       # env validado
│   │       ├── lib/          # prisma, logger, socket, cloudinary, tokens
│   │       ├── middlewares/  # auth, rate limit, erros
│   │       └── modules/      # uma pasta por feature (routes, controller, service, testes)
│   └── web/              # SPA React
│       └── src/
│           ├── app/          # providers e rotas
│           ├── components/   # layout e componentes de UI
│           ├── features/     # uma pasta por feature (api, components, hooks, testes)
│           ├── lib/          # cliente HTTP, socket, datas, tema
│           └── pages/
├── packages/
│   └── shared/           # schemas Zod, tipos e parser de texto usados pelo front e pela API
├── Dockerfile            # imagem de produção (a API também serve o front)
├── render.yaml           # deploy no Render
└── docker-compose.yml    # Postgres de dev e de teste
```

## Rodando localmente

**Pré-requisitos:** Node.js 22.12+ e Docker.

```bash
# 1. instalar as dependências
npm install

# 2. variáveis de ambiente
cp apps/api/.env.example apps/api/.env
#    preencha JWT_ACCESS_SECRET (o comando para gerar está no arquivo)
#    e, para upload de imagens, as chaves do Cloudinary (opcional)

# 3. subir o Postgres (dev na porta 5434, teste na 5435)
npm run db:up

# 4. aplicar as migrations
npm run db:migrate

# 5. rodar API (http://localhost:3333) e web (http://localhost:5173)
npm run dev
```

## Dados de demonstração

Para ver o app "habitado" (perfis com foto, posts, curtidas, notificações e DMs):

```bash
npm run db:seed
```

Cria 21 perfis fictícios e a conta **@visitante**, usada pelo botão _"Entrar como visitante"_ da página inicial. Precisa das chaves do Cloudinary, porque as fotos são enviadas para lá. Pode rodar quantas vezes quiser: o seed anterior é apagado e recriado, e as contas reais não são tocadas.

Em produção (rode da sua máquina, com a connection string do Neon):

```bash
NODE_ENV=production DATABASE_URL="postgresql://..." npm run db:seed -- --confirm
```

## Scripts

| Comando              | O que faz                             |
| -------------------- | ------------------------------------- |
| `npm run dev`        | API e web em modo watch               |
| `npm run build`      | build de produção de todos os pacotes |
| `npm test`           | testes de todos os pacotes            |
| `npm run lint`       | ESLint no monorepo                    |
| `npm run typecheck`  | checagem de tipos em todos os pacotes |
| `npm run format`     | formata o código com o Prettier       |
| `npm run db:up`      | sobe os containers do Postgres        |
| `npm run db:down`    | derruba os containers                 |
| `npm run db:migrate` | cria/aplica migrations (Prisma)       |
| `npm run db:studio`  | abre o Prisma Studio                  |
| `npm run db:seed`    | cria os dados de demonstração         |

## Deploy (Render + Neon)

Em produção roda **um serviço só**: a API serve também o front compilado. Com um domínio só, os cookies `httpOnly` e o WebSocket funcionam sem CORS entre domínios nem `SameSite=None`.

1. **Banco (Neon):** crie um projeto em [neon.tech](https://neon.tech) e copie a connection string **direta** (sem `-pooler` no host). Ela termina com `?sslmode=require`.
2. **App (Render):** em [render.com](https://render.com), _New → Blueprint_ e escolha este repositório. O `render.yaml` cria o serviço e pede:
   - `DATABASE_URL`: a string do Neon
   - `CLOUDINARY_*`: opcionais; sem elas, o upload de imagens fica desligado
3. O `JWT_ACCESS_SECRET` é gerado pelo Render, e a URL pública vira o `WEB_ORIGIN` automaticamente.
4. A cada push na `main`, o Render espera o CI passar, aplica as migrations (`prisma migrate deploy`) e publica.

> O plano grátis do Render "dorme" após 15 minutos sem acesso; a primeira visita depois disso leva uns 30 s.

Para testar a imagem de produção localmente (com o Postgres do `docker-compose`):

```bash
docker build -t twitter-clone .
docker run --rm --network host \
  -e PORT=8080 \
  -e DATABASE_URL="postgresql://twitter:twitter@localhost:5434/twitter" \
  -e JWT_ACCESS_SECRET="um-segredo-com-pelo-menos-32-caracteres!!" \
  -e WEB_ORIGIN="http://localhost:8080" \
  twitter-clone
# abra http://localhost:8080
```
