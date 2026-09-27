# MindGarten — Self-Hosted Bookmark Manager

Um cofre de links/bookmarks **self-hosted** com integração para agentes locais (Hermes, Pi Agent).

## Features

- 🔗 **CRUD de Links** — Criar, ler, atualizar, deletar links com facilidade
- 🏷️ **Tagging Flexível** — Categorize links com tags personalizáveis
- 🔍 **Full-Text Search** — Busca rápida via PostgreSQL
- 🤖 **API REST** — Integração com assistentes (Hermes, Pi Agent)
- 🐳 **Docker Ready** — Deploy em CasaOS em segundos
- 💻 **Vue 3 UI** — Interface responsiva com design IBM Carbon

## Stack

- **Backend**: Node.js 20 + Fastify 4.x
- **Frontend**: Vue 3 + Vite + Pinia
- **Database**: PostgreSQL 15+
- **Auth**: API Tokens (simples para agentes)
- **Deploy**: Docker Compose

## Quickstart

### Com Docker Compose

```bash
# Clone e entre no diretório
cd mindgarten

# Build e start
docker-compose up --build

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### Desenvolvimento Local

#### Backend

```bash
cd backend
npm install
npm run db:push  # Criar tabelas PostgreSQL
npm run dev      # Rodar servidor
```

#### Frontend

```bash
cd frontend
npm install
npm run dev      # Rodar dev server
```

## Estrutura de Pastas

```
mindgarten/
├── backend/              # Node.js + Fastify API
│   ├── src/
│   │   ├── routes/      # Endpoints (links, tags, health)
│   │   ├── models/      # Database models
│   │   └── middleware/  # Auth, error handling
│   ├── prisma/          # ORM schema
│   └── Dockerfile
├── frontend/            # Vue 3 SPA
│   ├── src/
│   │   ├── components/  # Componentes Vue
│   │   ├── pages/       # Páginas (Dashboard, Search, etc)
│   │   └── api/         # Client HTTP
│   └── Dockerfile
├── docs/                # Documentação
└── PLAN.md             # Plano de implementação
```

## API Endpoints

### Links

```
GET    /api/v1/links              # Listar links
POST   /api/v1/links              # Criar link
GET    /api/v1/links/:id          # Detalhes
PUT    /api/v1/links/:id          # Atualizar
DELETE /api/v1/links/:id          # Deletar
GET    /api/v1/links/search?q=    # Busca full-text
GET    /api/v1/links/tag/:tagId   # Filtrar por tag
```

### Tags

```
GET    /api/v1/tags               # Listar tags
POST   /api/v1/tags               # Criar tag
GET    /api/v1/tags/:id           # Detalhes
PUT    /api/v1/tags/:id           # Atualizar
DELETE /api/v1/tags/:id           # Deletar
```

### Health

```
GET    /health                    # Status do servidor
GET    /ready                     # Status de prontidão (DB check)
```

## Autenticação

Use `Authorization: Bearer <token>` no header:

```bash
curl -H "Authorization: Bearer seu-token" http://localhost:3000/api/v1/links
```

Token configurável via `.env` (variável `API_TOKEN`).

## Integração com Hermes Agent

Exemplo usando cURL:

```bash
curl -X POST http://localhost:3000/api/v1/links \
  -H "Authorization: Bearer seu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "title": "My Link",
    "description": "Descrição",
    "tags": [1, 2]
  }'
```

## Roadmap (Fase 2)

- [ ] OpenViking integration (embeddings)
- [ ] Semantic search
- [ ] Browser extension
- [ ] Export/Import (JSON, Raindrop, Pocket)
- [ ] Compartilhamento de links
- [ ] Analytics

## Licença

MIT — Sinta-se livre para usar, modificar e distribuir.

## Documentação Adicional

- [PLAN.md](./PLAN.md) — Plano de implementação
- [docs/API.md](./docs/API.md) — Documentação detalhada de API
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Decisões técnicas
- [docs/INTEGRATION.md](./docs/INTEGRATION.md) — Como integrar com agentes
