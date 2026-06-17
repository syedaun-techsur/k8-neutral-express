# UX Mockup — QuickNotes

**Project:** QuickNotes
**Generated:** 2026-06-17
**Based on:** UserStories-QuickNotes.md, JOURNEYS-QuickNotes.md, PRD-QuickNotes.md, FRD-QuickNotes.md, PROJECT.md
**Primary breakpoint:** 390 px (mobile-first)

---

## Overview

QuickNotes is a three-page application with a single primary entity (notes) and a single user journey shape: **List → Create/Edit → List**. Every write operation ends with a redirect back to `/`, making the list view the persistent anchor of the experience.

### Design Principles

1. **Speed over ceremony.** The list is the first thing seen; the New Note CTA is always visible above the fold. Zero modals, zero sidebars, zero login screens.
2. **Gold is scarce.** `#FBCA5C` appears only on the primary CTA button, the pinned badge, and focus rings — never as a background fill for content areas.
3. **Explicit save semantics.** No auto-save. Every change requires a deliberate "Save" tap so users always know the exact moment their data is persisted.
4. **Tap-safe layout.** All interactive targets ≥ 44 × 44 px. Note cards have generous vertical padding to prevent mis-taps on adjacent items.
5. **Accessible by default.** Every input has a `<label>`. Error states use text + `aria-invalid`, not colour alone. Focus styles are always visible.

### Colour Tokens

| Token    | Hex       | Used for |
|----------|-----------|----------|
| Text     | `#0A0A0A` | All body text, headings, input values, button text |
| Surface  | `#FFFFFF` | Page background, card background |
| Accent   | `#FBCA5C` | Primary CTA background, pinned badge, focus ring |
| Error    | `#CC0000` | Inline validation text, error banner text |
| Muted    | `#6B6B6B` | Placeholder text, secondary labels, timestamps |
| Divider  | `#E5E5E5` | Card borders, input borders, horizontal rules |

### Page Map

| Route | Page | Primary Stories |
|-------|------|----------------|
| `/` | Note List | US-0.1, US-0.2, US-1.1, US-1.2 |
| `/notes/new` | Create Note | US-2.1, US-2.2, US-2.3, US-2.4 |
| `/notes/[id]/edit` | Edit Note + Delete | US-3.1–3.4, US-4.1, US-4.2 |

---

## User Flows

### Flow 1: Capture a Note (Happy Path)
**Trigger:** User opens app, taps "New note"
**Stories:** US-2.1, US-0.3, JRN-01.1

```
[/] Note List
  │
  ▼ tap "New note" link/button
[/notes/new] Create Form
  │  • title field auto-focused
  │  • fill title (required)
  │  • fill body (optional)
  │  • toggle pinned (optional)
  │
  ▼ tap "Save" CTA
[POST /api/notes]
  │
  ├── 201 Created ──▶ redirect to [/] Note List
  │                   └── new note at top of list
  │
  └── error (4xx/5xx/network)
        └── error banner on form; values preserved; user retries
```

**Steps:**
1. From `/`, user taps the gold "New note" button pinned at the top of the page.
2. `/notes/new` loads with the title `<input>` auto-focused; keyboard rises immediately on mobile.
3. User types a title (required). Body textarea and pinned checkbox are below, reachable by scrolling.
4. Optionally checks the Pinned checkbox.
5. Taps gold "Save" button. Button disables instantly (prevents double-submit).
6. On `201`, browser navigates to `/`; new note appears at top of list (pinned section if pinned, else top of unpinned).

---

### Flow 2: Search and Filter Notes
**Trigger:** User types into the search input on `/`
**Stories:** US-1.1, US-1.2, JRN-02.1

```
[/] Note List (full, unfiltered)
  │
  ▼ type into search input
[/] Note List (filtered, real-time)
  │
  ├── ≥1 match ──▶ show matching cards only (pinned-first)
  │
  └── 0 matches ──▶ "No notes match your search" empty state
        │
        └── clear input ──▶ restore full list
```

**Steps:**
1. Search input is always visible at the top of the list, above the first note card.
2. Typing narrows the list in real time (client-side filter or `?q=` URL update).
3. Sort order is preserved: pinned-first, newest-first within each group.
4. If no notes match, the empty-state component renders with the filtered message.
5. Clearing the input (x button or manual delete) immediately restores the full list.
6. The `?q=` param persists in the URL so a browser refresh preserves the active filter.

