
---

## Y1: REST API Endpoints (Full Specification)

**Base path:** `/api`
**Content-Type:** All responses are `application/json` (except `204 No Content` which has no body).
**Authentication:** None — single-user MVP, no auth required.
**Framework:** Next.js 14 App Router Route Handlers (`app/api/*/route.ts` or `.js`).

---

### Note Object Schema

All endpoints that return a note use this object shape:

```json
{
  "id": 1,
  "title": "My note title",
  "body": "Optional body content",
  "pinned": false,
  "created_at": "2026-06-17T10:30:00.000Z"
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | integer | No | Auto-assigned primary key |
| `title` | string | No | Note title (always non-empty) |
| `body` | string \| null | Yes | Note body content |
| `pinned` | boolean | No | `true` if note is pinned |
| `created_at` | ISO 8601 string | No | UTC creation timestamp |

---

### Error Response Schema

All error responses use:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

---

### §GET /api/health

**Purpose:** Liveness check — confirms process is alive. See F06.

**Request:**
- Method: `GET`
- Path: `/api/health`
- Query params: none
- Body: none

**Response:**

| Status | Body | Notes |
|--------|------|-------|
| 200 | `{"status":"ok"}` | Always — no DB query |

---

### §GET /api/notes

**Purpose:** Return all notes, sorted pinned-first then newest-first. Optionally filter by title. See F05.

**Request:**
- Method: `GET`
- Path: `/api/notes`
- Query params:
  - `q` (string, optional): case-insensitive substring filter on `title`
- Body: none

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `Note[]` (may be `[]`) | Always on success |
| 500 | Error object | Database error |

**Example — no filter:**
```
GET /api/notes
→ 200
[
  { "id": 3, "title": "Pinned note", "body": null, "pinned": true, "created_at": "2026-06-17T09:00:00.000Z" },
  { "id": 2, "title": "Second note", "body": "Some content", "pinned": false, "created_at": "2026-06-17T08:00:00.000Z" },
  { "id": 1, "title": "First note", "body": null, "pinned": false, "created_at": "2026-06-17T07:00:00.000Z" }
]
```

**Example — with filter:**
```
GET /api/notes?q=first
→ 200
[
  { "id": 1, "title": "First note", "body": null, "pinned": false, "created_at": "2026-06-17T07:00:00.000Z" }
]
```

---

### §POST /api/notes

**Purpose:** Create a new note. See F02, F05.

**Request:**
- Method: `POST`
- Path: `/api/notes`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "title": "My new note",
  "body": "Optional content",
  "pinned": false
}
```

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `title` | string | Yes | — | Non-empty after `.trim()` |
| `body` | string | No | `null` | Any string or null |
| `pinned` | boolean | No | `false` | Must be boolean if provided |

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| 201 | Created `Note` object | Success |
| 400 | `{"error":"TITLE_REQUIRED","message":"Title is required"}` | `title` is missing or empty after trim |
| 400 | `{"error":"BAD_REQUEST","message":"Invalid request body"}` | Malformed JSON |
| 500 | Error object | Database error |

**Example:**
```
POST /api/notes
{ "title": "Meeting notes", "body": "Action items: ...", "pinned": true }
→ 201
{ "id": 4, "title": "Meeting notes", "body": "Action items: ...", "pinned": true, "created_at": "2026-06-17T11:00:00.000Z" }
```

---

### §GET /api/notes/[id]

**Purpose:** Fetch a single note by its integer ID. See F03, F05.

**Request:**
- Method: `GET`
- Path: `/api/notes/{id}` where `{id}` is a positive integer
- Query params: none
- Body: none

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `Note` object | Note found |
| 404 | `{"error":"NOTE_NOT_FOUND","message":"Note not found"}` | No note with that id; or `id` is not a valid integer |
| 500 | Error object | Database error |

**Example:**
```
GET /api/notes/4
→ 200
{ "id": 4, "title": "Meeting notes", "body": "Action items: ...", "pinned": true, "created_at": "2026-06-17T11:00:00.000Z" }
```

---

### §PUT /api/notes/[id]

**Purpose:** Update an existing note's fields. All three writable fields (`title`, `body`, `pinned`) must be supplied. See F03, F05.

**Request:**
- Method: `PUT`
- Path: `/api/notes/{id}` where `{id}` is a positive integer
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "title": "Updated title",
  "body": "Updated content",
  "pinned": true
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | Non-empty after `.trim()` |
| `body` | string | No | Any string or null |
| `pinned` | boolean | No | Must be boolean if provided |

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| 200 | Updated `Note` object | Success |
| 400 | `{"error":"TITLE_REQUIRED","message":"Title is required"}` | `title` empty after trim |
| 400 | `{"error":"BAD_REQUEST","message":"Invalid request body"}` | Malformed JSON |
| 404 | `{"error":"NOTE_NOT_FOUND","message":"Note not found"}` | No note with that id; or invalid id |
| 500 | Error object | Database error |

**Example:**
```
PUT /api/notes/4
{ "title": "Meeting notes (updated)", "body": "Revised action items", "pinned": false }
→ 200
{ "id": 4, "title": "Meeting notes (updated)", "body": "Revised action items", "pinned": false, "created_at": "2026-06-17T11:00:00.000Z" }
```

*Note: `created_at` is never updated by a PUT operation.*

---

### §DELETE /api/notes/[id]

**Purpose:** Permanently delete a note. See F04, F05.

**Request:**
- Method: `DELETE`
- Path: `/api/notes/{id}` where `{id}` is a positive integer
- Query params: none
- Body: none

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| 204 | *(no body)* | Note deleted successfully |
| 404 | `{"error":"NOTE_NOT_FOUND","message":"Note not found"}` | No note with that id; or invalid id |
| 500 | Error object | Database error |

**Example:**
```
DELETE /api/notes/4
→ 204 (no body)
```

---

### §Routing File Layout

```
app/
  api/
    health/
      route.ts       ← GET /api/health
    notes/
      route.ts       ← GET /api/notes, POST /api/notes
      [id]/
        route.ts     ← GET /api/notes/[id], PUT /api/notes/[id], DELETE /api/notes/[id]
```

---
