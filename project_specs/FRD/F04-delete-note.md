
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