---

### Flow 3: Edit and Pin an Existing Note
**Trigger:** User taps a note card on `/`
**Stories:** US-3.1, US-3.2, US-3.3, US-0.4, JRN-01.2, JRN-02.1

```
[/] Note List
  │
  ▼ tap note card
[/notes/[id]/edit] Edit Form
  │  • form pre-filled with current title, body, pinned
  │  • user changes one or more fields
  │
  ▼ tap "Save" CTA
[PUT /api/notes/[id]]
  │
  ├── 200 OK ──▶ redirect to [/] Note List
  │               └── updated note reflects changes; reordered if pinned changed
  │
  ├── 404 ──▶ banner "Note not found. It may have been deleted." + back link
  │
  └── error ──▶ banner on form; values preserved
```

**Steps:**
1. Tapping any note card navigates to `/notes/[id]/edit`.
2. Form is pre-populated from the server: title, body (empty string if null), pinned checkbox.
3. User edits any field. No auto-save.
4. Tapping "Save" calls `PUT /api/notes/[id]`. Button disables during request.
5. On `200`, redirect to `/`. If pinned status changed, note appears in the correct section.

---

### Flow 4: Delete a Note with Confirmation
**Trigger:** User taps "Delete" on the edit page
**Stories:** US-4.1, US-4.2, US-0.5, JRN-02.2

```
[/notes/[id]/edit] Edit Form
  │
  ▼ tap "Delete" button (secondary style — not gold)
[Confirmation State]  ← inline UI change; no modal
  │  • button label changes to "Confirm delete"
  │  • Cancel link appears beside it
  │
  ├── tap "Confirm delete"
  │     ▼
  │   [DELETE /api/notes/[id]]
  │     │
  │     ├── 204 ──▶ redirect to [/] (note absent from list)
  │     │
  │     ├── 404 ──▶ banner "Note not found. It may have already been deleted." + link to /
  │     │
  │     └── 500/network ──▶ banner "Could not delete note. Please try again."
  │
  └── tap "Cancel" ──▶ form returns to normal state; no API call
```

**Steps:**
1. Delete button is visually distinct from Save — no gold background. Acceptable: outlined style with `#0A0A0A` border, or muted grey fill.
2. First tap triggers an inline confirmation: the Delete button text changes to "Confirm delete ?" and a "Cancel" text link appears beside it. No `window.confirm()` dialog (poorer mobile UX).
3. Second tap on "Confirm delete" calls `DELETE /api/notes/[id]`.
4. On `204`, redirect to `/`. Deleted note is absent.
5. "Cancel" reverts the button to its original label; no API call is made.

---

## Screen Designs

### Screen 1: Note List (`/`)

**Purpose:** App entry point — view all notes, search, navigate to create or edit.
**Stories:** US-0.1, US-0.2, US-1.1, US-1.2, US-8.1

#### Layout (390 px — mobile)

```
┌──────────────────────────────────────┐  ← white surface #FFFFFF
│ QuickNotes              [+ New note] │  ← nav bar; "New note" is gold CTA
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐   │
│ │ 🔍  Search notes…              │   │  ← search input, full width, h≥44px
│ └────────────────────────────────┘   │
├──────────────────────────────────────┤
│                                      │
│  ── Pinned ──────────────────────── │  ← subtle section divider (only if pinned notes exist)
│                                      │
│ ┌────────────────────────────────┐   │
│ │ 📌 Meeting agenda         →    │   │  ← pinned card; gold pin badge left
│ │    "Review Q3 roadmap…"        │   │  ← body snippet (truncated to 1–2 lines)
│ │    Jun 17                      │   │  ← created_at, muted
│ └────────────────────────────────┘   │
│                                      │
│  ── Notes ───────────────────────── │  ← divider; only shown when pinned section non-empty
│                                      │
│ ┌────────────────────────────────┐   │
│ │ Groceries                 →    │   │
│ │    "milk, eggs, bread…"        │   │
│ │    Jun 17                      │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ async library                 →│   │
│ │    (no body)                   │   │
│ │    Jun 16                      │   │
│ └────────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

**Nav bar spec:**
- Left: "QuickNotes" — plain text logo / home link (`<a href="/">`)
- Right: "+ New note" — gold `#FBCA5C` background, `#0A0A0A` text, h=44px, border-radius ≥4px
- No other nav links (no dead links per requirement)

