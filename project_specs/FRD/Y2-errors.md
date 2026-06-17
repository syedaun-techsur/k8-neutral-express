
---

## Y2: Cross-Feature Error Catalog

This catalog lists every defined error state across all QuickNotes features. Errors are grouped by HTTP status code, then by error code. All API error responses use the shape: `{ "error": "<ERROR_CODE>", "message": "<human text>" }`.

---

### HTTP 400 Bad Request

| Error Code | Message | Trigger | Feature |
|------------|---------|---------|---------|
| `TITLE_REQUIRED` | "Title is required" | `title` is absent or empty after `.trim()` on POST /api/notes or PUT /api/notes/[id] | F02, F03, F05 |
| `BAD_REQUEST` | "Invalid request body" | Request body is not valid JSON on POST or PUT | F05 |

---

### HTTP 404 Not Found

| Error Code | Message | Trigger | Feature |
|------------|---------|---------|---------|
| `NOTE_NOT_FOUND` | "Note not found" | No `notes` row with the given `id`; or `id` is not a valid positive integer | F03, F04, F05 |

---

### HTTP 405 Method Not Allowed

| Error Code | Message | Trigger | Feature |
|------------|---------|---------|---------|
| *(Next.js default)* | *(framework default)* | HTTP method not exported from Route Handler (e.g., POST to `/api/health`) | F06 |

---

### HTTP 500 Internal Server Error

| Error Code | Message | Trigger | Feature |
|------------|---------|---------|---------|
| `INTERNAL_ERROR` | "Internal server error" | Unhandled exception, database connection lost, or unexpected query failure | All API endpoints |

---

### Client-Side Errors (no HTTP call made)

| Context | Trigger | User-visible message | Feature |
|---------|---------|----------------------|---------|
| Create form — title empty | `title.trim() === ''` before POST | "Title is required" | F02 |
| Edit form — title empty | `title.trim() === ''` before PUT | "Title is required" | F03 |
| Network error (fetch throws) | `fetch()` rejects (offline, DNS, timeout) | "Something went wrong. Please try again." | F02, F03, F04 |

---

### Startup / Infrastructure Errors (non-HTTP)

| Scenario | Behaviour | Log output | Feature |
|----------|-----------|------------|---------|
| `DATABASE_URL` not set | Process exits (non-zero) | "DATABASE_URL environment variable is not set" | F07 |
| Database unreachable at startup | Process exits (non-zero) | "Migration failed: [connection error details]" | F07 |
| `next.config.ts` present | Next.js hard startup error | Next.js internal error (TypeScript config parse failure) | F09 |

---

### Error Handling Principles

1. **Never swallow errors silently.** All caught exceptions must be either returned to the client as `500` or logged and re-thrown.
2. **API errors always include both `error` (machine-readable code) and `message` (human-readable text).**
3. **`204` responses have no body** — do not attempt to parse them as JSON on the client.
4. **Client-side error banners** must not overwrite form field values — the user should be able to correct the input and resubmit.
5. **Startup errors** cause process exit to ensure the orchestration layer restarts the container; silent startup failures are not acceptable.

---
