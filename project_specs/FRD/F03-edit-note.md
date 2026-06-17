
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
