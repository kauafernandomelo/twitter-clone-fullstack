# Twitter Clone

Clone full-stack do Twitter feito com **React + TypeScript** no front e **Node + Express + PostgreSQL** no back.

> 🚧 Em desenvolvimento. O progresso está no [ROADMAP.md](ROADMAP.md).

## Stack

| Camada    | Tecnologias                                                               |
| --------- | ------------------------------------------------------------------------- |
| Front-end | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, TanStack Query |
| Back-end  | Node.js, Express 5, TypeScript, Prisma 7, Zod, pino                       |
| Banco     | PostgreSQL 17 (Docker)                                                    |
| Testes    | Vitest, Supertest, Testing Library                                        |
| Qualidade | ESLint, Prettier, TypeScript strict                                       |

## Estrutura

```
.
├── apps/
│   ├── api/              # API REST (Express + Prisma)
│   │   ├── prisma/       # schema e migrations
│   │   └── src/
│   │       ├── config/       # env validado
│   │       ├── lib/          # prisma, logger, erros
│   │       ├── middlewares/
│   │       └── modules/      # uma pasta por feature (routes, controller, service, schemas)
│   └── web/              # SPA React
│       └── src/
│           ├── app/          # providers e rotas
│           ├── features/     # uma pasta por feature (api, components, hooks)
│           ├── lib/          # cliente HTTP, query client
│           └── pages/
├── packages/
│   └── shared/           # schemas Zod e tipos compartilhados entre front e back
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
