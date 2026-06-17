# User Stories — QuickNotes

**Project:** QuickNotes
**Acronym:** QN
**Version:** 1.0
**Date:** 2026-06-17
**Status:** Active
**Based on:** PRD-QuickNotes v1.0, FRD-QuickNotes v1.0, PERSONAS-QuickNotes v1.0

---

## Personas

| ID | Name | Context |
|----|------|---------|
| PER-01 | Quick Capturer | On-the-go mobile capture — speed and zero friction |
| PER-02 | Focused Reviewer | Desktop triage, search, pin, and cleanup |
| PER-03 | Technical Deployer | App setup, deployment, and integration testing |

---

## Priority Definitions

| Level | Label | Meaning |
|-------|-------|---------|
| P0 | Critical | MVP blocker — must ship for any user to get value |
| P1 | High | Required before launch; high-impact UX or infra |
| P2 | Medium | Next iteration; valuable but not blocking launch |
| P3 | Low | Backlog; nice-to-have |

---

## Epic 0: Note List View (F0)

> The home page (`/`) is the application's entry point. It displays all saved notes sorted pinned-first then newest-first, an empty state when no notes exist, per-note links to the edit page, and a "New note" CTA. This epic covers the six mandatory user story scenarios: US1 (view notes) and the redirect-back visibility checks from US2–US4.

---

### US-0.1: View the Note List (US1)
**As a** Quick Capturer, **I want to** open the app and immediately see all my saved notes, **so that** I can confirm my previous captures are there and quickly pick up where I left off.

**Acceptance Criteria:**
- [ ] Navigating to `/` renders a list of all notes stored in the database
- [ ] Each note entry displays its `title` so the note is identifiable at a glance
- [ ] Notes whose `pinned` flag is `true` are displayed with a visible pinned indicator (e.g., a Gold `#FBCA5C` accent element or pin icon) distinct from un-pinned notes
- [ ] Notes are ordered: pinned notes first (newest-first within pinned), then un-pinned notes (newest-first)
- [ ] Each note card/row is a tappable link that navigates to `/notes/[id]/edit`
- [ ] A "New note" button / link pointing to `/notes/new` is always visible regardless of list content
- [ ] Page fully loads and is interactive in under 500 ms under normal conditions (< 1,000 notes)

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: See the Empty State When No Notes Exist (US1 — empty)
**As a** Quick Capturer, **I want to** see a clear "No notes yet" message when I have no notes, **so that** I know the app is working and I understand how to create my first note.

**Acceptance Criteria:**
- [ ] When the `notes` table has zero rows, the list page renders the text "No notes yet" (exact string or equivalent)
- [ ] The empty state includes a "New note" button that navigates to `/notes/new`
- [ ] No note cards are rendered in the empty state
- [ ] The empty state is visually centered and readable on a 375 px mobile viewport

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: Newly Created Note Appears at the Top of the List (US2 — return)
**As a** Quick Capturer, **I want to** be returned to the home list after creating a note and see my new note at the top, **so that** I can confirm the save succeeded without any additional action.

**Acceptance Criteria:**
- [ ] After a successful `POST /api/notes`, the browser redirects to `/`
- [ ] The newly created note is visible on the list without a page refresh
- [ ] If the note is not pinned, it appears first among un-pinned notes (newest-first)
- [ ] If the note is pinned, it appears first among pinned notes

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.4: Updated Note Title Reflected in the List (US3 — return)
**As a** Focused Reviewer, **I want to** see the updated title in the note list immediately after saving an edit, **so that** I can confirm my change was persisted without having to re-open the note.

**Acceptance Criteria:**
- [ ] After a successful `PUT /api/notes/[id]`, the browser redirects to `/`
- [ ] The note card on the list shows the new title (not the old one)
- [ ] No stale data is displayed; the list reflects the current database state

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.5: Deleted Note No Longer Appears in the List (US4 — return)
**As a** Focused Reviewer, **I want to** return to the list after deleting a note and find it gone, **so that** I have confidence the deletion was permanent.