**Note card spec:**
- Full-width, white background, `1px solid #E5E5E5` border, border-radius ≥4px
- Padding: `12px 16px`; min-height 44px (usually taller due to content)
- Entire card is a `<a>` link to `/notes/[id]/edit`
- Title: `#0A0A0A`, font-weight 600, one line (truncate with ellipsis if needed)
- Body snippet: `#6B6B6B`, font-size slightly smaller, max 2 lines, ellipsis overflow
- Timestamp: `#6B6B6B`, font-size small, bottom-right or bottom-left
- **Pinned indicator:** gold `#FBCA5C` filled pin badge (📌 or a CSS dot/stripe) on the left edge of the card + "Pinned" text label (satisfies non-colour cue requirement per US-8.3)

**Search input spec:**
- `<input type="search">` (or `type="text"`) with `<label>` (visually hidden or visible: "Search notes")
- Full width, height ≥ 44px, `1px solid #E5E5E5` border, border-radius ≥ 4px
- Placeholder: `Search notes…`
- Focus ring: `2px solid #FBCA5C` (gold)
- `name="q"` so the form action can update `?q=` in URL

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Note title | Top of each card, bold |
| Secondary | Body snippet | Below title, muted |
| Tertiary | Created date | Bottom of card, small muted |
| Indicator | Pinned badge | Left edge of pinned cards |
| Action | "+ New note" CTA | Top-right of nav bar |
| Utility | Search input | Below nav bar, full width |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (notes exist) | Sorted list of cards | — |
| Empty (no notes, no search) | Centered illustration area | "No notes yet" + gold "New note" button |
| Empty (search, no match) | Same empty component | "No notes match your search" |
| Loading (server render) | Skeleton cards or instant SSR | — (Next.js SSR is synchronous) |
| DB error | Inline error block | "Could not load notes. Please try again." |

**Empty state wireframe:**
```
┌──────────────────────────────────────┐
│ QuickNotes              [+ New note] │
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐   │
│ │ 🔍  Search notes…              │   │
│ └────────────────────────────────┘   │
│                                      │
│                                      │
│        No notes yet.                 │  ← centered, #6B6B6B
│                                      │
│        [+ New note]                  │  ← gold CTA button, centered
│                                      │
│                                      │
└──────────────────────────────────────┘
```

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "+ New note" (nav) | Gold CTA link `<a>` | Navigate to `/notes/new` |
| Note card | `<a>` block link | Navigate to `/notes/[id]/edit` |
| Search input | `<input>` | Filter list in real time (or update `?q=`) |
| "+ New note" (empty state) | Gold CTA button/link | Navigate to `/notes/new` |

---

### Screen 2: Create Note (`/notes/new`)

**Purpose:** Compose and save a new note.
**Stories:** US-2.1, US-2.2, US-2.3, US-2.4, US-8.1, US-8.2, US-8.3

#### Layout (390 px — mobile)

```
┌──────────────────────────────────────┐
│ ← Home          New note            │  ← nav: "← Home" left, page title center
├──────────────────────────────────────┤
│                                      │
│  [Error banner — API failure]        │  ← hidden by default; shown on API error
│                                      │
│  Title *                             │  ← <label for="title">
│  ┌────────────────────────────────┐  │
│  │                                │  │  ← <input type="text" id="title" autofocus>
│  └────────────────────────────────┘  │
│  ⚠ Title is required                │  ← validation error; hidden by default; red #CC0000
│                                      │
│  Body                                │  ← <label for="body">
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                                │  │  ← <textarea id="body"> min-height 120px
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  ☐  Pin this note                   │  ← <input type="checkbox" id="pinned"> + <label>
│                                      │    tap area ≥ 44×44px via padding
│                                      │
│  ┌────────────────────────────────┐  │
│  │           Save                 │  │  ← gold CTA, full-width on mobile, h=44px
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Nav bar spec:**
- Left: "← Home" link (`<a href="/">`) — plain text, `#0A0A0A`
- Center/Right: "New note" page heading (or omit if title is in `<h1>` below)
- No other nav links

