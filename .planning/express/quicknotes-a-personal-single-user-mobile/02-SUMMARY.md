---
phase: quicknotes
plan: "02"
subsystem: api-routes
tags: [rest-api, next-js, app-router, crud, parameterized-queries]
dependency_graph:
  requires: [lib/db.js (Wave 1), instrumentation.js (Wave 1)]
  provides: [app/api/health/route.js, app/api/notes/route.js, "app/api/notes/[id]/route.js"]
  affects: [Wave 3 frontend, Wave 4 integration tests]
tech_stack:
  patterns: [Next.js 14 App Router route handlers, parameterized pg queries, named async function exports]
key_files:
  created:
    - app/api/health/route.js
    - app/api/notes/route.js
    - "app/api/notes/[id]/route.js"
  modified: []
decisions:
  - "DELETE 204 uses new Response(null, { status: 204 }) — not Response.json() to avoid sending a body"
  - "Non-integer id path param returns 404 NOTE_NOT_FOUND (not 400) per spec"
  - "POST /api/notes returns 201 (not 200) on successful creation"
  - "query imported from lib/db.js — no direct pg instantiation in route files"
  - "parseId() helper centralizes integer validation across all three /[id] handlers"
metrics:
  duration: "~5 minutes"
  completed: "2026-06-17"
  tasks_completed: 2
  files_created: 3
---

# Phase quicknotes Plan 02: REST API Handlers Summary

**One-liner:** Six REST API route handlers (health check + notes CRUD) using parameterized pg queries via lib/db.js with exact HTTP status codes per spec.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create health endpoint and notes collection endpoints | a09a6b0 | app/api/health/route.js, app/api/notes/route.js |
| 2 | Create notes item endpoint (GET, PUT, DELETE /api/notes/[id]) | 926279a | app/api/notes/[id]/route.js |

## Files Created

### app/api/health/route.js
- `GET /api/health` → 200 `{"status":"ok"}`
- No database query — pure liveness check
- No imports from lib/db.js

### app/api/notes/route.js
- `GET /api/notes` → 200 `Note[]` sorted `pinned DESC, created_at DESC`
- `GET /api/notes?q=<term>` → 200 `Note[]` filtered by `ILIKE $1` on title (parameterized)
- `POST /api/notes` → 201 created Note; 400 `TITLE_REQUIRED` if title empty/missing; 400 `BAD_REQUEST` on malformed JSON
- Imports `query` from `../../../lib/db.js`

### app/api/notes/[id]/route.js
- `GET /api/notes/[id]` → 200 Note or 404 `NOTE_NOT_FOUND`; non-integer id → 404
- `PUT /api/notes/[id]` → 200 updated Note; 400 `TITLE_REQUIRED` on empty title; 404 `NOTE_NOT_FOUND` if not found
- `DELETE /api/notes/[id]` → 204 no body (`new Response(null, { status: 204 })`); 404 `NOTE_NOT_FOUND` if not found
- `parseId()` helper validates positive integers, rejects non-digit strings returning null
- Imports `query` from `../../../../lib/db.js`

## Key Decisions

1. **DELETE 204 via `new Response(null, { status: 204 })`** — `Response.json()` sends a body which violates HTTP spec for 204 No Content.

2. **Non-integer id → 404 not 400** — spec requires `NOTE_NOT_FOUND` for both missing notes and invalid id formats; this unifies the "resource doesn't exist" concept.

3. **POST returns 201** — spec-accurate; creation vs retrieval semantics.

4. **`query` imported from `lib/db.js`** — Wave 1 contract consumed; no pg Pool instantiation in route handlers.

5. **`parseId()` centralized helper** — avoids repeating integer validation logic across GET/PUT/DELETE in the dynamic route file.

## Integration Contracts Delivered

| Contract | Shape | Verify |
|----------|-------|--------|
| GET /api/health | `{ status: 'ok' }` → 200 | `grep 'export async function GET' app/api/health/route.js` |
| GET /api/notes | `Note[]` → 200; optional `?q=` ILIKE | `grep 'export async function GET' app/api/notes/route.js` |
| POST /api/notes | `Note` → 201 \| `TITLE_REQUIRED` → 400 | `grep 'export async function POST' app/api/notes/route.js` |
| GET /api/notes/[id] | `Note` → 200 \| `NOTE_NOT_FOUND` → 404 | `grep 'export async function GET' "app/api/notes/[id]/route.js"` |
| PUT /api/notes/[id] | `Note` → 200 \| `TITLE_REQUIRED` → 400 \| `NOTE_NOT_FOUND` → 404 | `grep 'export async function PUT' "app/api/notes/[id]/route.js"` |
| DELETE /api/notes/[id] | 204 no body \| `NOTE_NOT_FOUND` → 404 | `grep 'new Response(null' "app/api/notes/[id]/route.js"` |

## Deviations from Plan

None — plan executed exactly as written. All route handlers match the spec implementations provided in the plan verbatim.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| app/api/health/route.js exists | ✅ FOUND |
| app/api/notes/route.js exists | ✅ FOUND |
| app/api/notes/[id]/route.js exists | ✅ FOUND |
| Commit a09a6b0 exists | ✅ FOUND |
| Commit 926279a exists | ✅ FOUND |