**Acceptance Criteria:**
- [ ] After a successful `DELETE /api/notes/[id]`, the browser redirects to `/`
- [ ] The deleted note's card no longer appears in the list
- [ ] All remaining notes retain their previous order (pinned-first, newest-first)

**Priority:** P0 | **Feature Ref:** F0

---

## Epic 1: Note Search / Filter (F1)

> A search input on the list view allows real-time, case-insensitive title filtering. This epic covers US5 (search).

---

### US-1.1: Filter Notes by Partial Title (US5)
**As a** Focused Reviewer, **I want to** type part of a title into a search box and see only matching notes, **so that** I can locate a specific note in a long list without scrolling through everything.

**Acceptance Criteria:**
- [ ] A search input is rendered at the top of the list view (`/`)
- [ ] Typing characters into the search input narrows the list to notes whose `title` contains the typed string (case-insensitive substring match)
- [ ] Only notes whose title matches are shown; non-matching notes are hidden
- [ ] The pinned-first, newest-first sort order is preserved within filtered results
- [ ] Clearing the search input (empty string) restores the full, unfiltered list
- [ ] The search input is pre-populated with the active filter value on page load (survives browser refresh when using `?q=` URL param)

**Priority:** P1 | **Feature Ref:** F1

---

### US-1.2: See Empty State When Search Matches Nothing
**As a** Focused Reviewer, **I want to** see a clear message when my search matches no notes, **so that** I know the filter is working and I can adjust my query.

**Acceptance Criteria:**
- [ ] When a non-empty search string matches zero notes, the empty state message is displayed ("No notes yet" or "No notes match your search")
- [ ] No note cards are rendered in this filtered empty state
- [ ] Clearing the search input immediately restores the full note list

**Priority:** P1 | **Feature Ref:** F1

---

## Epic 2: Create Note (F2)

> The `/notes/new` page provides a form to compose a new note. This epic covers US2 (add a note).

---

### US-2.1: Create a New Note with Title and Body (US2)
**As a** Quick Capturer, **I want to** fill in a title and optional body on the "New note" page and submit the form, **so that** my note is saved and I am returned to the list instantly.

**Acceptance Criteria:**
- [ ] Navigating to `/notes/new` renders a blank form with: a `title` text input, a `body` textarea, a `pinned` checkbox (unchecked by default), and a Gold-accented submit CTA button
- [ ] The `title` input receives focus automatically on page load — no extra tap required to start typing
- [ ] Filling `title` = "Groceries" and `body` = "milk, eggs" and submitting calls `POST /api/notes` with `{ "title": "Groceries", "body": "milk, eggs", "pinned": false }`
- [ ] On `201` response, the browser redirects to `/` where the new "Groceries" note is visible
- [ ] The "New note" link on `/` navigates to `/notes/new`
- [ ] The form renders correctly on a 375 px mobile viewport with no horizontal scroll

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.2: Create a Pinned Note
**As a** Quick Capturer, **I want to** check the "pinned" toggle when creating a note, **so that** the note stays at the top of my list for easy reference.

**Acceptance Criteria:**
- [ ] Checking the `pinned` checkbox and submitting sends `"pinned": true` in the `POST /api/notes` request body
- [ ] After redirect to `/`, the new note appears in the pinned section at the top of the list
- [ ] The pinned indicator (Gold accent or icon) is visible on the note card

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.3: Block Submission When Title Is Empty
**As a** Quick Capturer, **I want to** be prevented from saving a note with no title, **so that** I don't accidentally create a nameless note I can't find later.

**Acceptance Criteria:**
- [ ] If the title input is empty (or whitespace-only) on submit, no API call is made
- [ ] An inline validation message "Title is required" is displayed beneath the title input
- [ ] The form stays on screen with all other field values intact
- [ ] Entering a valid title and resubmitting proceeds normally

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.4: See an Error Banner on API Failure
**As a** Quick Capturer, **I want to** see a clear error message if the note fails to save, **so that** I know to retry and don't lose my text.