**Form spec:**
- `<form>` with `action` pointing to client-side JS handler (not a traditional HTML form POST — Next.js client component with `fetch`)
- `title` input: `type="text"`, `id="title"`, `name="title"`, `autofocus`, full-width, h≥44px
- `body` textarea: `id="body"`, `name="body"`, full-width, min-height 120px, resize vertical
- `pinned` checkbox: `id="pinned"`, `name="pinned"`, wrapped in a label or associated via `for`/`id`; the entire label+checkbox row has min-height 44px and sufficient padding
- Save button: `type="submit"`, gold background `#FBCA5C`, `#0A0A0A` text, full-width, h=44px
- On submit click: button immediately gets `disabled` attribute to prevent double-submit

**Pinned checkbox visual (checked state):**
```
  ✅  Pin this note   ← checkbox turns gold/checked; label text unchanged
```
The checked state uses the browser default checkbox checked style. The label never changes to "Pinned ✓" on the create form (that label change is for the edit form where the note already exists).

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Title input | Top of form, auto-focused |
| Secondary | Body textarea | Below title |
| Secondary | Pinned toggle | Below body |
| Action | Save CTA | Bottom of form, full-width |
| Feedback | Validation error | Directly beneath title input |
| Feedback | API error banner | Above form (top of content area) |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (blank) | Empty form; title auto-focused | — |
| Title empty on submit | Red "Title is required" beneath title; `aria-invalid="true"` on input; gold border turns red | "Title is required" |
| Submitting | Save button disabled + optional spinner or "Saving…" text | Button disabled |
| API error | Red error banner above form; form values intact | "Something went wrong. Please try again." |
| Success | (navigated away to `/`) | New note visible at top of list |

**Error banner wireframe:**
```
┌──────────────────────────────────────┐
│ ⚠ Something went wrong. Please try  │  ← role="alert"; background #FFF0F0;
│   again.                             │    border-left 4px solid #CC0000
└──────────────────────────────────────┘
```

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "← Home" nav link | `<a>` | Navigate to `/` |
| Title input | `<input type="text">` | Required field; inline validation on submit |
| Body textarea | `<textarea>` | Optional; free text |
| Pinned checkbox | `<input type="checkbox">` | Defaults unchecked; coerces to boolean on submit |
| Save button | `<button type="submit">` | Validates client-side; calls `POST /api/notes`; disables on click |

---

### Screen 3: Edit Note (`/notes/[id]/edit`)

**Purpose:** View, edit, and save changes to an existing note; delete the note with confirmation.
**Stories:** US-3.1, US-3.2, US-3.3, US-3.4, US-4.1, US-4.2, US-8.1, US-8.2, US-8.3

#### Layout (390 px — mobile)

```
┌──────────────────────────────────────┐
│ ← Home          Edit note           │  ← nav
├──────────────────────────────────────┤
│                                      │
│  [Error banner]                      │  ← hidden by default
│                                      │
│  Title *                             │
│  ┌────────────────────────────────┐  │
│  │ Meeting agenda                 │  │  ← pre-filled with note.title
│  └────────────────────────────────┘  │
│  ⚠ Title is required                │  ← hidden by default
│                                      │
│  Body                                │
│  ┌────────────────────────────────┐  │
│  │ Review Q3 roadmap, align on    │  │  ← pre-filled with note.body
│  │ budget, confirm attendees      │  │
│  └────────────────────────────────┘  │
│                                      │
│  ☑  Pin this note                   │  ← pre-checked if note.pinned === true
│                                      │
│  ┌────────────────────────────────┐  │
│  │           Save                 │  │  ← gold CTA
│  └────────────────────────────────┘  │
│                                      │
│  ─────────────────────────────────── │  ← visual separator
│                                      │
│  [ Delete note ]                     │  ← secondary / destructive style; NOT gold
│                                      │    outlined or grey-filled; left-aligned
│                                      │
└──────────────────────────────────────┘
```

**Delete button confirmation inline state:**
```
                                        ← after first tap on "Delete note"
│  [ Confirm delete ? ]  Cancel        │  ← button text changes; Cancel appears beside
│                                      │    Cancel is a plain text link (not a button)
```

