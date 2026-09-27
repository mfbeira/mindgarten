# AGENTS.md — MindGarten

MindGarten é um cofre de links/bookmarks self-hosted com integração para agentes locais.

## O que é

Aplicação web + API que permite:
- 🔗 Salvar, organizar e buscar links pessoais
- 🏷️ Categorizar com tags flexíveis
- 🤖 Integração via API com Hermes, Pi Agent e scripts
- 🐳 Deploy em Docker/CasaOS

## Stack

- **Backend**: Node.js 20 + Fastify 4.x + TypeScript
- **Frontend**: Vue 3 + Vite + Pinia
- **Database**: PostgreSQL 15 com full-text search
- **Deploy**: Docker Compose

## Estrutura

```
mindgarten/
├── backend/         # API REST (Fastify)
├── frontend/        # Web UI (Vue 3)
├── docs/            # Documentação
├── PLAN.md          # Plano de implementação
├── AGENTS.md        # Este arquivo
└── README.md        # Quick start
```

## Regras

1. **Backend first** — API deve ser funcional antes de frontend
2. **API-driven** — Hermes/Pi Agent são clientes de primeira classe
3. **Single-user** — Sem multi-tenant por enquanto
4. **PostgreSQL obrigatório** — Não mudar para SQLite
5. **Tokens simples** — Sem JWT para manter agentes felizes

## Roadmap

### MVP (Fase 1) — Em andamento
- ✅ Plano + estrutura base
- 🔄 Backend: CRUD + search
- 🔄 Frontend: Dashboard + Editor
- 🔄 Docker + docs

### Fase 2 (Future)
- OpenViking embeddings
- Semantic search
- Browser extension
- Export/import (Raindrop, Pocket)

### Fase 3 (Backlog)
- Webhooks
- Rate limiting
- Multi-user (if needed)

## Development

### Setup local

```bash
cd mindgarten
npm install          # Setup monorepo
npm run dev          # Backend + Frontend
```

### Backend

```bash
cd backend
npm run db:push      # Create DB schema
npm run dev          # Watch + reload
```

### Frontend

```bash
cd frontend
npm run dev          # Vite dev server
```

## Integração com Hermes

Hermes pode chamar:

```bash
POST /api/v1/links
Authorization: Bearer <token>

{
  "url": "https://example.com",
  "title": "My Link",
  "tags": [1, 2]
}
```

Docs: [docs/INTEGRATION.md](./docs/INTEGRATION.md)

## Ambiente Conhecido

- **PC Windows 11** — Desenvolvimento
- **Ubuntu CasaOS** — Servidor rodando containers
- **Hermes** — Roda em Docker no servidor (integração primária)
- **Pi Agent** — Cliente potencial (via HTTP REST)
- **Ollama** — Em 192.168.0.5:11434 (embeddings fase 2)
- **OpenViking** — Em localhost:1933 (contexto fase 2)

## Decisões Técnicas

- **Fastify vs Express**: Fastify é mais leve + HTTP/2
- **PostgreSQL vs SQLite**: PG suporta full-text search nativo
- **Vue vs React**: Vue é mais simples, alinha com mindgarten design
- **Prisma vs Raw SQL**: Type-safe + migrations automáticas
- **Tokens vs JWT**: Simples pra agentes, sem complexidade

Ver [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) para detalhes.

## Segurança

- API tokens em `.env`
- CORS restrito
- Validação Zod
- SQL injection prevenido (Prisma)
- HTTPS recomendado em produção

## Próximos Passos

1. `npm install` no root
2. `npm run db:push` pra criar schema
3. `npm run dev` pra rodar tudo
4. Criar primeiros endpoints CRUD

## Contato e Documentação

Perguntas ou detalhes técnicos? Consulte [PLAN.md](./PLAN.md) e [docs/](./docs/).
