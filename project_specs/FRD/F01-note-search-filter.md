
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