**Acceptance Criteria:**
- [ ] If `POST /api/notes` returns a non-2xx response, an error banner is displayed (e.g., "Something went wrong. Please try again.")
- [ ] The form fields retain their current values — the user does not lose typed content
- [ ] The user can retry submission without re-entering data

**Priority:** P0 | **Feature Ref:** F2

---

## Epic 3: Edit Note (F3)

> The `/notes/[id]/edit` page pre-fills a form with the note's current values and allows updates. This epic covers US3 (edit a note).

---

### US-3.1: Open a Note and See Its Current Values Pre-filled (US3 — open)
**As a** Focused Reviewer, **I want to** open a note from the list and see its current title, body, and pinned status already in the form, **so that** I can make targeted edits without re-entering everything.

**Acceptance Criteria:**
- [ ] Clicking a note card on `/` navigates to `/notes/[id]/edit`
- [ ] The title input is pre-filled with the note's current `title`
- [ ] The body textarea is pre-filled with the note's current `body` (empty string if body is null)
- [ ] The pinned checkbox is checked if `note.pinned === true`, unchecked if `false`
- [ ] The form is rendered using data fetched from `GET /api/notes/[id]` (or a direct DB query)

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.2: Save an Edited Note and See the Updated Title in the List (US3 — save)
**As a** Focused Reviewer, **I want to** change the title of a note and save it, **so that** the list immediately reflects the new title on my return.

**Acceptance Criteria:**
- [ ] Changing the title value and clicking "Save" calls `PUT /api/notes/[id]` with the updated `{ title, body, pinned }`
- [ ] On `200` response, the browser redirects to `/`
- [ ] The note card on the list shows the updated title
- [ ] `created_at` is not changed by the PUT operation

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.3: Toggle Pinned Status on an Existing Note
**As a** Focused Reviewer, **I want to** pin or unpin a note from its edit page, **so that** I can promote important notes to the top of the list or demote them when they're no longer urgent.

**Acceptance Criteria:**
- [ ] Checking or unchecking the `pinned` checkbox and saving sends the updated `pinned` value in `PUT /api/notes/[id]`
- [ ] On return to `/`, the note appears in the correct section (pinned or un-pinned) based on the new value
- [ ] The pinned indicator on the note card reflects the updated state

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.4: See Not-Found State for a Missing Note
**As a** Focused Reviewer, **I want to** see a clear "Note not found" message if I navigate to an edit URL that no longer exists, **so that** I understand the note was deleted and can return to the list.

**Acceptance Criteria:**
- [ ] Navigating to `/notes/[id]/edit` for a non-existent `id` renders a not-found message: "Note not found."
- [ ] The form is not rendered in the not-found state
- [ ] A link back to `/` is provided on the not-found page
- [ ] A non-integer `id` segment in the URL (e.g., `/notes/abc/edit`) also triggers the not-found state

**Priority:** P0 | **Feature Ref:** F3

---

## Epic 4: Delete Note (F4)

> The delete action on the edit page removes a note after a confirmation step. This epic covers US4 (delete a note).

---

### US-4.1: Delete a Note with Confirmation (US4)
**As a** Focused Reviewer, **I want to** delete a note from its edit page after confirming my intent, **so that** I can remove stale notes without accidentally losing ones I still need.

**Acceptance Criteria:**
- [ ] A "Delete" button is visible on `/notes/[id]/edit` alongside the Save CTA
- [ ] Clicking "Delete" triggers a confirmation step (inline confirm UI or `window.confirm()` dialog) before any API call is made
- [ ] The confirmation prompt displays the note's title (e.g., "Delete 'Meeting notes'?") so the user can verify they are deleting the correct note
- [ ] Confirming the deletion calls `DELETE /api/notes/[id]` and on `204` response redirects to `/`
- [ ] The deleted note no longer appears in the list after redirect
- [ ] Cancelling the confirmation returns the form to its normal state with no changes made and no API call issued

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.2: See Error Message If Deletion Fails
**As a** Focused Reviewer, **I want to** see an error if the delete request fails, **so that** I know to retry and don't assume the note was removed when it wasn't.