**Not-found state (when `id` is invalid or note deleted):**
```
┌──────────────────────────────────────┐
│ ← Home                              │
├──────────────────────────────────────┤
│                                      │
│   Note not found.                    │  ← centered or left-aligned, #0A0A0A
│                                      │
│   This note may have been deleted.   │  ← muted secondary text
│                                      │
│   ← Back to all notes               │  ← plain link to /
│                                      │
└──────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Title input (pre-filled) | Top of form |
| Secondary | Body textarea (pre-filled) | Below title |
| Secondary | Pinned toggle (pre-checked) | Below body |
| Action (primary) | Save CTA (gold) | Below pinned toggle |
| Action (destructive) | Delete button (secondary) | Below visual separator, below Save |
| Feedback | Validation error | Beneath title input |
| Feedback | API error banner | Above form |

**Design rationale for button layout:**
- Save above Delete: the primary action is encountered first, reducing accidental deletion.
- Visual separator (horizontal rule or spacing) creates a clear "danger zone" boundary.
- Delete uses outlined or grey-fill style to visually distinguish from gold Save — satisfies US-8.2.

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (loaded) | Pre-filled form | — |
| Loading (SSR) | Instant load (server-rendered) | — |
| Not found | Error message + back link; no form | "Note not found." |
| Title empty on submit | Red error beneath title; `aria-invalid="true"` | "Title is required" |
| Submitting (Save) | Save button disabled | Button disabled |
| Delete — default | "Delete note" button, secondary style | — |
| Delete — confirming | Button: "Confirm delete ?" + "Cancel" link | Visual change only |
| Delete — processing | Both buttons disabled | Buttons disabled |
| API error (save) | Error banner above form; form values intact | "Something went wrong. Please try again." |
| Delete 404 | Error banner | "Note not found. It may have already been deleted." + link to `/` |
| Delete 500/network | Error banner | "Could not delete note. Please try again." |
| Success (save) | (navigated away to `/`) | Updated note in list |
| Success (delete) | (navigated away to `/`) | Note absent from list |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "← Home" nav link | `<a>` | Navigate to `/` |
| Title input | `<input type="text">` | Pre-filled; required; inline validation |
| Body textarea | `<textarea>` | Pre-filled; optional |
| Pinned checkbox | `<input type="checkbox">` | Pre-checked if `note.pinned`; coerces on submit |
| Save button | `<button type="submit">` | Calls `PUT /api/notes/[id]`; disables on click |
| Delete button | `<button type="button">` | First click → confirmation state |
| Confirm delete button | `<button type="button">` | Second click → calls `DELETE /api/notes/[id]` |
| Cancel link | `<button type="button">` or `<a>` | Reverts Delete button to default state; no API call |

---

## Interaction Patterns

### Pattern: Inline Form Validation

**When to use:** Title input on both Create and Edit forms.
**Trigger:** Form submit attempt with empty title.
**Behavior:**
1. `preventDefault()` on submit event.
2. If `title.trim() === ''`: add `aria-invalid="true"` to the input; render `<p role="alert" class="error">Title is required</p>` beneath the input; focus the title input.
3. No API call is made.
4. When user types into the title input after an error: remove `aria-invalid` and hide the error message on the `input` event.

```
┌────────────────────────────────┐
│ Meeting agenda (cleared)       │  ← user clears title
└────────────────────────────────┘
⚠ Title is required               ← visible, red #CC0000, role="alert"
```

---

### Pattern: Submit Button Disable-on-Click

**When to use:** Save (Create and Edit) and Confirm Delete buttons.
**Behavior:** On click, immediately set `disabled` on the button and optionally change text to "Saving…" or "Deleting…". Re-enable only if the API call fails (to allow retry). If successful, navigation away handles cleanup.
**Why:** Prevents double-submission on slow connections; provides immediate tactile feedback.

---

### Pattern: Inline Delete Confirmation

**When to use:** Delete action on Edit Note page.
**Behavior:**
1. Initial state: `<button>Delete note</button>` (secondary/outlined style).
2. On first click: transform the same button element — change text to "Confirm delete ?" and reveal a sibling "Cancel" link. No modal, no dialog.
3. On "Confirm delete ?": disable both controls, call `DELETE /api/notes/[id]`.
4. On "Cancel": restore the original "Delete note" button label; hide the Cancel link.
5. Add `aria-expanded` and `aria-label` updates to communicate state to screen readers.

```
Before:   [ Delete note ]
After:    [ Confirm delete ? ]  Cancel
```

---

### Pattern: Error Banner

**When to use:** API failure on Create (POST), Edit (PUT), or Delete (DELETE).
**Behavior:**
- Render a visually distinct block at the top of the form content area (below nav, above form fields).
- `role="alert"` so screen readers announce it immediately.
- Background: light red tint (`#FFF0F0`); left border: 4px solid `#CC0000`; text: `#CC0000`.
- Text content varies by context (see Error States tables above).
- Not gold — gold is reserved for positive primary actions only.
- Dismissable: optional ✕ button, or dismissed automatically when user retries successfully.

