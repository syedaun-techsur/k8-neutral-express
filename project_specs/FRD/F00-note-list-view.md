
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