**Acceptance Criteria:**
- [ ] If `DELETE /api/notes/[id]` returns a `404`, an error banner is displayed: "Note not found. It may have already been deleted." with a link to `/`
- [ ] If `DELETE /api/notes/[id]` returns a `500` or the network is unreachable, an error banner is displayed: "Could not delete note. Please try again."
- [ ] The edit form remains accessible after a failed delete (user can navigate away manually)

**Priority:** P0 | **Feature Ref:** F4

---

## Epic 5: REST API (F5)

> The JSON REST endpoints back all UI interactions and are independently callable for testing. Primarily used by the Technical Deployer for integration testing.

---

### US-5.1: Retrieve All Notes via API
**As a** Technical Deployer, **I want to** call `GET /api/notes` and receive the full sorted note list as JSON, **so that** I can validate the API returns correct data independent of the UI.

**Acceptance Criteria:**
- [ ] `GET /api/notes` returns HTTP `200` with `Content-Type: application/json`
- [ ] The response body is a JSON array of Note objects (may be `[]` if no notes exist)
- [ ] Notes are ordered: pinned-first (`pinned DESC`), then newest-first (`created_at DESC`)
- [ ] Each Note object contains: `id`, `title`, `body`, `pinned`, `created_at`
- [ ] `GET /api/notes?q=<string>` returns only notes whose `title` contains the string (case-insensitive); sort order is preserved

**Priority:** P0 | **Feature Ref:** F5

---

### US-5.2: Create a Note via API
**As a** Technical Deployer, **I want to** `POST` to `/api/notes` with a JSON body and receive the created note back, **so that** I can verify the create endpoint handles validation and persistence correctly.

**Acceptance Criteria:**
- [ ] `POST /api/notes` with a valid `{ "title": "...", "body": "...", "pinned": false }` body returns `201` with the created Note object (including auto-assigned `id` and `created_at`)
- [ ] `POST /api/notes` with a missing or empty `title` returns `400` with `{ "error": "TITLE_REQUIRED", "message": "Title is required" }`
- [ ] `POST /api/notes` with malformed JSON returns `400` with `{ "error": "BAD_REQUEST", "message": "Invalid request body" }`
- [ ] `pinned` defaults to `false` if not provided
- [ ] `body` may be omitted (stored as `NULL`)

**Priority:** P0 | **Feature Ref:** F5

---

### US-5.3: Fetch, Update, and Delete a Single Note via API
**As a** Technical Deployer, **I want to** use `GET`, `PUT`, and `DELETE` on `/api/notes/[id]`, **so that** I can confirm all per-note endpoints work correctly and return the right status codes.

**Acceptance Criteria:**
- [ ] `GET /api/notes/[id]` for a valid existing `id` returns `200` with the Note object
- [ ] `GET /api/notes/[id]` for a non-existent `id` returns `404` with `{ "error": "NOTE_NOT_FOUND" }`
- [ ] `PUT /api/notes/[id]` with valid body returns `200` with the updated Note object; `created_at` is unchanged
- [ ] `PUT /api/notes/[id]` with empty `title` returns `400` with `{ "error": "TITLE_REQUIRED" }`
- [ ] `PUT /api/notes/[id]` for a non-existent `id` returns `404` with `{ "error": "NOTE_NOT_FOUND" }`
- [ ] `DELETE /api/notes/[id]` for an existing note returns `204` with no response body
- [ ] `DELETE /api/notes/[id]` for a non-existent `id` returns `404` with `{ "error": "NOTE_NOT_FOUND" }`
- [ ] A non-integer `id` segment on any `/[id]` route returns `404`

