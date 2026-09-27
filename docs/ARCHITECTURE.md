# MindGarten Architecture

## System Overview

MindGarten is a self-hosted bookmark manager designed for personal use with seamless agent integration.

```
┌─────────────────────────────────────────────────────┐
│                   End Users                         │
├──────────────────┬──────────────────┬───────────────┤
│ Web UI (Vue 3)   │ Hermes Agent     │ Pi Agent      │
│ :5173            │ (Telegram)       │ (CLI/API)     │
└─────────┬────────┴─────────┬────────┴───────┬───────┘
          │                  │                │
          └──────────────────┼────────────────┘
                             │ HTTP REST
          ┌──────────────────▼────────────────┐
          │   Fastify API Server (:3000)      │
          │   ├─ /api/v1/links                │
          │   ├─ /api/v1/tags                 │
          │   └─ /health, /ready              │
          └──────────────────┬────────────────┘
                             │ SQL
          ┌──────────────────▼────────────────┐
          │   PostgreSQL Database             │
          │   ├─ links                        │
          │   ├─ tags                         │
          │   ├─ link_tags (M:N)              │
          │   └─ api_tokens                   │
          └───────────────────────────────────┘
```

## Technology Decisions

### Backend: Node.js + Fastify

**Why:**
- Lightweight and performant for API-first design
- Excellent support for async/await
- Strong TypeScript integration
- Aligns with existing ecosystem (pi-gateway, agy-maker)
- Minimal overhead for token-based auth

**Alternatives considered:**
- Python FastAPI: More heavyweight, requires venv management
- Go: Overkill for this scale, not integrated with frontend stack
- PHP: Possible but less aligned with agent ecosystem

### Database: PostgreSQL

**Why:**
- Native full-text search support (no Elasticsearch needed)
- Perfect for <1000 links scale
- Easy Docker deployment
- Strong consistency for token auth
- JSONB support for future extensibility

**Schema:**
```sql
-- Core tables
links (id, url, title, description, favicon_url, created_at, updated_at)
tags (id, name, color, description)
link_tags (link_id, tag_id)  -- M:N relationship
api_tokens (id, token, name, created_at, last_used)

-- Indexes
- idx_links_created_at (for timeline queries)
- idx_links_url (for duplicate prevention)
- idx_links_search (GIN on tsvector for full-text)
- idx_link_tags_* (for join performance)
```

### Frontend: Vue 3 + Vite

**Why:**
- Reactive, component-based architecture
- Fast HMR during development
- Small bundle size
- Type-safe with TypeScript
- IBM Carbon design tokens (from mindgarten)

### Authentication: API Tokens

**Why:**
- Simple for Hermes/Pi Agent integration (no OAuth complexity)
- No JWT overhead for single-user system
- Token stored in `api_tokens` table (future: add expiry, rate limiting)
- Current approach: environment variable + hardcoded check

**Future:** Database-backed tokens with expiry and per-agent tracking.

## API Design Philosophy

### REST Conventions
- `POST /resource` → Create (201 Created)
- `GET /resource` → List (200 OK)
- `GET /resource/:id` → Read (200 OK)
- `PUT /resource/:id` → Update (200 OK)
- `DELETE /resource/:id` → Delete (204 No Content)

### Response Format
All responses follow a consistent envelope:
```json
{
  "success": true/false,
  "data": {},
  "error": "error message (if success=false)"
}
```

## Deployment Architecture

### Docker Compose (CasaOS)

```yaml
services:
  postgres         # PostgreSQL 15 + persistent volume
  backend          # Fastify in Node 20 alpine
  frontend         # Vite dev server or nginx for prod
```

**Network:**
- Internal: `link-vault-network`
- External ports: 3000 (API), 5173 (UI), 5432 (DB)

**Volumes:**
- `postgres_data` — Database persistence
- `./backend/src`, `./frontend/src` — Code for hot-reload in dev

### Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://postgres:password@postgres:5432/link_vault
API_TOKEN=your-secret-token
CORS_ORIGIN=http://localhost:5173
PORT=3000
LOG_LEVEL=info
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000
```

## Security Considerations

### Current Implementation
- ✅ Bearer token auth (simple for agents)
- ✅ CORS with restricted origins
- ✅ Zod schema validation
- ✅ SQL injection prevention (Prisma parameterized queries)
- ⚠️ No rate limiting (Fastify plugin ready for Fase 2)
- ⚠️ HTTP only (HTTPS behind reverse proxy in production)

### Future (Fase 2)
- Rate limiting per token
- Token expiry and refresh
- HTTPS/TLS enforcement
- Audit logging for link changes
- Optional OAuth for web UI

## Data Flow Examples

### User Creates Link via Web UI

1. Frontend form → Vue component state
2. API call: `POST /api/v1/links`
3. Fastify validates via Zod
4. Prisma creates record (+ auto-update search_vector trigger)
5. Response returns created link with ID
6. Frontend updates Pinia store
7. UI re-renders

### Hermes Agent Saves Link via API

1. Hermes receives command: `/save_link https://example.com Title`
2. HTTP POST: `POST /api/v1/links` + Bearer token
3. Fastify auth middleware validates token
4. Link created in PostgreSQL
5. Response: `{ success: true, data: { id: 42, ... } }`
6. Hermes confirms to user: "✅ Link saved!"

### Full-Text Search Query

1. User types in search box
2. Debounced API call: `GET /api/v1/links/search?q=python`
3. PostgreSQL executes FTS query on `search_vector` column
4. Results returned with relevance ranking
5. Frontend displays results

## Performance Optimizations

### Database
- **Indexes** on commonly filtered columns (created_at, url, tag_id)
- **GIN index** on full-text search vector
- **Connection pooling** via Prisma (default 10 connections)

### API
- **HTTP/2** support via Fastify
- **Gzip compression** via helmet
- **Response pagination** (default: 20 items)

### Frontend
- **Lazy loading** of components
- **Code splitting** via Vite
- **Pinia stores** for efficient state management

## Future Improvements

### Fase 2
1. **OpenViking Integration** — Embeddings for semantic search
2. **Browser Extension** — Save links directly from browser
3. **Export/Import** — Backup and Raindrop/Pocket migration
4. **Analytics** — Track most-used links
5. **Sharing** — Public link collections

### Fase 3
1. **Collaborative Features** — Multi-user with permissions
2. **Advanced Search** — Filters, date ranges, advanced operators
3. **Integrations** — Slack, Discord, RSS webhooks
4. **Mobile App** — React Native version

## Testing Strategy

### Unit Tests (Vitest)
- Validation schemas (Zod)
- Search logic
- Tag operations

### Integration Tests
- API endpoints + database
- Auth middleware
- Error handling

### E2E Tests (Puppeteer/Playwright)
- Complete user workflows
- Search and filtering
- Agent API calls

## Development Workflow

1. `npm install` in root (sets up workspaces)
2. Backend: `npm run db:push` to create schema
3. `npm run dev` to start both backend + frontend with hot-reload
4. Make changes → auto-reload in browser
5. `npm run build` for production build

## Monitoring & Logging

### Logging
- Pino logger in backend
- Structured JSON logs for production
- Log level configurable via `LOG_LEVEL` env var

### Metrics (Future)
- Link creation rate
- API response times
- Database query performance
- Agent API token usage
