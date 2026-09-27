---
name: mindgarten-bookmarks
description: Save, search, and list bookmarks in MindGarten vault.
version: 0.1.0
author: ""
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [bookmarks, links, mindgarten, vault, web]
---

# MindGarten Bookmarks Skill

## Overview

MindGarten is a self-hosted personal bookmark vault. This skill allows Hermes Agent to save links, search existing bookmarks, and list links with categorization tags.

## When to Use

- User asks to save, bookmark, or remember a URL or article.
- User asks to search saved links, bookmarks, or web references.
- User asks to list recent links or filter links by topic/tag.

## Configuration & Environment

Set the following environment variables in Hermes or your environment:

- `MINDGARTEN_URL`: Base URL of the API.
  - Local PC dev: `http://localhost:3000`
  - Docker on CasaOS (same network): `http://mindgarten-api:3000`
  - Docker on CasaOS (external/host): `http://192.168.0.5:3000`
- `MINDGARTEN_TOKEN`: Authentication Bearer token.
  - Default agent token: `hermes-agent-token`

## Usage via CLI Helper

If `mindgarten.py` is available in PATH or current directory:

### 1. Save a Link
```bash
python mindgarten.py save "https://example.com/article" --title "Article Title" --desc "Key takeaways" --tags "ai,research"
```

### 2. Search Bookmarks
```bash
python mindgarten.py search "machine learning"
```

### 3. List Recent Bookmarks
```bash
python mindgarten.py list --take 10 --tag "ai"
```

### 4. Check Health
```bash
python mindgarten.py health
```

---

## Direct Usage via cURL / HTTP REST

If the CLI script is not available, execute direct HTTP requests:

### Save Link (POST /api/v1/links)
```bash
curl -s -X POST "${MINDGARTEN_URL}/api/v1/links" \
  -H "Authorization: Bearer ${MINDGARTEN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "title": "Example Title",
    "description": "Notes about this link",
    "tags": ["ai", "dev"]
  }'
```

### Search Links (GET /api/v1/links/search?q=...)
```bash
curl -s -G "${MINDGARTEN_URL}/api/v1/links/search" \
  -H "Authorization: Bearer ${MINDGARTEN_TOKEN}" \
  --data-urlencode "q=query"
```

### List Recent Links (GET /api/v1/links?take=10)
```bash
curl -s "${MINDGARTEN_URL}/api/v1/links?take=10" \
  -H "Authorization: Bearer ${MINDGARTEN_TOKEN}"
```

## Response Handling

- **201 / 200 Created/OK**: The bookmark was saved or returned successfully.
- **409 Conflict**: Link is already in vault; the response body contains the existing link `data`. Report to user that it is already saved.
- **401 Unauthorized**: Check that `MINDGARTEN_TOKEN` matches the token in MindGarten database.
