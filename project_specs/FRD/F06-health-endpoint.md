
---

## F06: Health Endpoint (`GET /api/health`)

**Description:** A lightweight liveness-check endpoint returns a fixed JSON payload to confirm the application process is alive and serving requests. It performs no database query (liveness only — not a readiness check). Orchestration platforms, load balancers, CI smoke tests, and the project definition all require this endpoint.

**Terminology:**
- **Liveness check:** Confirms the process is running and can accept HTTP connections; does *not* verify database connectivity
- **Readiness check:** (Out of scope) Would verify the database connection is healthy; not required here

**Sub-features:**
- Fixed `200` JSON response with `{"status":"ok"}`
- No database interaction
- Sub-200 ms response time under normal conditions

**Process:**
1. Any HTTP client sends `GET /api/health`.
2. Route Handler returns HTTP `200` with body `{"status":"ok"}` and header `Content-Type: application/json`.
3. No database query is performed.
4. No authentication or authorization is required.

**Inputs:**
- None — no query parameters, path parameters, or request body

**Outputs:**
- HTTP `200 OK`
- `Content-Type: application/json`
- Body: `{"status":"ok"}`

**Validation:**
- The endpoint must respond regardless of database state (it must not fail if the database is temporarily unreachable)
- Must not require any request headers (no auth, no special content-type)
- Must respond to `GET` requests only (other methods may return `405 Method Not Allowed`)

**Error States:**

| Scenario | HTTP Status | Notes |
|----------|-------------|-------|
| Non-GET method (e.g., POST) | 405 | Next.js default behaviour for unhandled methods |
| Application startup incomplete | Unreachable (no HTTP server yet) | Not an endpoint error — process not yet listening |

**API Surface (this feature):** `GET /api/health` — full spec in `Y1-api.md §GET /api/health`.

**Schema Surface (this feature):** None — no database tables accessed.

---
