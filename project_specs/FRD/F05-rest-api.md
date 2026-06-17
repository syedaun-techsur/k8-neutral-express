
---

## F05: REST API

**Description:** The REST API is a set of Next.js App Router Route Handler files under `app/api/` that back all UI interactions and are directly callable for testing or integration. All endpoints operate on the `notes` PostgreSQL table, return `Content-Type: application/json`, and use standard HTTP status codes. Title validation (`non-empty after trim`) is enforced server-side on create and update operations. The full request/response schemas, including example bodies, are in `Y1-api.md`.

**Terminology:**
- **Route Handler:** Next.js App Router API file (`app/api/notes/route.ts` or `.js`); exports named `GET`, `POST`, etc. functions
- **`[id]` segment:** Dynamic route segment in `app/api/notes/[id]/route.ts` matching the note's integer primary key
- **Parameterized query:** SQL with `$1` placeholders — never string interpolation — to prevent SQL injection

**Sub-features:**
- `GET /api/notes` — list all (with optional search)
- `POST /api/notes` — create note
- `GET /api/notes/[id]` — fetch single note
- `PUT /api/notes/[id]` — update note
- `DELETE /api/notes/[id]` — delete note

**Process — GET /api/notes:**
1. Parse optional `?q=` query parameter.
2. If `q` is present and non-empty: `SELECT * FROM notes WHERE title ILIKE $1 ORDER BY pinned DESC, created_at DESC` with `'%'+q+'%'`.
3. If `q` is absent or empty: `SELECT * FROM notes ORDER BY pinned DESC, created_at DESC`.
4. Return `200` with JSON array (may be empty array `[]`).

**Process — POST /api/notes:**
1. Parse JSON request body: `{ title, body?, pinned? }`.
2. Trim `title`. If empty after trim, return `400 { "error": "TITLE_REQUIRED", "message": "Title is required" }`.
3. Coerce `pinned` to boolean (default `false` if absent).
4. `INSERT INTO notes (title, body, pinned) VALUES ($1, $2, $3) RETURNING *`.
5. Return `201` with the created note object.

**Process — GET /api/notes/[id]:**
1. Parse `id` from URL segment; coerce to integer. If not a valid positive integer, return `404`.
2. `SELECT * FROM notes WHERE id = $1`.
3. If no row: return `404 { "error": "NOTE_NOT_FOUND", "message": "Note not found" }`.
4. Return `200` with note object.

**Process — PUT /api/notes/[id]:**
1. Parse `id` from URL segment; coerce to integer. If invalid, return `404`.
2. `SELECT id FROM notes WHERE id = $1` — if no row, return `404`.
3. Parse JSON request body: `{ title, body?, pinned? }`.
4. Trim `title`. If empty, return `400 { "error": "TITLE_REQUIRED", "message": "Title is required" }`.
5. `UPDATE notes SET title = $1, body = $2, pinned = $3 WHERE id = $4 RETURNING *`.
6. Return `200` with updated note object.

**Process — DELETE /api/notes/[id]:**
1. Parse `id` from URL segment; coerce to integer. If invalid, return `404`.
2. `DELETE FROM notes WHERE id = $1 RETURNING id`.
3. If no row deleted: return `404 { "error": "NOTE_NOT_FOUND", "message": "Note not found" }`.
4. Return `204` with no response body.

**Inputs (summary):**

| Endpoint | Input | Type | Required |
|----------|-------|------|----------|
| GET /api/notes | `q` (query param) | string | No |
| POST /api/notes | `title` (body) | string | Yes |
| POST /api/notes | `body` (body) | string | No |
| POST /api/notes | `pinned` (body) | boolean | No (default false) |
| GET /api/notes/[id] | `id` (path) | integer | Yes |
| PUT /api/notes/[id] | `id` (path) | integer | Yes |
| PUT /api/notes/[id] | `title` (body) | string | Yes |
| PUT /api/notes/[id] | `body` (body) | string | No |
| PUT /api/notes/[id] | `pinned` (body) | boolean | No |
| DELETE /api/notes/[id] | `id` (path) | integer | Yes |

**Outputs (summary):**

| Endpoint | Success Status | Response Body |
|----------|---------------|---------------|
| GET /api/notes | 200 | `Note[]` array (may be `[]`) |
| POST /api/notes | 201 | Created `Note` object |
| GET /api/notes/[id] | 200 | Single `Note` object |
| PUT /api/notes/[id] | 200 | Updated `Note` object |
| DELETE /api/notes/[id] | 204 | *(no body)* |

**Note object shape:**
```json
{
  "id": 1,
  "title": "My note",
  "body": "Some content",
  "pinned": false,
  "created_at": "2026-06-17T10:00:00.000Z"
}
```

**Validation:**
- `title` must be non-empty after `.trim()` on POST and PUT — server returns `400` otherwise
- `id` path parameter must parse as a positive integer — invalid values return `404`
- `pinned` defaults to `false` if absent or `null`
- `body` accepts any string value including empty string and `null` (stored as `NULL` in DB)
- All requests must be `Content-Type: application/json` on POST/PUT (or the body is treated as empty)
- `GET /api/notes` and `DELETE /api/notes/[id]` have no request body

**Error States:**

| Scenario | HTTP Status | Error Code | Notes |
|----------|-------------|------------|-------|
| Title missing/empty on create | 400 | `TITLE_REQUIRED` | POST /api/notes |
| Title missing/empty on update | 400 | `TITLE_REQUIRED` | PUT /api/notes/[id] |
| Note not found (GET) | 404 | `NOTE_NOT_FOUND` | GET /api/notes/[id] |
| Note not found (PUT) | 404 | `NOTE_NOT_FOUND` | PUT /api/notes/[id] |
| Note not found (DELETE) | 404 | `NOTE_NOT_FOUND` | DELETE /api/notes/[id] |
| Invalid `id` (non-integer) | 404 | `NOTE_NOT_FOUND` | All /[id] routes |
| Database error | 500 | `INTERNAL_ERROR` | Any endpoint |
| Malformed JSON body | 400 | `BAD_REQUEST` | POST, PUT |

**API Surface (this feature):** Full request/response schemas and example payloads in `Y1-api.md`.

**Schema Surface (this feature):** All CRUD operations on `notes` table — see `Y0-schema.md §notes`.

---