---

### Pattern: Real-Time Search Filter

**When to use:** Search input on the Note List page.
**Behavior (client-side approach):**
1. `<input>` with `id="search"` and `<label>Search notes</label>` (visually hidden label acceptable).
2. `input` event listener fires on every keystroke.
3. Iterate note card elements; compare `data-title` attribute (lowercase) against filter string (lowercase).
4. Cards that don't match get `display: none` (or `hidden` attribute); matching cards show.
5. If all cards hidden, show the empty-state element.
6. On clear (empty string), show all cards; hide empty state.
7. Update `window.history.replaceState` with `?q=<value>` for URL persistence (optional; required by US-1.1).

**Behavior (server-side approach):**
1. Search input is inside a `<form method="get" action="/">`.
2. On change (debounced) or submit, the URL navigates to `/?q=<value>`.
3. Server re-renders the page with filtered results.

Both approaches satisfy US-1.1. The client-side approach provides a faster perceived response.

---

### Pattern: Pinned Indicator on Note Card

**When to use:** Any note with `pinned === true` in the Note List.
**Visual:** A small gold `#FBCA5C` badge/pill on the left side of the card containing the text "Pinned" or a pin icon (📌) + "Pinned" text.
**Non-colour cue:** The word "Pinned" (or pin icon) satisfies the accessibility requirement that colour alone must not convey state (US-8.3).
**CSS approach:**

```css
/* Pinned badge */
.pinnedBadge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #FBCA5C;
  color: #0A0A0A;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
```

---

## Responsive Considerations

### Mobile (≤ 390 px) — Primary Target

- Single-column layout; full-width cards and inputs.
- Nav: logo left, "+ New note" right; both on one line with `justify-content: space-between`.
- Note cards: `padding: 12px 16px`; `min-height: 44px` via line-height + padding.
- Form inputs: `width: 100%`; `height: 44px` for text inputs; `min-height: 120px` for textarea.
- Save button: `width: 100%`; `height: 44px`.
- Delete button: `width: auto`; left-aligned; `height: 44px`; `padding: 0 16px`.
- Pinned checkbox row: `padding: 10px 0`; click/tap area enforced via `<label>` wrapping the input.
- Search input: `width: 100%`; `height: 44px`.

### Tablet / Desktop (≥ 640 px) — Enhancement

- Content area: `max-width: 600px`; `margin: 0 auto`; `padding: 0 2rem`.
- Note cards: may gain a subtle `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` for depth.
- Save button on Create/Edit: `width: auto` (no longer full-width); right-aligned or left-aligned with the form.
- Body textarea: may expand to `min-height: 160px`.
- Note list: remains single-column (no grid — notes are a sequential list, not a grid).

```css
/* Example responsive wrapper */
.container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 2rem;
  }
  .submitButton {
    width: auto;
    min-width: 120px;
  }
}
```

---

## Accessibility Notes

### Colour Contrast
- `#0A0A0A` text on `#FFFFFF` background: contrast ratio ≈ 19:1 — passes WCAG AA and AAA.
- `#0A0A0A` text on `#FBCA5C` gold button: contrast ratio ≈ 8:1 — passes WCAG AA and AAA.
- `#CC0000` error text on `#FFFFFF`: contrast ratio ≈ 5.9:1 — passes WCAG AA.
- `#6B6B6B` muted text on `#FFFFFF`: contrast ratio ≈ 5.7:1 — passes WCAG AA for normal text.