**Priority:** P0 | **Feature Ref:** F5

---

## Epic 6: Health Endpoint (F6)

> A liveness endpoint confirms the application process is alive. Used by orchestration, CI smoke tests, and the Technical Deployer.

---

### US-6.1: Confirm App Liveness via Health Endpoint
**As a** Technical Deployer, **I want to** call `GET /api/health` and receive `{"status":"ok"}`, **so that** I can verify the application started successfully without querying the database directly.

**Acceptance Criteria:**
- [ ] `GET /api/health` returns HTTP `200` with `Content-Type: application/json`
- [ ] The response body is exactly `{"status":"ok"}`
- [ ] The endpoint performs no database query (liveness check only)
- [ ] The endpoint responds within 200 ms under normal conditions
- [ ] No authentication or special headers are required to call this endpoint
- [ ] Non-GET methods (e.g., `POST /api/health`) return `405 Method Not Allowed`

**Priority:** P0 | **Feature Ref:** F6

---

## Epic 7: Auto-Migration on Startup (F7)

> On server start, an idempotent SQL migration creates the `notes` table if it does not exist. This ensures zero manual database setup.

---

### US-7.1: Notes Table Created Automatically on First Start
**As a** Technical Deployer, **I want to** start the app with only a `DATABASE_URL` environment variable set and have the `notes` table created automatically, **so that** I never need to run any SQL manually before using the app.

**Acceptance Criteria:**
- [ ] On server startup, the app executes `CREATE TABLE IF NOT EXISTS notes (...)` before accepting HTTP requests
- [ ] The `notes` table schema matches the DDL: `id serial PK`, `title text NOT NULL`, `body text nullable`, `pinned boolean NOT NULL DEFAULT false`, `created_at timestamptz NOT NULL DEFAULT now()`
- [ ] The migration runs using the connection string from `process.env.DATABASE_URL` — no credentials are hard-coded
- [ ] After startup completes, `GET /api/health` returns `200` and note CRUD endpoints are functional

**Priority:** P0 | **Feature Ref:** F7

---

### US-7.2: Data Survives a Server Restart and Migration Re-Run (US6 — persistence)
**As a** Technical Deployer, **I want to** restart the server and find all existing notes intact with no migration errors, **so that** I can trust the app is safe to redeploy without risking data loss.

**Acceptance Criteria:**
- [ ] After server restart, `GET /api/notes` returns the same notes that existed before the restart
- [ ] The migration (`CREATE TABLE IF NOT EXISTS`) runs silently as a no-op when the table already exists — no errors, no data loss
- [ ] A note created via `POST /api/notes` before restart is retrievable via `GET /api/notes/[id]` after restart (US6 persistence requirement)
- [ ] No hard-coded credentials appear anywhere in source files; all connection details come from `DATABASE_URL`

**Priority:** P0 | **Feature Ref:** F7

---

### US-7.3: Clear Error on Missing DATABASE_URL
**As a** Technical Deployer, **I want to** see a clear error log if `DATABASE_URL` is not set, **so that** I can immediately diagnose misconfigured deployments without guessing.

**Acceptance Criteria:**
- [ ] If `DATABASE_URL` is absent or empty at startup, the process exits with a non-zero exit code
- [ ] The error log contains the message: "DATABASE_URL environment variable is not set" (or equivalent clear message)
- [ ] The server does not start serving HTTP requests in this error state

**Priority:** P0 | **Feature Ref:** F7

---

## Epic 8: Mobile-First UI & Design System (F8)

> All pages share a consistent mobile-first design system using plain CSS / CSS Modules with a three-token palette.

---

### US-8.1: Use the App Comfortably on a Mobile Viewport
**As a** Quick Capturer, **I want to** use the app on a 375 px wide screen without pinching, zooming, or mis-tapping, **so that** I can capture notes one-handed on the go.

