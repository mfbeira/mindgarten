# LinkVault API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <your-api-token>
```

Or via query parameter:

```
GET /api/v1/links?token=<your-api-token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## Endpoints

### Links

#### GET /links

List all links with pagination and filtering.

**Query Parameters:**
- `skip` (number, default: 0) — Pagination offset
- `take` (number, default: 20) — Items per page
- `tag` (number) — Filter by tag ID
- `search` (string) — Search query (full-text)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "url": "https://example.com",
      "title": "Example",
      "description": "Description",
      "tags": [
        { "id": 1, "name": "tech" }
      ],
      "createdAt": "2026-09-25T10:30:00Z",
      "updatedAt": "2026-09-25T10:30:00Z"
    }
  ],
  "total": 100,
  "skip": 0,
  "take": 20
}
```

#### POST /links

Create a new link.

**Request Body:**
```json
{
  "url": "https://example.com",
  "title": "Example Site",
  "description": "Optional description",
  "tags": [1, 2, 3]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 42,
    "url": "https://example.com",
    "title": "Example Site",
    "tags": [
      { "id": 1, "name": "tech" }
    ],
    "createdAt": "2026-09-25T10:30:00Z"
  }
}
```

#### GET /links/:id

Get a specific link by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "url": "https://example.com",
    "title": "Example Site",
    "description": "Optional description",
    "tags": [
      { "id": 1, "name": "tech" }
    ],
    "createdAt": "2026-09-25T10:30:00Z",
    "updatedAt": "2026-09-25T10:30:00Z"
  }
}
```

#### PUT /links/:id

Update a link.

**Request Body:**
```json
{
  "title": "New Title",
  "description": "New description",
  "tags": [1, 2]
}
```

**Response:** `200 OK`

#### DELETE /links/:id

Delete a link.

**Response:** `204 No Content`

#### GET /links/search?q=

Full-text search links.

**Query Parameters:**
- `q` (string, required) — Search query

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "url": "https://example.com",
      "title": "Example",
      "tags": []
    }
  ],
  "query": "example",
  "total": 5
}
```

#### GET /links/tag/:tagId

Get all links with a specific tag.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "url": "https://example.com",
      "title": "Example",
      "tags": [
        { "id": 1, "name": "tech" }
      ]
    }
  ]
}
```

### Tags

#### GET /tags

List all tags.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "tech",
      "color": "#0f62fe",
      "description": "Technology articles"
    }
  ],
  "total": 10
}
```

#### POST /tags

Create a new tag.

**Request Body:**
```json
{
  "name": "learning",
  "color": "#0f62fe",
  "description": "Educational content"
}
```

**Response:** `201 Created`

#### GET /tags/:id

Get a specific tag.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "tech",
    "color": "#0f62fe",
    "description": "Technology articles"
  }
}
```

#### PUT /tags/:id

Update a tag.

**Request Body:**
```json
{
  "name": "technology",
  "color": "#0043ce"
}
```

**Response:** `200 OK`

#### DELETE /tags/:id

Delete a tag.

**Response:** `204 No Content`

## Error Handling

Errors are returned with appropriate HTTP status codes:

```json
{
  "success": false,
  "error": "Invalid URL format"
}
```

**Common Status Codes:**
- `400` — Bad Request (validation error)
- `401` — Unauthorized (missing/invalid token)
- `404` — Not Found
- `500` — Internal Server Error

## Rate Limiting

(To be implemented in Fase 2)

Currently unlimited. Future versions will include rate limiting.

## Versioning

API version is in the URL: `/api/v1/`

Future breaking changes will bump to `/api/v2/`

## Examples

### Add a link from Hermes Agent

```bash
curl -X POST http://localhost:3000/api/v1/links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://docs.python.org",
    "title": "Python Documentation",
    "tags": [1]
  }'
```

### Search links

```bash
curl "http://localhost:3000/api/v1/links/search?q=python" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by tag

```bash
curl "http://localhost:3000/api/v1/links/tag/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