### Keyboard Navigation
- Tab order follows DOM source order: Nav → Search → Note cards → (on form pages) Title → Body → Pinned → Save → Delete.
- All interactive elements are natively focusable (`<a>`, `<button>`, `<input>`, `<textarea>`).
- No `outline: none` or `outline: 0` without a replacement focus indicator.
- Focus ring: `2px solid #FBCA5C` with `outline-offset: 2px` on all focusable elements.
- Delete confirmation flow: after confirming, if the operation fails, focus returns to the error banner or the Delete button.

### Screen Reader Support
- `<label>` elements associated with every `<input>` and `<textarea>` via `for`/`id` pairing.
- Visually hidden label acceptable for the search input if a visible placeholder is present — but must still exist in the DOM (`position: absolute; clip: rect(0,0,0,0)`).
- Inline validation errors use `aria-invalid="true"` on the invalid input and `role="alert"` on the error paragraph.
- Error banners use `role="alert"` so they are announced immediately by screen readers without requiring focus.
- Pinned badge: `aria-label="Pinned"` if using icon-only; if text "Pinned" is present, `aria-label` is redundant.
- Delete confirmation button: use `aria-expanded="true"` when in confirming state and `aria-label="Confirm delete — this cannot be undone"` for clarity.
- Empty state: ensure the "No notes yet" paragraph is in the main content area, not hidden — screen readers announce it as expected content.
- Page `<title>` values:
  - `/` → `QuickNotes`
  - `/notes/new` → `New note — QuickNotes`
  - `/notes/[id]/edit` → `Edit note — QuickNotes`
  - Not-found state → `Note not found — QuickNotes`

### ARIA Landmark Roles
- `<header>` wraps the nav bar.
- `<main>` wraps the primary content (list + search, or form).
- No need for additional ARIA roles beyond semantic HTML elements.

### Touch / Tap Targets (US-8.1, US-8.3)
- Minimum 44 × 44 px for every interactive element.
- Note cards achieve this naturally from padding + multi-line content; verify single-word titles still meet 44px height via `min-height: 44px`.
- Checkbox tap area: the `<label>` must wrap both the `<input type="checkbox">` and the label text, and the label must have `min-height: 44px` and `display: flex; align-items: center`.
- The "Cancel" text link in the delete confirmation must also meet 44px via `padding: 10px`.

---

## Story Coverage Summary

| Story ID | Screen / Element | Design Section |
|----------|-----------------|----------------|
| US-0.1 | Note List — sorted cards | Screen 1: Default state |
| US-0.2 | Note List — empty state | Screen 1: Empty state |
| US-0.3 | List — new note at top after redirect | Flow 1: Confirm step |
| US-0.4 | List — updated title after edit | Flow 3: Step 5 |
| US-0.5 | List — deleted note absent | Flow 4: Step 4 |
| US-1.1 | Note List — search input, real-time filter | Screen 1: Search; Pattern: Real-Time Search |
| US-1.2 | Note List — search empty state | Screen 1: Empty (filtered) state |
| US-2.1 | Create Note form | Screen 2 |
| US-2.2 | Create Note — pinned checkbox | Screen 2: Pinned checkbox |
| US-2.3 | Create Note — title validation | Screen 2: Validation state; Pattern: Inline Validation |
| US-2.4 | Create Note — API error banner | Screen 2: API error state; Pattern: Error Banner |
| US-3.1 | Edit Note — pre-filled form | Screen 3: Default (loaded) state |
| US-3.2 | Edit Note — save changes | Screen 3: Interactive Elements (Save) |
| US-3.3 | Edit Note — pinned toggle | Screen 3: Pinned checkbox (pre-checked) |
| US-3.4 | Edit Note — not-found state | Screen 3: Not-found wireframe |
| US-4.1 | Edit Note — delete with confirmation | Screen 3: Delete states; Flow 4 |
| US-4.2 | Edit Note — delete error banners | Screen 3: Delete error states |
| US-8.1 | All pages — mobile layout | Responsive Considerations: Mobile |
| US-8.2 | Edit Note — Save vs Delete distinction | Screen 3: Button layout rationale |
| US-8.3 | All forms — labels, aria-invalid, focus | Accessibility Notes |

---

*UX Mockup generated: 2026-06-17 | Product: QuickNotes v1.0*
