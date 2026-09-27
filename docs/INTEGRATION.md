# MindGarten — Guia de Integração para Agentes

## Visão Geral

MindGarten expõe uma REST API simples. Qualquer agente que consiga fazer requests HTTP pode salvar, buscar e listar links.

**Base URL (local):** `http://localhost:3000`  
**Base URL (CasaOS, outros containers):** `http://192.168.0.5:3000` *(ajuste o IP)*

---

## Autenticação

Todas as rotas `/api/v1/*` exigem token. Envie via header:

```
Authorization: Bearer <token>
```

Ou via query param (mais simples em scripts):

```
GET /api/v1/links?token=<token>
```

### Tokens simples (env var)

No `.env` do backend:
```
API_TOKEN="mindgarten-dev-token"
```
Qualquer request com esse token passa. O `createdBy` dos links será `"user"`.

### Tokens nomeados (para agentes — recomendado)

Registre um token com nome no banco para que os links criados pelo agente sejam marcados com `createdBy: "hermes"` (ou o nome que você der).

O MindGarten já vem com um script pronto para cadastrar os tokens dos agentes:

```bash
cd backend
npm run db:seed
```

Isso cadastra automaticamente:
- **Hermes**: `token="hermes-agent-token"`, `name="hermes"`
- **Pi Agent**: `token="pi-agent-token"`, `name="pi-agent"`

Qualquer link criado com `hermes-agent-token` terá `createdBy: "hermes"` e registrará o timestamp de `lastUsed`.

Você também pode verificar ou testar a qualquer momento rodando:
```bash
python integrations/hermes/test_hermes.py
```

---

## Endpoints disponíveis

### Health (sem auth)
```
GET /health   → { status, version, timestamp }
GET /ready    → { status, database }
```

### Links

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/api/v1/links` | Lista com paginação, busca e filtro |
| `GET` | `/api/v1/links/:id` | Busca por ID |
| `GET` | `/api/v1/links/search?q=` | Busca por texto |
| `GET` | `/api/v1/links/tag/:tagId` | Filtra por tag |
| `POST` | `/api/v1/links` | Cria link |
| `PUT` | `/api/v1/links/:id` | Atualiza link |
| `DELETE` | `/api/v1/links/:id` | Remove link |

#### Parâmetros de listagem (`GET /api/v1/links`)

| Query param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `skip` | number | 0 | Offset de paginação |
| `take` | number | 20 | Máximo por página (max 100) |
| `search` | string | — | Busca em title, description, url |
| `tag` | number/string | — | Filtro por tag ID ou nome |
| `sort` | string | newest | `newest`, `oldest`, `alphabetical` |

### Tags

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/api/v1/tags` | Lista todas as tags com contagem de links |
| `GET` | `/api/v1/tags/:id` | Busca tag por ID |
| `POST` | `/api/v1/tags` | Cria tag |
| `PUT` | `/api/v1/tags/:id` | Atualiza tag |
| `DELETE` | `/api/v1/tags/:id` | Remove tag (desvincula links) |

---

## Exemplos curl — Primeira Integração

### Verificar se a API está online

```bash
curl http://localhost:3000/health
```

### Salvar um link (mínimo)

```bash
curl -X POST http://localhost:3000/api/v1/links \
  -H "Authorization: Bearer mindgarten-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://fastify.dev"}'
```

### Salvar um link com tags (por nome — cria se não existir)

```bash
curl -X POST http://localhost:3000/api/v1/links \
  -H "Authorization: Bearer mindgarten-dev-token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/fastify/fastify",
    "title": "Fastify no GitHub",
    "description": "Framework web rápido para Node.js",
    "tags": ["dev", "nodejs", "backend"]
  }'
```

### Buscar links

```bash
curl "http://localhost:3000/api/v1/links/search?q=fastify" \
  -H "Authorization: Bearer mindgarten-dev-token"
```

### Listar links mais recentes