**Acceptance Criteria:**
- [ ] All pages render in a single-column layout with no horizontal scroll at 375 px viewport width
- [ ] All interactive elements (buttons, inputs, links, checkboxes) have a minimum tap target of 44 × 44 px
- [ ] Text uses near-black `#0A0A0A` on white `#FFFFFF` surfaces with sufficient contrast
- [ ] The Gold `#FBCA5C` accent is applied only to primary CTA buttons, the pinned indicator, and active/focus states — it covers ≤ 10% of any view's visual area
- [ ] No external CSS framework (Tailwind, Bootstrap, etc.) or CSS-in-JS library is used

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.2: Submit and Delete Buttons Are Visually Distinct
**As a** Quick Capturer, **I want to** clearly distinguish the "Save" button from the "Delete" button on the edit page, **so that** I don't accidentally delete a note when trying to save it.

**Acceptance Criteria:**
- [ ] The Save / Create CTA button uses the Gold `#FBCA5C` background with near-black `#0A0A0A` text
- [ ] The Delete button does not use the Gold accent (acceptable: neutral grey, red, or outline style)
- [ ] Both buttons meet the 44 × 44 px minimum tap target
- [ ] The visual difference between the two buttons is immediately apparent without relying on colour alone (e.g., label text, position, or style variant)

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.3: All Form Inputs Are Accessible
**As a** Quick Capturer, **I want to** have every form field clearly labelled, **so that** I can use the app with assistive technology or quickly identify fields at a glance.

**Acceptance Criteria:**
- [ ] Every `<input>` and `<textarea>` has an associated `<label>` (via `for`/`id` or wrapping element)
- [ ] Validation error messages use `aria-invalid="true"` on the invalid input and display in red-tinted text (`#CC0000`)
- [ ] Focus styles are visible on all interactive elements (no `outline: none` without a replacement)
- [ ] The pinned indicator conveys state through a non-colour cue (e.g., pin icon, text label, or layout position) in addition to the Gold accent

**Priority:** P1 | **Feature Ref:** F8

---

## Epic 9: Iframe Compatibility & Port Binding (F9)

> The app must render inside a cross-origin iframe and bind to `0.0.0.0:3000` for container networking.

---

### US-9.1: App Renders Inside an Embedded Preview Iframe
**As a** Technical Deployer, **I want to** embed the app in a cross-origin `<iframe>` without any frame-blocking errors, **so that** the preview environment can display the app correctly.

**Acceptance Criteria:**
- [ ] HTTP responses do not include an `X-Frame-Options` header
- [ ] If a `Content-Security-Policy` header is present, it does not contain `frame-ancestors 'none'` or `frame-ancestors 'self'`
- [ ] The app renders visibly inside a cross-origin `<iframe>` with no blank page, `SecurityError`, or browser console frame-blocking warnings
- [ ] `next.config.mjs` (or `next.config.js`) exists at the project root; `next.config.ts` does not exist

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.2: App Is Reachable on Port 3000 from Container Networking
**As a** Technical Deployer, **I want to** reach the app at `http://<host>:3000` from within the container network, **so that** the preview host and other services can connect to it reliably.

**Acceptance Criteria:**
- [ ] The HTTP server binds to `0.0.0.0:3000` (not `127.0.0.1` or `localhost`)
- [ ] The app is reachable from outside the container at port `3000`
- [ ] Default port is `3000`; the `PORT` environment variable may optionally override it
- [ ] The `next.config.mjs` configuration does not introduce any port binding restrictions

**Priority:** P0 | **Feature Ref:** F9

---

## Story Index

