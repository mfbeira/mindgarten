# MindGarten — Self-Hosted Bookmark Manager

## Context

Você precisa de um **cofre de links/bookmarks self-hosted** que funcione em Docker/CasaOS com:
- Integração fluida com agentes locais existentes (Hermes, Pi Agent)
- API REST para que assistentes salvem/consultem links programaticamente
- Interface web simples para gerenciar manualmente
- Tagging flexível para categorizar links
- Search textual rápido

**Problema que resolve**: Vaultwarden tem sérios problemas de integração com assistentes. Você quer algo mais simples, agnóstico e focado em bookmarks com API-first design.

**Ambiente**: Windows 11 (PC) + Ubuntu CasaOS (servidor). 8GB VRAM / 48GB RAM. Ollama local em `192.168.0.5:11434`, Hermes rodando em Docker no servidor.

---

## Recommended Approach: Node.js + Fastify + PostgreSQL

### Por quê esta stack?

| Aspecto | Escolha | Razão |
|--------|---------|-------|
| **Backend** | Node.js + Fastify | Leve, HTTP2, perfomático pra API. Sem overhead de framework pesado. |
| **Frontend** | Vue 3 + Vite | SPA responsiva usando design IBM Carbon (já tem template mindgarten). |
| **DB** | PostgreSQL | Full-featured, rápido com índices, fácil em Docker, suporta JSON. |
| **Search** | PostgreSQL Full-Text Search | Sem dependência extra (Elasticsearch). Suficiente para <1000 links. |
| **Deploy** | Docker Compose | Integra perfeitamente com CasaOS. Reproduzível. |
| **Auth** | API Tokens + optional OAuth | Simples pra integração com Hermes/agentes. Sem JWT desnecessário. |

**Alternativas consideradas e descartadas:**
- Python FastAPI: Requer mais setup de venv, menos integrado com Node/npm do ecossistema frontend
- PHP Laravel: Possível mas menos ágil pra integração com agentes JavaScript/Node
- SQLite: Inadequado pra concorrência (Hermes + UI simultânea)

---

## Architecture

### Componentes

```
┌─────────────────────────────────────────────────┐
│           LinkVault (Docker)                    │
├──────────────────┬──────────────────────────────┤
│ Backend:         │ Frontend:                    │
│ Node.js Fastify  │ Vue 3 SPA                    │
│ :3000            │ (IBM Carbon Design)          │
├──────────┬───────┼──────────────────────────────┤
│ PostgreSQL DB    │ OpenViking SDK               │
│ links, tags      │ (opcional: embeddings)       │
├──────────────────┴──────────────────────────────┤
│                                                  │
│  Clientes da API REST:                         │
│  • Hermes Agent (Telegram/CLI)                │
│  • Pi Agent (organização)                      │
│  • CasaOS Web (painel)                         │
│  • Curl/scripts custom                         │
└──────────────────────────────────────────────────┘
```

### Banco de Dados Schema (PostgreSQL)

```sql
-- Tabela de links
CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title VARCHAR(500),
  description TEXT,
  favicon_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'user'
);

-- Tabela de tags
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7),
  description TEXT
);

-- Relação M:N
CREATE TABLE link_tags (
  link_id INT REFERENCES links(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

-- Índices pra performance
CREATE INDEX idx_links_created_at ON links(created_at DESC);
CREATE INDEX idx_links_url ON links(url);
CREATE INDEX idx_link_tags_link ON link_tags(link_id);
CREATE INDEX idx_link_tags_tag ON link_tags(tag_id);

-- Full-text search em PostgreSQL
ALTER TABLE links ADD COLUMN search_vector tsvector;
CREATE INDEX idx_links_search ON links USING GIN(search_vector);
-- Trigger pra atualizar search_vector automaticamente
CREATE TRIGGER links_search_update
BEFORE INSERT OR UPDATE ON links
FOR EACH ROW
EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, description, url);
```

### API REST (Fastify)

**Endpoints principais:**

