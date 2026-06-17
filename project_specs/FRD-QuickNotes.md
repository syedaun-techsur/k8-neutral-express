# Functional Requirements Document — QuickNotes

**Project:** QuickNotes
**Acronym:** QN
**Version:** 1.0
**Date:** 2026-06-17
**Status:** Active
**Based on:** PRD-QuickNotes v1.0

---

## Scope

This FRD specifies the precise functional behaviour of every feature in the QuickNotes MVP. It is the authoritative reference for implementation: every input field, validation rule, HTTP status code, database column, and error state is defined here. The PRD defines *what* to build; this FRD defines *how* it behaves.

QuickNotes is a single-user, no-auth, mobile-first note-taking app. It has one data entity (`notes`), four CRUD operations, a health endpoint, a startup auto-migration, and a constrained deployment profile (iframe, port 3000, no frame-blocking headers).

---

## Conventions

- **Feature IDs** follow the PRD: `F0`–`F9`. In chunk filenames they are zero-padded (`F00`–`F09`).
- **HTTP methods** are written in ALL CAPS (`GET`, `POST`, `PUT`, `DELETE`).
- **Required fields** are marked `(required)`; optional fields `(optional)`.
- **Type notation:** `string`, `boolean`, `integer`, `timestamptz` match PostgreSQL / JSON types.
- **Error codes** are `SCREAMING_SNAKE_CASE` strings returned in JSON error bodies as `{ "error": "<code>", "message": "<human text>" }`.
- **"Non-empty"** means: after trimming leading/trailing whitespace, length ≥ 1 character.
- Cross-references use the form `see F03 §Process` or `see Y1-api.md §Notes`.

---

## Shared Terminology