| Story ID | Title | Priority | Feature | Primary Persona |
|----------|-------|----------|---------|----------------|
| US-0.1 | View the Note List | P0 | F0 | PER-01 Quick Capturer |
| US-0.2 | Empty State When No Notes Exist | P0 | F0 | PER-01 Quick Capturer |
| US-0.3 | Newly Created Note Appears at Top | P0 | F0 | PER-01 Quick Capturer |
| US-0.4 | Updated Note Title Reflected in List | P0 | F0 | PER-02 Focused Reviewer |
| US-0.5 | Deleted Note No Longer in List | P0 | F0 | PER-02 Focused Reviewer |
| US-1.1 | Filter Notes by Partial Title | P1 | F1 | PER-02 Focused Reviewer |
| US-1.2 | Empty State When Search Matches Nothing | P1 | F1 | PER-02 Focused Reviewer |
| US-2.1 | Create a New Note with Title and Body | P0 | F2 | PER-01 Quick Capturer |
| US-2.2 | Create a Pinned Note | P0 | F2 | PER-01 Quick Capturer |
| US-2.3 | Block Submission When Title Is Empty | P0 | F2 | PER-01 Quick Capturer |
| US-2.4 | Error Banner on API Failure (Create) | P0 | F2 | PER-01 Quick Capturer |
| US-3.1 | Open Note with Pre-filled Values | P0 | F3 | PER-02 Focused Reviewer |
| US-3.2 | Save Edit and See Updated Title in List | P0 | F3 | PER-02 Focused Reviewer |
| US-3.3 | Toggle Pinned Status on Existing Note | P0 | F3 | PER-02 Focused Reviewer |
| US-3.4 | Not-Found State for Missing Note | P0 | F3 | PER-02 Focused Reviewer |
| US-4.1 | Delete a Note with Confirmation | P0 | F4 | PER-02 Focused Reviewer |
| US-4.2 | Error Message If Deletion Fails | P0 | F4 | PER-02 Focused Reviewer |
| US-5.1 | Retrieve All Notes via API | P0 | F5 | PER-03 Technical Deployer |
| US-5.2 | Create a Note via API | P0 | F5 | PER-03 Technical Deployer |
| US-5.3 | Fetch, Update, and Delete via API | P0 | F5 | PER-03 Technical Deployer |
| US-6.1 | Confirm App Liveness via Health Endpoint | P0 | F6 | PER-03 Technical Deployer |
| US-7.1 | Notes Table Created Automatically | P0 | F7 | PER-03 Technical Deployer |
| US-7.2 | Data Survives Server Restart | P0 | F7 | PER-03 Technical Deployer |
| US-7.3 | Clear Error on Missing DATABASE_URL | P0 | F7 | PER-03 Technical Deployer |
| US-8.1 | Use App on Mobile Viewport | P1 | F8 | PER-01 Quick Capturer |
| US-8.2 | Submit and Delete Buttons Are Distinct | P1 | F8 | PER-01 Quick Capturer |
| US-8.3 | All Form Inputs Are Accessible | P1 | F8 | PER-01 Quick Capturer |
| US-9.1 | App Renders Inside Iframe | P0 | F9 | PER-03 Technical Deployer |
| US-9.2 | App Reachable on Port 3000 | P0 | F9 | PER-03 Technical Deployer |

**Total: 29 stories across 10 epics**

---

## Mandatory User Story Coverage Map

The six user stories from the project definition are satisfied by the following stories:

| Project Definition | Covered By |
|-------------------|-----------|
| **US1** — View notes: list (title, snippet, pinned indicator); empty state "No notes yet" + "New note" | US-0.1, US-0.2 |
| **US2** — Add note: from `/`, tap "New note", fill title="Groceries", body="milk, eggs", submit, new note visible | US-2.1, US-0.3 |
| **US3** — Edit note: open, change title, save, list reflects it | US-3.1, US-3.2, US-0.4 |
| **US4** — Delete note: from edit page, tap Delete, confirm, note gone from `/` | US-4.1, US-0.5 |
| **US5** — Search: typing partial title narrows list to matches | US-1.1 |
| **US6** — Persistence: data survives page reload (PostgreSQL, not memory) | US-7.2 |

---

*UserStories generated: 2026-06-17 | Product: QuickNotes v1.0 | Derived from: PRD-QuickNotes.md, FRD-QuickNotes.md, PERSONAS-QuickNotes.md*