```
POST   /api/v1/links                    # Criar link
GET    /api/v1/links                    # Listar com filtro/busca
GET    /api/v1/links/:id                # Detalhes de link
PUT    /api/v1/links/:id                # Atualizar
DELETE /api/v1/links/:id                # Deletar

GET    /api/v1/links/search?q=query     # Full-text search
GET    /api/v1/links/tag/:tagId         # Links por tag

POST   /api/v1/tags                     # Criar tag
GET    /api/v1/tags                     # Listar tags
PUT    /api/v1/tags/:id                 # Atualizar tag
DELETE /api/v1/tags/:id                 # Deletar tag

GET    /api/v1/health                   # Health check pra CasaOS
```

**Auth:**
- Header `Authorization: Bearer <token>` ou query `?token=<token>`
- Tokens armazenados em `.env` ou BD (tabela `api_tokens`)
- Sem JWT desnecessário — Hermes só precisa de header simples

**Request/Response padrão:**
```json
// POST /api/v1/links
{
  "url": "https://example.com/article",
  "title": "My Article",
  "description": "About XYZ",
  "tags": [1, 3, 5]  // tag IDs
}

// Resposta 201 Created
{
  "id": 42,
  "url": "https://example.com/article",
  "title": "My Article",
  "tags": [
    { "id": 1, "name": "tech" },
    { "id": 3, "name": "learning" }
  ],
  "created_at": "2026-09-25T10:30:00Z"
}
```

### Frontend (Vue 3 + IBM Carbon Design)

**Pages:**
1. **Dashboard** — Grid de cards/lista de links recentes
2. **Link Browser** — Busca, filtro por tag, ordenação
3. **Add Link** — Modal/form pra guardar novo link
4. **Tag Manager** — CRUD de tags
5. **Settings** — API token, integração, export/import

**Design**: Reutilizar design tokens do `mindgarten/DESIGN.md` (IBM Carbon)

---

## Project Structure

```
link-vault/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Fastify setup
│   │   ├── routes/
│   │   │   ├── links.ts           # Endpoints de links
│   │   │   ├── tags.ts            # Endpoints de tags
│   │   │   └── health.ts          # Health check
│   │   ├── models/
│   │   │   ├── link.ts            # ORM models (Prisma/Knex)
│   │   │   └── tag.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts            # Token validation
│   │   │   └── error.ts           # Erro handling
│   │   └── db/
│   │       └── migrations/        # SQL migrations
│   ├── .env.example
│   ├── docker-compose.yml         # PostgreSQL + App
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Vue components
│   │   ├── pages/                 # SPA routes
│   │   ├── stores/                # Pinia (state)
│   │   ├── api/                   # Client HTTP
│   │   ├── styles/                # IBM Carbon tokens
│   │   └── App.vue
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   ├── API.md                     # Documentação de API
│   ├── ARCHITECTURE.md            # Decisões técnicas
│   └── INTEGRATION.md             # Como integrar com Hermes/Pi Agent
│
├── docker-compose.yml             # Orquestra backend + frontend + DB
└── README.md
```

---

## Implementação — MVP (Fase 1)

### Pré-requisitos
- Node.js 18+
- Docker + Docker Compose
- PostgreSQL (container)

### Etapas

#### 1. Setup inicial (backend)
- [x] Criar monorepo com `npm workspaces` ou `pnpm`
- [x] Fastify server com plugins (cors, helmet, auth)
- [x] Prisma ORM setup com schema PostgreSQL (previewFeatures fullTextSearch)
- [x] Database migrations e schemas validados (`prisma generate`)

#### 2. API REST (backend)
- [x] Endpoints CRUD de links (com formatação de tags e extração automática de hostnames)
- [x] Endpoints CRUD de tags (com contagem de links associados)
- [x] Full-text search em PostgreSQL (`/links/search?q=`) e filtro por tag (`/links/tag/:id`)
- [x] Autenticação por token (`Authorization: Bearer <token>` e query `?token=<token>`)
- [x] Error handling centralizado + Pino logging estruturado
- [x] Testes automatizados (Vitest: 7 testes passando com 100% de sucesso)

