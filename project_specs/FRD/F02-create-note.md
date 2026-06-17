
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
