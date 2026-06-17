
---

## Y3: External Integration Points

QuickNotes has minimal external dependencies. This document catalogs every integration point outside the Next.js application process itself.

---

### §PostgreSQL Database

| Property | Value |
|----------|-------|
| **Role** | Primary (and sole) data store |
| **Connection** | Via `DATABASE_URL` environment variable |
| **Protocol** | PostgreSQL wire protocol (TCP, typically port 5432) |
| **Driver** | `pg` (node-postgres) or compatible PostgreSQL client for Node.js |
| **Used by** | F05 (all CRUD API endpoints), F07 (auto-migration) |
| **Required at startup** | Yes — migration must succeed before server accepts requests |
| **Required at runtime** | Yes — all API endpoints require an active DB connection |

**Connection string format:**
```
postgresql://<user>:<password>@<host>:<port>/<database>
```
or the `DATABASE_URL` alias accepted by most PostgreSQL clients:
```
postgres://<user>:<password>@<host>:<port>/<database>
```

**Environment variable:** `DATABASE_URL` — must be set in the runtime environment. Must not appear in source code, `.env` files committed to version control, or Docker image layers.

**Error handling:**
- Missing `DATABASE_URL` → process exit at startup (see F07)
- Connection refused / timeout → startup migration fails → process exit (see F07)
- Query error at runtime → `500 INTERNAL_ERROR` returned to API caller

---

### §Node.js Runtime

| Property | Value |
|----------|-------|
| **Role** | Application runtime |
| **Minimum version** | Node.js ≥ 18 (required by Next.js 14) |
| **Provided by** | Host environment / container base image |
| **Used by** | Entire application |

---

### §Preview / Iframe Host

| Property | Value |
|----------|-------|
| **Role** | Embeds the QuickNotes app in an iframe for preview |
| **Integration type** | HTTP iframe embedding (no API contract) |
| **Requirement** | App must not emit frame-blocking HTTP headers (see F09) |
| **Port** | App must listen on `0.0.0.0:3000` |

---

### §No Other Integrations

The QuickNotes MVP has no other external integration points. Specifically, the following are **not** used:

- No authentication providers (no OAuth, no SAML, no magic-link services)
- No email or SMS services
- No object storage (no file uploads)
- No CDN or edge cache layer
- No analytics or telemetry services
- No AI / LLM services
- No message queues or background job runners
- No search engines (Elasticsearch, Algolia, etc.) — search is handled by PostgreSQL `ILIKE`

---