| Term | Definition |
|------|-----------|
| **Note** | A single record in the `notes` table: title, optional body, pinned flag, creation timestamp |
| **Pinned** | Boolean flag; pinned notes sort above un-pinned notes in all list/search results |
| **Empty state** | The "No notes yet" UI shown when zero notes exist (or zero match a search) |
| **Auto-migration** | Idempotent `CREATE TABLE IF NOT EXISTS notes (...)` executed at server startup before requests are served |
| **Gold accent** | CSS colour `#FBCA5C` used sparingly (≤10% of any view's visual area) |
| **Near-black** | CSS colour `#0A0A0A` — primary text colour |
| **Mobile-first** | Styles target narrow viewports (≤375 px) first; wider viewports are enhanced via `min-width` media queries |
| **Tap target** | Minimum interactive-element hit area: 44 × 44 px |
| **DATABASE_URL** | Runtime environment variable providing the PostgreSQL connection string |
| **204** | HTTP 204 No Content — successful deletion response (no body) |
| **App Router** | Next.js 14 App Router (`app/` directory); not the Pages Router |

---

## Table of Contents

| Chunk | Feature | File |
|-------|---------|------|
| F00 | Note List View (`/`) | `F00-note-list-view.md` |
| F01 | Note Search / Filter | `F01-note-search-filter.md` |
| F02 | Create Note (`/notes/new`) | `F02-create-note.md` |
| F03 | Edit Note (`/notes/[id]/edit`) | `F03-edit-note.md` |
| F04 | Delete Note | `F04-delete-note.md` |
| F05 | REST API | `F05-rest-api.md` |
| F06 | Health Endpoint | `F06-health-endpoint.md` |
| F07 | Auto-Migration on Startup | `F07-auto-migration.md` |
| F08 | Mobile-First UI & Design System | `F08-mobile-first-ui.md` |
| F09 | Iframe Compatibility & Port Binding | `F09-iframe-compatibility.md` |
| Y0 | Database Schema (DDL) | `Y0-schema.md` |
| Y1 | API Endpoints (full spec) | `Y1-api.md` |
| Y2 | Cross-Feature Error Catalog | `Y2-errors.md` |
| Y3 | External Integration Points | `Y3-integrations.md` |

---

---

## F00: Note List View (`/`)

**Description:** The home page is the application's entry point. It fetches all notes from the database and renders them sorted by pinned status first (pinned notes at top), then by `created_at` descending (newest first) within each group. When the notes table contains zero rows, an empty-state message is displayed. Each note entry links to its edit page. A prominent link/button navigates to the create-note page.

**Terminology:**
- **Sort order:** pinned notes first (within pinned: newest first by `created_at DESC`), then un-pinned notes (newest first by `created_at DESC`)
- **Empty state:** Rendered when the `notes` table has zero rows *and* no search query is active

**Sub-features:**
- Sorted note list rendering
- Empty state display
- Per-note navigation link to edit page
- Navigation link/button to create-note page
- Page-level data fetch (server-side via App Router)

**Process:**
1. Server component renders `app/page.tsx` (or `app/page.js`).
2. On render, server queries: `SELECT * FROM notes ORDER BY pinned DESC, created_at DESC`.
3. If the result set is empty, render the empty-state message: **"No notes yet"**.
4. If results exist, render one card/row per note in returned order.
5. Each note card displays: `title` (text).
6. Each note card wraps in (or contains) an `<a>` or `<Link>` to `/notes/[id]/edit`.
7. A "New note" button/link pointing to `/notes/new` is rendered regardless of list content.
8. Page responds to the optional `?q=` query parameter for search (see F01).

**Inputs:**
- `q` (string, optional, URL query parameter): search filter string; forwarded to data query (see F01)

**Outputs:**
- HTML page containing:
  - Zero or more note cards, sorted pinned-first then newest-first
  - Empty state element if and only if zero notes match
  - "New note" navigation control
  - Search input pre-populated with current `q` value (see F01)

**Validation:**
- No user-submitted form data on this page; no input validation required
- The `q` parameter is passed as-is to the database `ILIKE` filter (parameterized query — no SQL injection risk)

**Error States:**

| Scenario | Behaviour | User-visible message |
|----------|-----------|----------------------|
| Database unavailable at render time | Page renders a server error state | "Could not load notes. Please try again." |
| `q` parameter present but DB query returns zero matches | Empty state rendered (same component as zero-row state) | "No notes yet" (or "No notes match your search") |

**API Surface (this feature):** This page is a server-rendered Next.js route; it calls the database directly (not via the REST API). The REST API for notes is documented in `Y1-api.md §GET /api/notes`.

**Schema Surface (this feature):** Reads all columns from `notes` table — see `Y0-schema.md §notes`.

---

---

## F01: Note Search / Filter

**Description:** A search input rendered at the top of the list view (`/`) allows the user to filter the visible notes by title. Filtering can be implemented either via URL query parameter (server-side, `?q=`) or via client-side JavaScript DOM filtering — both approaches are acceptable as long as the observable behaviour matches this spec. The pinned-first, newest-first sort order is preserved within filtered results. Clearing the input restores the full list.

**Terminology:**
- **Filter string:** The text typed into the search box; used for case-insensitive substring match against `title`
- **Client-side filtering:** Hiding/showing existing DOM note cards based on `title` text content without a network round-trip
- **Server-side filtering:** Re-fetching notes from DB with an `ILIKE '%q%'` clause when the URL `?q=` parameter changes

**Sub-features:**
- Search input rendered at top of list view
- Case-insensitive substring match on `title`
- Preserved sort order (pinned-first, newest-first) in filtered results
- Empty state when filter matches zero notes
- Restoring full list on input clear

**Process (required: keystroke-reactive — no Submit button):**

Filtering **must** respond to every keystroke without requiring the user to press Enter or click a Search button. Either implementation approach below satisfies this requirement.

**Implementation Option A — Client-side filtering (simplest):**
1. Server renders all notes on initial load.
2. JavaScript event listener attached to search `<input>` on `input` event.
3. On each `input` event, iterate note cards; hide any card whose `title` text does not contain the filter string (case-insensitive).
4. Show empty-state element if all cards are hidden; hide it when at least one card is visible.
5. On clear (empty string), show all cards; hide empty-state element.

**Implementation Option B — Server-side filtering via URL parameter:**
1. User types into the search `<input>` on `/`.
2. On input change with debounce (recommended: 150–300 ms), the URL is updated with `?q=<value>` via `router.push` or equivalent — **no form submit or Enter key required**.
3. Server component receives `q` from `searchParams`.
4. If `q` is non-empty (after trim), server queries: `SELECT * FROM notes WHERE title ILIKE $1 ORDER BY pinned DESC, created_at DESC` with parameter `'%' || q || '%'`.
5. If `q` is empty or absent, server queries all notes (no WHERE clause).
6. Results are rendered; if zero results, the empty state is shown.
7. The search input is pre-populated with the current `q` value so page refreshes preserve the filter.

**Regardless of approach chosen**, the observable behavior must match: filtering updates within 200 ms of each keystroke with no user-initiated submit action.

**Inputs:**
- `q` (string, optional): search / filter text
  - Source: URL query parameter (`?q=`) or input element value
  - Constraints: no minimum length; treated as empty string if absent or blank

**Outputs:**
- Filtered note list matching the current search string
- Empty state if zero notes match the filter
- Search input element pre-populated with active filter value

**Validation:**
- Filter string is used in a parameterized query — must not be interpolated directly into SQL
- No minimum or maximum length enforced; empty string is valid (means "no filter")
- Special regex characters in the filter string must be treated as literals (ILIKE does not use regex — `%` and `_` in user input must be escaped if literal matching is intended; implementation may choose to treat them as ILIKE wildcards for simplicity)

**Error States:**

| Scenario | Behaviour | User-visible message |
|----------|-----------|----------------------|
| Filter matches zero notes | Empty state rendered | "No notes yet" or "No notes match your search" |
| Database error during filtered query | Error state rendered on page | "Could not load notes. Please try again." |

**API Surface (this feature):** The `GET /api/notes` endpoint accepts an optional `?q=` parameter for server-side filtering — see `Y1-api.md §GET /api/notes`. The list page may use this endpoint or query the DB directly.

**Schema Surface (this feature):** Filters on `notes.title` column — see `Y0-schema.md §notes`.

---

---

## F02: Create Note (`/notes/new`)

**Description:** The create-note page renders a form that lets the user compose a new note. Title is required; body is optional; a pinned toggle defaults to unchecked (false). On successful form submission the API creates the note and the user is redirected to the home list view (`/`). Client-side validation blocks submission if the title is empty. Server-side validation in the API also rejects an empty title (see F05).

**Terminology:**
- **CTA button:** The primary "Save" / "Create note" submit button — styled with the Gold `#FBCA5C` accent
- **Pinned toggle:** A checkbox `<input type="checkbox" name="pinned">` defaulting to unchecked

**Sub-features:**
- Create-note form with title, body, and pinned fields
- Title input auto-focused on page load (keyboard appears immediately on mobile)
- Client-side title validation (non-empty before submit)
- `POST /api/notes` submission
- Redirect to `/` on success
- Error banner on API failure

**Process:**
1. User navigates to `/notes/new` (via "New note" link on the list page or directly).
2. Server renders the create form: blank `title` input, blank `body` textarea, unchecked `pinned` checkbox. The `title` input **receives focus automatically on page load** (via `autoFocus` attribute or equivalent) so the keyboard appears immediately on mobile without an extra tap.
3. User fills in the form and clicks the submit CTA.
4. **Client-side validation:** If `title.trim()` is empty, display an inline validation message ("Title is required") and abort submission. Do not call the API.
5. Client calls `POST /api/notes` with JSON body `{ "title": "<trimmed value>", "body": "<value or empty string>", "pinned": <true|false> }`.
6. **On `201` response:** Extract the created note's `id` and redirect to `/` (list view).
7. **On `400` response:** Display the error message from the API response body in an error banner on the form. Do not navigate away.
8. **On any other non-2xx response:** Display a generic error banner: "Something went wrong. Please try again."

**Inputs:**
- `title` (string, required): Note title
  - UI element: `<input type="text" name="title">`
  - Constraints: must be non-empty after trimming whitespace; max length not enforced by UI (DB column is `text` — unbounded)
- `body` (string, optional): Note body / content
  - UI element: `<textarea name="body">`
  - Constraints: may be empty string or null; no max length enforced
- `pinned` (boolean, optional, default `false`): Pin the note to the top of the list
  - UI element: `<input type="checkbox" name="pinned">`
  - Submitted as `true` when checked, `false` (or omitted) when unchecked

**Outputs:**
- On success: HTTP redirect to `/`; note appears at top of list (newest, or top-of-pinned if pinned)
- On client validation failure: inline error message beneath `title` input; form remains on screen
- On API error: error banner above or below the form; form fields retain their current values

**Validation:**
- `title` must be non-empty after `.trim()` — enforced both client-side (before API call) and server-side (in `POST /api/notes`)
- `pinned` is coerced to boolean: checkbox checked → `true`; unchecked → `false`
- `body` is never validated for content; empty string and whitespace-only are both acceptable

**Error States:**

| Scenario | HTTP Status | Error Code | User-visible message |
|----------|-------------|------------|----------------------|
| Title empty (client-side) | N/A (no API call) | — | "Title is required" |
| Title empty (server rejects) | 400 | `TITLE_REQUIRED` | "Title is required" |
| Network error / API unreachable | N/A (fetch throws) | — | "Something went wrong. Please try again." |
| Unexpected server error | 500 | `INTERNAL_ERROR` | "Something went wrong. Please try again." |

**API Surface (this feature):** `POST /api/notes` — full request/response schema in `Y1-api.md §POST /api/notes`.

**Schema Surface (this feature):** Inserts one row into `notes` — see `Y0-schema.md §notes`.

---

---

## F03: Edit Note (`/notes/[id]/edit`)

**Description:** The edit-note page loads the existing note identified by `[id]` in the URL, pre-populates a form with its current data, and allows the user to modify any field. On save, a `PUT /api/notes/[id]` request is issued. On success, the user is redirected to the home list view. If the note does not exist (404), an appropriate error state is displayed. The delete action is co-located on this page (see F04).

**Terminology:**
- **Pre-populate:** Render form fields with the note's current values retrieved from `GET /api/notes/[id]`
- **`[id]`:** The route segment from the URL path; must be a positive integer matching a `notes.id`

**Sub-features:**
- Server-side note fetch on page load
- Pre-populated form (title, body, pinned)
- Client-side title validation
- `PUT /api/notes/[id]` submission
- Redirect to `/` on successful save
- Not-found (404) error state
- Delete action (see F04)

**Process:**
1. User navigates to `/notes/[id]/edit`.
2. Server component fetches the note: `GET /api/notes/[id]` (or direct DB query `SELECT * FROM notes WHERE id = $1`).
3. **If note not found (404 / null result):** Render a not-found error state: "Note not found." with a link back to `/`. Do not render the form.
4. **If note found:** Render the edit form pre-populated:
   - `title` input: value = `note.title`
   - `body` textarea: value = `note.body ?? ''`
   - `pinned` checkbox: checked = `note.pinned`
5. User modifies fields and clicks the "Save" CTA.
6. **Client-side validation:** If `title.trim()` is empty, display inline error "Title is required"; abort API call.
7. Client calls `PUT /api/notes/[id]` with JSON body `{ "title": "<trimmed value>", "body": "<value>", "pinned": <true|false> }`.
8. **On `200` response:** Redirect to `/`.
9. **On `404` response:** Display error banner: "Note not found. It may have been deleted."
10. **On `400` response:** Display API error message in error banner; retain form values.
11. **On other non-2xx:** Display generic error banner: "Something went wrong. Please try again."

**Inputs:**
- **Route parameter** `id` (integer, required): Note identifier from URL path
- `title` (string, required): Updated note title; must be non-empty after trim
- `body` (string, optional): Updated note body; empty string accepted
- `pinned` (boolean, optional): Updated pin status; checkbox checked → `true`, unchecked → `false`

**Outputs:**
- On load (note found): pre-populated form
- On load (note not found): not-found message with back link
- On successful save: redirect to `/`
- On save failure: error banner; form values preserved

**Validation:**
- `id` in URL must parse as a positive integer; non-integer segments should yield a not-found state (same as a missing note)
- `title` must be non-empty after `.trim()` (client-side + server-side)
- `body` accepts any string including empty
- `pinned` must be boolean; unchecked checkbox coerces to `false`

**Error States:**

| Scenario | HTTP Status | Error Code | User-visible message |
|----------|-------------|------------|----------------------|
| Note not found at load time | 404 | `NOTE_NOT_FOUND` | "Note not found." |
| Title empty (client-side) | N/A | — | "Title is required" |
| Title empty (server rejects) | 400 | `TITLE_REQUIRED` | "Title is required" |
| Note deleted between load and save | 404 | `NOTE_NOT_FOUND` | "Note not found. It may have been deleted." |
| Unexpected server error on save | 500 | `INTERNAL_ERROR` | "Something went wrong. Please try again." |
| Invalid `id` in URL (non-integer) | 404 | `NOTE_NOT_FOUND` | "Note not found." |

**API Surface (this feature):**
- `GET /api/notes/[id]` — fetch note for pre-population (see `Y1-api.md §GET /api/notes/[id]`)
- `PUT /api/notes/[id]` — save changes (see `Y1-api.md §PUT /api/notes/[id]`)

**Schema Surface (this feature):** Reads and updates one row in `notes` — see `Y0-schema.md §notes`.

---

---

## F04: Delete Note

**Description:** A "Delete" action is available on the edit page (`/notes/[id]/edit`). Before the note is permanently removed, a confirmation step is required to prevent accidental deletions. The confirmation may be implemented as an inline confirmation UI (preferred: a secondary confirm button or modal) or a browser `window.confirm()` dialog (acceptable). On confirmation, `DELETE /api/notes/[id]` is called and the user is redirected to `/`. On cancellation, nothing changes.

**Terminology:**
- **Confirmation step:** A required user action that confirms intent to delete before the API call is made; must be distinct from the initial delete trigger; **must display the note's title** so the user can verify they are deleting the correct note
- **Inline confirmation:** A UI-level secondary prompt (e.g., button text changes to "Are you sure? Click to confirm" or a small modal) — preferred over browser dialog; must include the note title (e.g., "Delete 'Meeting notes'?")
- **Browser confirm dialog:** `window.confirm("Delete 'Meeting notes'?")` where the note title is interpolated — acceptable but not preferred

**Sub-features:**
- "Delete" trigger button on the edit page
- Confirmation step (inline or browser dialog)
- `DELETE /api/notes/[id]` call on confirmation
- Cancellation path (no action, form remains)
- Redirect to `/` on successful deletion
- Error banner on deletion failure

**Process:**
1. Edit page (`/notes/[id]/edit`) renders a "Delete" button alongside the save CTA.
2. User clicks "Delete".
3. **Confirmation step:** System presents confirmation (inline UI change or `window.confirm()`) that **includes the note's title** (e.g., "Delete 'Meeting notes'?" or equivalent phrasing that makes the note title visible).
   - If user **cancels**: dismiss confirmation; return to normal edit form state; no API call made.
   - If user **confirms**: proceed to step 4.
4. Client calls `DELETE /api/notes/[id]`.
5. **On `204` response:** Redirect to `/`.
6. **On `404` response:** Display error banner: "Note not found. It may have already been deleted." Offer a link to `/`.
7. **On other non-2xx:** Display error banner: "Could not delete note. Please try again."

**Inputs:**
- **Route parameter** `id` (integer, required): taken from the current edit page URL — not a separate input by the user
- User confirmation action (click/accept on confirmation step)

**Outputs:**
- On confirmation + success: redirect to `/`; note no longer appears in list
- On cancellation: no change; edit form remains in its current state
- On deletion failure: error banner; edit form remains accessible

**Validation:**
- The delete action requires exactly one confirmation step — zero or two confirmation steps are both non-conformant
- The confirmation prompt **must display the note's title** — a generic "Are you sure?" without identifying the note is non-conformant
- `id` must be the same integer already present in the URL (no additional ID input by user)

**Error States:**

| Scenario | HTTP Status | Error Code | User-visible message |
|----------|-------------|------------|----------------------|
| Note already deleted (race) | 404 | `NOTE_NOT_FOUND` | "Note not found. It may have already been deleted." |
| Network error during DELETE | N/A (fetch throws) | — | "Could not delete note. Please try again." |
| Unexpected server error | 500 | `INTERNAL_ERROR` | "Could not delete note. Please try again." |
| User cancels confirmation | N/A | — | (no message — form returns to normal state) |

**API Surface (this feature):** `DELETE /api/notes/[id]` — full spec in `Y1-api.md §DELETE /api/notes/[id]`.

**Schema Surface (this feature):** Deletes one row from `notes` by primary key — see `Y0-schema.md §notes`.

---

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

---

## F07: Auto-Migration on Startup

**Description:** Before the Next.js server begins accepting HTTP requests, it automatically executes an idempotent SQL migration that creates the `notes` table if it does not already exist. This ensures zero manual database setup — a fresh environment with only a valid `DATABASE_URL` reaches a working state without any human intervention. The migration is safe to re-run on every restart.

**Terminology:**
- **Idempotent migration:** A SQL statement that produces the same result regardless of how many times it is executed — specifically `CREATE TABLE IF NOT EXISTS`
- **Startup hook:** Code executed before the HTTP server starts accepting connections; in Next.js 14 App Router, this is typically implemented in `instrumentation.ts` (or `.js`) or in a custom server entry point

**Sub-features:**
- `CREATE TABLE IF NOT EXISTS notes (...)` executed at startup
- `DATABASE_URL` read from runtime environment (never hard-coded)
- Migration failure causes process to exit with error log
- Safe to re-run: does not drop, truncate, or alter existing data

**Process:**
1. Next.js server process starts.
2. Before serving requests, the startup hook runs.
3. Hook reads `process.env.DATABASE_URL` (or equivalent env var) to obtain the PostgreSQL connection string.
4. If `DATABASE_URL` is absent or empty, log a clear error: `"DATABASE_URL environment variable is not set"` and exit the process with a non-zero code.
5. Establish a PostgreSQL connection using the connection string.
6. Execute the following SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS notes (
     id         serial          PRIMARY KEY,
     title      text            NOT NULL,
     body       text,
     pinned     boolean         NOT NULL DEFAULT false,
     created_at timestamptz     NOT NULL DEFAULT now()
   );
   ```
7. If the SQL succeeds: close/release the migration connection; server proceeds to accept requests.
8. If the SQL fails (e.g., database unreachable, permission denied): log the error clearly and exit the process with a non-zero code. Do not silently swallow the error.

**Inputs:**
- `DATABASE_URL` (environment variable, required): PostgreSQL connection string in standard format, e.g. `postgresql://user:password@host:5432/dbname`

**Outputs:**
- On success: `notes` table exists in the database (created or already existed); server starts normally
- On failure: process exits with non-zero code; error message written to stderr/stdout

**Validation:**
- `DATABASE_URL` must be present and non-empty at startup — missing value is a hard startup failure
- The SQL migration must use `CREATE TABLE IF NOT EXISTS` — never `CREATE TABLE` (would fail on re-run) or `DROP TABLE` + `CREATE TABLE` (would destroy data)
- No credentials may appear hard-coded in source files — the connection string must come entirely from the environment variable
- The migration must not modify or drop existing columns if the table already exists (schema evolution is out of scope for this MVP)

**Error States:**

| Scenario | Behaviour | Log message |
|----------|-----------|-------------|
| `DATABASE_URL` not set | Process exits (non-zero) | "DATABASE_URL environment variable is not set" |
| Database unreachable | Process exits (non-zero) | "Migration failed: [connection error details]" |
| Insufficient DB permissions | Process exits (non-zero) | "Migration failed: [permission error details]" |
| Table already exists | No-op (success) | (silent or "Migration: notes table already exists") |
| Migration completes successfully | Server starts | (silent or "Migration: notes table ready") |

**API Surface (this feature):** None — this feature has no HTTP endpoints.

**Schema Surface (this feature):** Defines the `notes` table — see `Y0-schema.md §notes` for the authoritative DDL.

---

---

## F08: Mobile-First UI & Design System

**Description:** All pages in QuickNotes share a consistent visual design system implemented in plain CSS or CSS Modules. The design targets mobile viewports (≤375 px wide) first and enhances for wider screens via `min-width` media queries. Three colour tokens define the entire palette: near-black `#0A0A0A` for text, white `#FFFFFF` for surfaces, and Gold `#FBCA5C` as the sole accent applied sparingly. No external UI framework, icon library, or CSS-in-JS runtime may be used.

**Terminology:**
- **Mobile-first:** CSS rules written for the narrowest viewport first; larger-screen overrides added in `@media (min-width: ...)` blocks
- **Gold accent:** `#FBCA5C` — used only on primary CTAs, the pinned indicator, and active/focus states
- **Surface:** Background of a card, page, or panel — always `#FFFFFF`
- **Tap target:** Interactive element (button, link, input, checkbox) with a minimum hit area of 44 × 44 px (per WCAG 2.5.5 AAA / iOS HIG)
- **CSS Module:** A `.module.css` file scoped to a single component; class names are locally scoped by Next.js build

**Sub-features:**
- Global colour tokens (CSS custom properties or consistent hex literals)
- Mobile-first base layout (single-column, full-width)
- Responsive enhancement for wider viewports
- Gold accent on primary CTA buttons
- Gold accent on pinned note indicator
- Minimum 44 × 44 px tap targets on all interactive elements
- Accessible form labels (all inputs have associated `<label>`)
- No external CSS framework

**Design Tokens:**

| Token | Value | Usage |
|-------|-------|-------|
| Text | `#0A0A0A` | All body text, headings, input values |
| Surface | `#FFFFFF` | Page background, card backgrounds |
| Accent (Gold) | `#FBCA5C` | Primary CTA buttons, pinned indicator, focus ring |
| Accent constraint | ≤10% of any view | Gold must not dominate any screen |

**Layout Rules:**
- Base layout: single-column, `width: 100%`, `max-width: 600px`, centered with `margin: 0 auto`, `padding: 0 1rem`
- Larger screens (≥ 640 px): may increase padding to `0 2rem`; cards may gain a subtle border or shadow
- Note list: vertical stack of cards; each card full-width on mobile
- Forms: full-width inputs and textarea; submit button full-width on mobile, auto-width on larger screens

**Component Specs:**

*Note Card (list view):*
- Height: min-height sufficient to meet tap target (≥ 44 px)
- Contains: note title; pinned indicator (Gold accent element) if `pinned === true`
- Entire card is a tappable link to `/notes/[id]/edit`

*Submit / CTA Button:*
- Background: `#FBCA5C` (Gold); text: `#0A0A0A` (near-black for contrast)
- Min height: 44 px; min width: 44 px
- Border radius: implementation choice (≥ 4 px suggested)
- Hover/focus: darker gold or visible outline acceptable

*Search Input:*
- Full width; height ≥ 44 px; `#0A0A0A` text on white background
- Placeholder text: "Search notes…" (or equivalent)

*Form Inputs (title, body):*
- `title`: `<input type="text">` — full width, height ≥ 44 px
- `body`: `<textarea>` — full width, min-height 120 px, resizable vertically
- `pinned`: `<input type="checkbox">` — label text beside checkbox; overall tap area ≥ 44 × 44 px

*Delete Button:*
- Distinct from the Save/CTA button — must not use the Gold accent
- Acceptable: neutral grey, red, or outline style

**Accessibility Rules:**
- Every `<input>` and `<textarea>` must have an associated `<label>` (via `for`/`id` or wrapping)
- Colour must not be the sole means of conveying state (e.g., pinned indicator must include non-colour cue: icon, text, or different layout position)
- Focus styles must be visible (do not use `outline: none` without a replacement)

**Process (style application):**
1. Global base styles applied via a root CSS file (e.g., `app/globals.css`): reset, body colours, font.
2. Per-page and per-component styles via CSS Modules (`.module.css` files co-located with components).
3. Gold accent applied only to: submit CTA background, pinned indicator, active/focused interactive states.
4. All interactive elements verified to meet 44 × 44 px tap target on a 375 px viewport.

**Error States (design system):**

| Scenario | Visual treatment |
|----------|-----------------|
| Inline validation error | Red-tinted text `#CC0000` beneath the invalid field; `aria-invalid="true"` on input |
| Error banner (API failure) | Visually distinct block above or below the form; not using Gold accent |
| Empty state | Centered, muted text ("No notes yet"); optional subtle illustration in black/white |

**Validation:**
- No Tailwind, Bootstrap, Material UI, or any other CSS framework may be imported
- No CSS-in-JS libraries (styled-components, emotion, etc.)
- `X-Frame-Options` and CSP `frame-ancestors` constraints covered in F09

**API Surface (this feature):** None.

**Schema Surface (this feature):** None.

---

---

## F09: Iframe Compatibility & Port Binding

**Description:** The QuickNotes application must render correctly when embedded inside a parent iframe (potentially cross-origin) and must be reachable from container networking and the preview host. This requires: binding the HTTP server to `0.0.0.0:3000` rather than `localhost`; omitting any HTTP response headers that block iframe embedding (`X-Frame-Options`, restrictive `frame-ancestors` CSP); and using `next.config.mjs` (never `next.config.ts`, which causes a hard error in Next.js 14).

**Terminology:**
- **`0.0.0.0`:** Wildcard bind address — accepts connections on all network interfaces, making the server reachable from outside the container
- **`X-Frame-Options`:** HTTP response header (`DENY` or `SAMEORIGIN`) that prevents browsers from rendering the page inside a `<frame>` or `<iframe>`
- **`frame-ancestors`:** CSP directive that restricts which origins may embed the page in a frame; `'none'` or `'self'` would block cross-origin iframe embedding
- **`next.config.mjs`:** ES Module format Next.js config file; the only format that works in Next.js 14 (`.ts` causes a hard startup error; `.js` is also acceptable)

**Sub-features:**
- Server bound to `0.0.0.0:3000`
- No `X-Frame-Options` header emitted
- No `frame-ancestors 'none'` or `frame-ancestors 'self'` CSP directive
- Config file is `next.config.mjs` (or `.js`) — never `.ts`

**Process:**
1. Next.js server starts and binds to `0.0.0.0:3000`.
2. For every HTTP response, the server must **not** include the `X-Frame-Options` header.
3. If a `Content-Security-Policy` header is present, it must **not** contain `frame-ancestors 'none'` or `frame-ancestors 'self'`. Omitting the `frame-ancestors` directive entirely is acceptable.
4. The Next.js configuration file is `next.config.mjs` (ES Module format) or `next.config.js` (CommonJS format). A file named `next.config.ts` must not exist in the project root.
5. The preview host embeds the app in a `<iframe src="http://host:3000">` — the page must render without a `SecurityError`, blank iframe, or browser console frame-blocking warnings.

**Inputs:**
- `PORT` environment variable (optional): if provided, the server may use it; default must be `3000`
- `next.config.mjs` file: must exist; controls Next.js headers configuration

**Outputs:**
- HTTP server listening on `0.0.0.0:3000`
- HTTP responses contain no `X-Frame-Options` header
- HTTP responses contain no `frame-ancestors 'none'` or `frame-ancestors 'self'` in CSP
- Application renders inside a cross-origin `<iframe>` without errors

**Validation:**
- `next.config.mjs` (or `.js`) must exist at the project root; `next.config.ts` must not exist
- The `headers()` export in `next.config.mjs`, if present, must not add `X-Frame-Options` to any route
- Default Next.js headers must be audited: as of Next.js 14, the framework does not add `X-Frame-Options` by default, but custom headers must not introduce it
- Server port: `3000` is the default; binding to `127.0.0.1` or `localhost` only would fail in container environments

**Error States:**

| Scenario | Consequence | Mitigation |
|----------|-------------|------------|
| `next.config.ts` present in project root | Hard startup error: Next.js 14 refuses to parse TS config | Use `next.config.mjs` only; CI check for `.ts` config |
| `X-Frame-Options: DENY` header emitted | iframe renders blank; browser console shows frame-blocked error | Remove from headers config; add CI smoke test |
| `frame-ancestors 'none'` or `'self'` in CSP | Same as X-Frame-Options: DENY | Exclude from CSP; add CI smoke test |
| Server bound to `127.0.0.1` only | Unreachable from container network / preview host | Verify `0.0.0.0` binding in startup smoke test |

**API Surface (this feature):** None — this feature is about server configuration, not API behaviour.

**Schema Surface (this feature):** None.

---

---

## Y0: Database Schema

**Database:** PostgreSQL
**Migration strategy:** Auto-run at server startup via `CREATE TABLE IF NOT EXISTS` (idempotent). See F07.
**Connection:** `DATABASE_URL` environment variable — never hard-coded.

---

### §notes — Primary Table

The `notes` table is the sole data entity in QuickNotes MVP.

#### DDL

```sql
CREATE TABLE IF NOT EXISTS notes (
  id         serial       PRIMARY KEY,
  title      text         NOT NULL,
  body       text,
  pinned     boolean      NOT NULL DEFAULT false,
  created_at timestamptz  NOT NULL DEFAULT now()
);
```

#### Column Definitions

| Column | PostgreSQL Type | Constraints | Description |
|--------|----------------|-------------|-------------|
| `id` | `serial` | `PRIMARY KEY` | Auto-incrementing integer identifier; assigned by DB on insert |
| `title` | `text` | `NOT NULL` | Note title; must be non-empty (enforced at API layer — see F05); no max length |
| `body` | `text` | nullable | Note body / content; may be `NULL` or empty string; no max length |
| `pinned` | `boolean` | `NOT NULL DEFAULT false` | When `true`, note sorts above un-pinned notes in all list queries |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | UTC timestamp of note creation; set automatically by DB on insert; never updated |

#### Indexes

No additional indexes are required for the MVP. All queries use the primary key or a full table scan (acceptable for < 1,000 notes per NFR).

Future candidates (out of scope for MVP):
- `CREATE INDEX idx_notes_created_at ON notes (created_at DESC);`
- `CREATE INDEX idx_notes_title_gin ON notes USING gin (to_tsvector('english', title));` (for full-text search)

#### Query Patterns

| Operation | SQL |
|-----------|-----|
| List all (sorted) | `SELECT * FROM notes ORDER BY pinned DESC, created_at DESC` |
| List with search | `SELECT * FROM notes WHERE title ILIKE $1 ORDER BY pinned DESC, created_at DESC` — `$1 = '%' \|\| q \|\| '%'` |
| Fetch by id | `SELECT * FROM notes WHERE id = $1` |
| Insert | `INSERT INTO notes (title, body, pinned) VALUES ($1, $2, $3) RETURNING *` |
| Update | `UPDATE notes SET title = $1, body = $2, pinned = $3 WHERE id = $4 RETURNING *` |
| Delete | `DELETE FROM notes WHERE id = $1 RETURNING id` |

#### Notes on Data Types

- `serial` is equivalent to `integer NOT NULL DEFAULT nextval(...)`. The sequence starts at 1.
- `text` in PostgreSQL has no maximum length; application-level limits are not enforced in this MVP.
- `timestamptz` stores timestamps with timezone offset; `now()` returns the current transaction time in UTC.
- `boolean` stores `true`/`false`; PostgreSQL accepts `TRUE`/`FALSE`, `'t'`/`'f'`, `1`/`0` — the application layer should always pass a proper boolean.
- **No `updated_at` column** — this is a deliberate MVP scope decision. Note edits do not update any timestamp. Implementers must not add `updated_at` to the schema without a spec change.

---

### §No Other Tables

The QuickNotes MVP has no other tables. There are no users, sessions, tags, or audit log tables. The `notes` table is the entire data model.

---

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