#### 3. Frontend (Vue 3)
- [x] Vite setup + TypeScript + Vue Router + Pinia
- [x] Componentes IBM Carbon Enterprise (Navbar, LinkCard, TagBadge, LinkModal, TagModal, ToastNotification)
- [x] Page: Dashboard (KPIs, recent links, busca instantânea, chips de tag)
- [x] Page: Search/Filter (LinkBrowser com ordenação, busca, filtro de tag e paginação)
- [x] Page: Add/Edit Link (modal com criação dinâmica de tags)
- [x] Tag Manager (CRUD completo de tags com paleta de cores IBM Carbon)
- [x] Settings (configuração de API token, teste de conectividade em tempo real e guia Hermes/cURL)

#### 4. Docker + Deploy
- [x] Dockerfile backend (Node 20 + Prisma Client)
- [x] Dockerfile frontend (Vite dev server / prod ready)
- [x] docker-compose.yml orquestra tudo (PostgreSQL 15 + API + Web)
- [x] `.env` templates e arquivos `.env` locais configurados
- [x] Startup via `docker-compose up --build` ou `npm run dev`

#### 5. Documentação
- [x] README com instruções de deploy e desenvolvimento
- [x] API.md (endpoints, schemas e exemplos curl)
- [x] INTEGRATION.md (guia completo de integração Hermes e Pi Agent)
- [x] ARCHITECTURE.md (decisões de design, schemas e fluxo de dados)

---

## Integração com Hermes Agent

**Cenário:**
1. Usuário no Telegram (via Hermes): `/save_link https://example.com My Article`
2. Hermes chama `POST /api/v1/links` com token
3. LinkVault retorna `{ id: 42, ... }`
4. Hermes responde: "✅ Link salvo!"

**Implementação:**
- Hermes envia `Authorization: Bearer <API_TOKEN>` (variável de ambiente do container Hermes)
- LinkVault valida token em middleware
- OpenViking pode enriquecer com embeddings (fase 2, opcional)

---

## Considerações de Segurança

- ✅ HTTPS em produção (reverse proxy Nginx/Traefik)
- ✅ CORS restrito a origem esperada
- ✅ Rate limiting em `/api/v1/` (Fastify plugin)
- ✅ SQL injection prevenido (Prisma/Knex parameterizado)
- ✅ Tokens em `.env`, nunca hardcoded
- ✅ Validação de URL (malware check opcional via VirusTotal)

---

## Fase 2 (Future)

Após MVP rodar estável:
- [ ] OpenViking integration — embeddings de link content
- [ ] Semantic search — busca por similaridade de conceitos
- [ ] Browser extension — save link direto do navegador
- [ ] Export/Import — backup em JSON, suporte Raindrop/Pocket
- [ ] Sharing — links públicos com token read-only
- [ ] Analytics — dashboard de links mais acessados

---

## Verificação / Testing

### End-to-End
1. **Docker Compose up** → PostgreSQL + backend + frontend rodam
2. **Criar link via UI** → aparece no banco, renderiza corretamente
3. **Hermes POST /api/v1/links** → token válido, link criado, resposta 201
4. **Busca full-text** → query retorna resultados relevantes
5. **Filtro por tag** → tags aparecem corretamente, contagem bate

### Testes
- Unit: Modelos, lógica de search, validação
- Integration: API + BD
- E2E: Puppeteer/Playwright (browser + UI)

---

## Tech Stack Final

| Camada | Tech | Versão | Razão |
|--------|------|--------|-------|
| Runtime | Node.js | 20 LTS | Estável, long-term support |
| Backend | Fastify | 4.x | Leve, HTTP/2, performance |
| ORM | Prisma | 5.x | Type-safe, migrations automáticas |
| DB | PostgreSQL | 15+ | Full-text search nativo |
| Frontend | Vue | 3.4 | Reatividade, composition API |
| Build | Vite | 5.x | Fast HMR, otimizado |
| Auth | Manual tokens | — | Simples pra agentes |
| Deploy | Docker | — | CasaOS-native |
| Style | Tailwind + Carbon tokens | — | Consistente com mindgarten |

---

## Next Steps (após aprovação)

1. ✅ Validar arquitetura com você
2. ✅ Setup inicial (monorepo, dependências)
3. ✅ Schema PostgreSQL + migrations
4. ✅ API REST core
5. ✅ Frontend MVP
6. ✅ Docker Compose
7. ✅ Deploy em CasaOS
8. ✅ Testar integração com Hermes