```bash
curl "http://localhost:3000/api/v1/links?take=10" \
  -H "Authorization: Bearer mindgarten-dev-token"
```

### Listar links criados pelo Hermes

```bash
# Não há filtro por createdBy na API (ainda) — filtrar client-side:
curl "http://localhost:3000/api/v1/links?take=50" \
  -H "Authorization: Bearer mindgarten-dev-token" \
  | jq '.data[] | select(.createdBy == "hermes")'
```

---

## Integração com Hermes (JavaScript/TypeScript)

Adicione ao environment do Hermes:

```bash
MINDGARTEN_URL=http://localhost:3000
MINDGARTEN_TOKEN=hermes-token-aqui
```

Funções prontas para usar:

```typescript
const BASE = process.env.MINDGARTEN_URL || 'http://localhost:3000';
const TOKEN = process.env.MINDGARTEN_TOKEN!;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

export async function saveLink(
  url: string,
  opts: { title?: string; description?: string; tags?: string[] } = {}
) {
  const res = await fetch(`${BASE}/api/v1/links`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, ...opts }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data; // { id, url, title, tags, createdBy, ... }
}

export async function searchLinks(query: string, take = 10) {
  const res = await fetch(
    `${BASE}/api/v1/links/search?q=${encodeURIComponent(query)}`,
    { headers }
  );
  const json = await res.json();
  return json.data as Array<{ id: number; url: string; title: string; tags: Array<{ name: string }> }>;
}

export async function listLinks(opts: { tag?: string; take?: number } = {}) {
  const q = new URLSearchParams({ take: String(opts.take ?? 20) });
  if (opts.tag) q.set('tag', opts.tag);
  const res = await fetch(`${BASE}/api/v1/links?${q}`, { headers });
  const json = await res.json();
  return json.data;
}

export async function getTags() {
  const res = await fetch(`${BASE}/api/v1/tags`, { headers });
  const json = await res.json();
  return json.data as Array<{ id: number; name: string; color: string; linkCount: number }>;
}
```

### Resposta padrão de `saveLink`

```json
{
  "id": 1,
  "url": "https://fastify.dev",
  "title": "fastify.dev",
  "description": null,
  "faviconUrl": "https://www.google.com/s2/favicons?domain=...",
  "createdAt": "2026-09-25T10:00:00.000Z",
  "updatedAt": "2026-09-25T10:00:00.000Z",
  "createdBy": "hermes",
  "tags": []
}
```

### Tratamento de duplicatas

Se a URL já existe, a API retorna `409 Conflict` com o link existente no campo `data`. O Hermes pode usar isso para fazer upsert de tags:

```typescript
try {
  return await saveLink(url, opts);
} catch (err: any) {
  if (err.message.includes('already exists')) {
    // link já salvo — pode atualizar tags se necessário
    return err.data;
  }
  throw err;
}
```

---

## Rede — Endereços por contexto

| Contexto | URL da API |
|---|---|
| Dev local (Windows) | `http://localhost:3000` |
| Frontend no Docker | `http://backend:3000` *(service name)* |
| Hermes no Docker (mesma rede) | `http://mindgarten-api:3000` |
| Hermes no Docker (rede diferente) | `http://192.168.0.X:3000` |
| CasaOS → API | `http://mindgarten-api:3000` ou IP da máquina |

---

## Troubleshooting

**401 Unauthorized**
- Verifique o token: `curl http://localhost:3000/health` (sem auth) deve funcionar
- Confirme o header: `Authorization: Bearer <token>` (sem espaços extras)

**409 Conflict ao salvar link**
- URL já existe no banco — use o campo `data` na resposta para obter o link existente

**CORS error no browser**
- Verifique `CORS_ORIGIN` no `.env` — deve incluir a origem do frontend

**Connection refused / timeout**
- Backend rodando? `curl http://localhost:3000/health`
- Docker: `docker-compose logs backend`
- Banco pronto? `curl http://localhost:3000/ready`
