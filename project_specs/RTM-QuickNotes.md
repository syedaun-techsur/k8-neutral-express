# Requirements Traceability Matrix — QuickNotes

**Project:** QuickNotes
**Acronym:** QN
**Version:** 1.0
**Date:** 2026-06-17
**Status:** Active
**Based on:** PRD-QuickNotes v1.0 · FRD-QuickNotes v1.0 · TechArch-QuickNotes v1.0 · UserStories-QuickNotes v1.0

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between all QuickNotes specification artefacts. It links every PRD feature to its FRD functional specification, the TechArch component that implements it, and the User Stories that verify it. The RTM is the authoritative reference for confirming that no requirement is orphaned, that every implementation decision is grounded in a specification, and that every story has a path back to a business requirement.

QuickNotes is a single-user, no-auth, mobile-first note-taking MVP. It delivers one data entity (`notes`) and ten discrete features spanning CRUD operations, a REST API, a health endpoint, an auto-migration startup hook, a mobile-first design system, and iframe/container compatibility. The matrix spans all ten PRD features (F0–F9), twenty-nine user stories (US-0.1 through US-9.2), and all TechArch components defined in the technical architecture document.

Traceability flows in two directions. Top-down traceability begins with a business requirement in the PRD and follows the chain through the FRD functional specification, into the TechArch component, and finally to the User Stories and test cases that confirm correct implementation. Bottom-up traceability begins with any User Story or test case and traces back through the implementation spec to the originating business requirement, ensuring that nothing is built without a stated need.

---

## 2. Requirements Summary

### PRD Features (F0–F9)

- **F0 — Note List View (`/`):** P0 · Home page renders all notes sorted pinned-first then newest-first; empty state when no notes exist; per-note links to edit; "New note" CTA
- **F1 — Note Search / Filter:** P1 · Real-time case-insensitive title filter via search box on the list view; pinned-first sort preserved; empty state on zero matches
- **F2 — Create Note (`/notes/new`):** P0 · Form with required title, optional body, pinned checkbox; client + server title validation; POST /api/notes; redirect on success
- **F3 — Edit Note (`/notes/[id]/edit`):** P0 · Pre-populated form from GET /api/notes/[id]; PUT on save; not-found state; redirect on success
- **F4 — Delete Note:** P0 · Delete action on edit page; confirmation step showing note title; DELETE /api/notes/[id]; redirect on success
- **F5 — REST API:** P0 · Five JSON endpoints: GET/POST /api/notes and GET/PUT/DELETE /api/notes/[id]; standard HTTP status codes; server-side title validation
- **F6 — Health Endpoint:** P0 · GET /api/health returns 200 `{"status":"ok"}`; no DB query; sub-200 ms liveness check
- **F7 — Auto-Migration on Startup:** P0 · Idempotent `CREATE TABLE IF NOT EXISTS notes (...)` via instrumentation.js before first request; DATABASE_URL from env; hard failure on missing URL
- **F8 — Mobile-First UI & Design System:** P1 · Three-token palette (#0A0A0A / #FFFFFF / #FBCA5C); single-column mobile-first layout; 44×44 px tap targets; plain CSS/CSS Modules only
- **F9 — Iframe Compatibility & Port Binding:** P0 · Server binds to 0.0.0.0:3000; no X-Frame-Options or frame-ancestors CSP; next.config.mjs (never .ts)

### FRD Feature Sections (F00–F09)

- **F00** — Note List View behaviour, sort order, empty state, server-side DB query
- **F01** — Search keystroke-reactive filtering (client-side or server-side URL param), ILIKE query
- **F02** — Create form inputs/validation, POST flow, error states
- **F03** — Edit form pre-population, PUT flow, 404 handling
- **F04** — Delete confirmation UI, DELETE flow, cancel path
- **F05** — Full REST API process definitions, validation rules, error catalog
- **F06** — Health endpoint liveness spec, no-DB constraint
- **F07** — Auto-migration startup hook, DATABASE_URL validation, DDL
- **F08** — Design system tokens, layout rules, component specs, accessibility rules
- **F09** — Iframe header constraints, port binding, next.config.mjs format

### TechArch Components

- **SPEC-001** — Monolithic Next.js Full-Stack Architecture Pattern
- **SPEC-002** — instrumentation.js Startup Migration Hook
- **SPEC-003** — lib/db.js Database Client Singleton (pg.Pool)
- **SPEC-004** — app/api/notes/route.js Collection Endpoint (GET, POST)
- **SPEC-005** — app/api/notes/[id]/route.js Item Endpoint (GET, PUT, DELETE)
- **SPEC-006** — app/api/health/route.js Health Check Handler
- **SPEC-007** — app/page.js Note List View (Server Component)
- **SPEC-008** — app/notes/new/page.js Create Note (Client Component)
- **SPEC-009** — app/notes/[id]/edit/page.js Edit + Delete Note (Server + Client)
- **SPEC-010** — next.config.mjs Configuration (iframe headers, port binding)
- **SPEC-011** — PostgreSQL Data Model & DDL (notes table schema)
- **SPEC-012** — Security Architecture (parameterized queries, credential mgmt, input validation)
- **SPEC-013** — CSS Modules Design System (globals.css, NoteCard, NoteForm)

### User Stories (US-0.1 – US-9.2)

- **29 stories** across 10 epics covering all features F0–F9
- **24 stories at P0** (Critical / MVP blocker)
- **5 stories at P1** (High / required before launch)
- **3 primary personas:** PER-01 Quick Capturer · PER-02 Focused Reviewer · PER-03 Technical Deployer

---

## 3. Traceability Matrix

This table links each PRD feature to its FRD specification section, implementing TechArch component(s), and covering User Stories.

| PRD Feature | Priority | FRD Section | TechArch Component(s) | User Stories |
|---|---|---|---|---|
| F0: Note List View | P0 | F00 | SPEC-001, SPEC-007, SPEC-011 | US-0.1, US-0.2, US-0.3, US-0.4, US-0.5 |
| F1: Note Search / Filter | P1 | F01 | SPEC-007, SPEC-004 | US-1.1, US-1.2 |
| F2: Create Note | P0 | F02 | SPEC-001, SPEC-008, SPEC-004, SPEC-012 | US-2.1, US-2.2, US-2.3, US-2.4 |
| F3: Edit Note | P0 | F03 | SPEC-001, SPEC-009, SPEC-005, SPEC-012 | US-3.1, US-3.2, US-3.3, US-3.4 |
| F4: Delete Note | P0 | F04 | SPEC-009, SPEC-005 | US-4.1, US-4.2 |
| F5: REST API | P0 | F05, Y1 | SPEC-004, SPEC-005, SPEC-003, SPEC-012 | US-5.1, US-5.2, US-5.3 |
| F6: Health Endpoint | P0 | F06, Y1 | SPEC-006 | US-6.1 |
| F7: Auto-Migration | P0 | F07, Y0 | SPEC-002, SPEC-003, SPEC-011 | US-7.1, US-7.2, US-7.3 |
| F8: Mobile-First UI | P1 | F08 | SPEC-013, SPEC-007, SPEC-008, SPEC-009 | US-8.1, US-8.2, US-8.3 |
| F9: Iframe & Port | P0 | F09 | SPEC-010, SPEC-001 | US-9.1, US-9.2 |

---

## 4. Requirements Detail

Each PRD feature is expanded below with its FRD functional requirements and the TechArch components responsible for implementation.

---

### F0: Note List View (`/`)

**PRD Priority:** P0 · **FRD Section:** F00 · **Route:** `GET /`

**FRD Functional Requirements:**
- Server component queries `SELECT * FROM notes ORDER BY pinned DESC, created_at DESC`
- Empty state "No notes yet" rendered when result set is empty
- Each note card displays `title` and wraps in `<Link>` to `/notes/[id]/edit`
- "New note" button always rendered pointing to `/notes/new`
- `?q=` query parameter forwarded to data query (connects to F01)
- Error state "Could not load notes. Please try again." on DB unavailable

**Implementing TechArch Components:**
- SPEC-001 (Monolithic architecture — RSC direct DB access)
- SPEC-007 (`app/page.js` — server component, DB query, empty state, search input)
- SPEC-011 (PostgreSQL `notes` table, sort query pattern)

**User Stories:** US-0.1, US-0.2, US-0.3, US-0.4, US-0.5

---

### F1: Note Search / Filter

**PRD Priority:** P1 · **FRD Section:** F01 · **Route:** `GET /?q=`

**FRD Functional Requirements:**
- Search input rendered at top of list view; no submit button — keystroke-reactive
- Two acceptable implementations: (A) client-side DOM filtering or (B) server-side `?q=` URL parameter with debounce
- Filter updates within 200 ms of each keystroke
- Case-insensitive substring match on `title` (`ILIKE '%q%'`)
- Pinned-first, newest-first sort preserved in filtered results
- Empty state rendered when filter matches zero notes
- Search input pre-populated with active `q` value on load

**Implementing TechArch Components:**
- SPEC-007 (`app/page.js` — pre-populated search input, filtered query with `searchParams.q`)
- SPEC-004 (`GET /api/notes?q=` ILIKE filter, parameterized query)

**User Stories:** US-1.1, US-1.2

---

### F2: Create Note (`/notes/new`)

**PRD Priority:** P0 · **FRD Section:** F02 · **Route:** `GET /notes/new`, `POST /api/notes`

**FRD Functional Requirements:**
- Form renders: `title` (text input, required, auto-focused), `body` (textarea, optional), `pinned` (checkbox, default unchecked)
- Client-side validation: `title.trim()` empty → inline "Title is required"; no API call
- On valid submit: `POST /api/notes` with `{ "title": trimmed, "body": value, "pinned": bool }`
- On `201`: redirect to `/`; on `400`: display API error message; on other non-2xx: generic error banner
- Error codes: `TITLE_REQUIRED` (400), `INTERNAL_ERROR` (500)

**Implementing TechArch Components:**
- SPEC-001 (App Router Client Component pattern)
- SPEC-008 (`app/notes/new/page.js` — blank NoteForm, POST, redirect)
- SPEC-004 (`POST /api/notes` — title validation, INSERT, 201 response)
- SPEC-012 (Input validation: title non-empty client + server; parameterized INSERT)

**User Stories:** US-2.1, US-2.2, US-2.3, US-2.4

---

### F3: Edit Note (`/notes/[id]/edit`)

**PRD Priority:** P0 · **FRD Section:** F03 · **Route:** `GET /notes/[id]/edit`, `PUT /api/notes/[id]`

**FRD Functional Requirements:**
- Server component fetches note via `GET /api/notes/[id]` or direct DB query
- If 404/null: render "Note not found." with link to `/`; form not shown
- If found: pre-populate title input, body textarea, pinned checkbox with current values
- Client-side validation: `title.trim()` empty → "Title is required"; no API call
- On valid save: `PUT /api/notes/[id]`; on `200`: redirect to `/`
- On `404` during save: "Note not found. It may have been deleted."
- `id` must parse as positive integer; non-integer → not-found state

**Implementing TechArch Components:**
- SPEC-001 (RSC + Client Component hybrid pattern)
- SPEC-009 (`app/notes/[id]/edit/page.js` — server fetch, pre-populated NoteForm, PUT handler)
- SPEC-005 (`GET /api/notes/[id]`, `PUT /api/notes/[id]` — fetch, validate, update)
- SPEC-012 (id validation, title validation, parameterized UPDATE)

**User Stories:** US-3.1, US-3.2, US-3.3, US-3.4

---

### F4: Delete Note

**PRD Priority:** P0 · **FRD Section:** F04 · **Route:** `DELETE /api/notes/[id]` (from `/notes/[id]/edit`)

**FRD Functional Requirements:**
- "Delete" button co-located on edit page alongside Save CTA; must not use Gold accent
- Clicking "Delete" triggers confirmation step before any API call
- Confirmation must display note title (e.g., "Delete 'Meeting notes'?")
- On confirm: `DELETE /api/notes/[id]`; on `204`: redirect to `/`
- On cancel: no API call; form returns to normal state
- On `404`: "Note not found. It may have already been deleted." + link to `/`
- On other non-2xx: "Could not delete note. Please try again."

**Implementing TechArch Components:**
- SPEC-009 (`app/notes/[id]/edit/page.js` — Delete button, confirmation UI, DELETE handler, redirect)
- SPEC-005 (`DELETE /api/notes/[id]` — `DELETE FROM notes WHERE id=$1 RETURNING id`; 204 / 404)

**User Stories:** US-4.1, US-4.2

---

### F5: REST API

**PRD Priority:** P0 · **FRD Section:** F05, Y1 · **Routes:** `/api/notes`, `/api/notes/[id]`

**FRD Functional Requirements:**
- `GET /api/notes`: optional `?q=` ILIKE filter; returns `200 Note[]`
- `POST /api/notes`: title validation (`TITLE_REQUIRED` 400 if empty); INSERT; returns `201 Note`
- `GET /api/notes/[id]`: id must be positive integer; returns `200 Note` or `404 NOTE_NOT_FOUND`
- `PUT /api/notes/[id]`: id validation + title validation; UPDATE; returns `200 Note` or `400`/`404`
- `DELETE /api/notes/[id]`: id validation; DELETE; returns `204` or `404 NOTE_NOT_FOUND`
- All endpoints: `Content-Type: application/json`; parameterized queries only
- Error codes: `TITLE_REQUIRED`, `NOTE_NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_ERROR`

**Implementing TechArch Components:**
- SPEC-004 (`app/api/notes/route.js` — GET collection, POST create)
- SPEC-005 (`app/api/notes/[id]/route.js` — GET item, PUT update, DELETE delete)
- SPEC-003 (`lib/db.js` — pool query helper used by all handlers)
- SPEC-012 (parameterized queries, id integer validation, title trim validation)

**User Stories:** US-5.1, US-5.2, US-5.3

---

### F6: Health Endpoint

**PRD Priority:** P0 · **FRD Section:** F06, Y1 · **Route:** `GET /api/health`

**FRD Functional Requirements:**
- Returns `200 {"status":"ok"}` with `Content-Type: application/json`
- No database query performed (liveness check only — not readiness)
- Responds regardless of database state
- No authentication or special headers required
- Non-GET methods return `405 Method Not Allowed`
- Response within 200 ms under normal conditions

**Implementing TechArch Components:**
- SPEC-006 (`app/api/health/route.js` — fixed 200 response, no DB dependency)

**User Stories:** US-6.1

---

### F7: Auto-Migration on Startup

**PRD Priority:** P0 · **FRD Section:** F07, Y0 · **Hook:** `instrumentation.js register()`

**FRD Functional Requirements:**
- `register()` export in `instrumentation.js` runs once before HTTP server accepts connections
- Reads `process.env.DATABASE_URL`; exits with non-zero code and logs error if absent
- Executes idempotent DDL: `CREATE TABLE IF NOT EXISTS notes (id serial PK, title text NOT NULL, body text, pinned boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now())`
- On SQL failure: logs error and exits with non-zero code
- On success: releases connection; server proceeds normally
- Migration must never DROP or TRUNCATE the table

**Implementing TechArch Components:**
- SPEC-002 (`instrumentation.js` — `register()` function, pg.Client, CREATE TABLE IF NOT EXISTS, process.exit(1))
- SPEC-003 (`lib/db.js` — DATABASE_URL singleton, never hard-coded)
- SPEC-011 (PostgreSQL notes table DDL — authoritative schema definition)

**User Stories:** US-7.1, US-7.2, US-7.3

---

### F8: Mobile-First UI & Design System

**PRD Priority:** P1 · **FRD Section:** F08 · **Scope:** All pages

**FRD Functional Requirements:**
- Three colour tokens: text `#0A0A0A`, surface `#FFFFFF`, accent `#FBCA5C` (≤10% of any view)
- Base layout: single-column, `max-width: 600px`, centered, `padding: 0 1rem`
- Mobile-first: narrow-viewport rules first; `@media (min-width: ...)` for wider screens
- All interactive elements: minimum 44×44 px tap target
- Save/CTA button: Gold `#FBCA5C` background, `#0A0A0A` text
- Delete button: must NOT use Gold accent
- Every `<input>` and `<textarea>` must have an associated `<label>`
- Validation errors: `aria-invalid="true"` + red-tinted `#CC0000` text
- No Tailwind, Bootstrap, Material UI, styled-components, or any CSS framework/CSS-in-JS
- Plain CSS or CSS Modules only

**Implementing TechArch Components:**
- SPEC-013 (`app/globals.css`, `NoteCard.module.css`, `NoteForm.module.css` — design tokens, layout, component styles)
- SPEC-007 (`app/page.js` — note list layout, note cards, search input styling)
- SPEC-008 (`app/notes/new/page.js` — create form layout, Gold CTA)
- SPEC-009 (`app/notes/[id]/edit/page.js` — edit form layout, Gold save CTA, non-Gold delete button)

**User Stories:** US-8.1, US-8.2, US-8.3

---

### F9: Iframe Compatibility & Port Binding

**PRD Priority:** P0 · **FRD Section:** F09 · **Scope:** Server config, `next.config.mjs`

**FRD Functional Requirements:**
- Next.js server binds to `0.0.0.0:3000` — not `127.0.0.1` or `localhost`
- HTTP responses must NOT include `X-Frame-Options` header on any route
- If CSP header present: must NOT contain `frame-ancestors 'none'` or `frame-ancestors 'self'`
- Config file must be `next.config.mjs` (ES Module) or `next.config.js`; `next.config.ts` must not exist
- Default port is `3000`; `PORT` env var may optionally override

**Implementing TechArch Components:**
- SPEC-010 (`next.config.mjs` — intentionally empty headers array; no X-Frame-Options; ES Module format)
- SPEC-001 (Architectural decision: `0.0.0.0` binding, no frame-blocking headers, `.mjs` config format)

**User Stories:** US-9.1, US-9.2

---

## 5. Test Case Coverage Matrix

Test cases are derived directly from the Acceptance Criteria of each User Story. The table below maps each feature to its stories, the number of acceptance criteria (AC) serving as test checkpoints, and calculated coverage.

| PRD Feature | Priority | User Stories | AC Count | Coverage |
|---|---|---|---|---|
| F0: Note List View | P0 | US-0.1, US-0.2, US-0.3, US-0.4, US-0.5 | 20 | 100% |
| F1: Note Search / Filter | P1 | US-1.1, US-1.2 | 9 | 100% |
| F2: Create Note | P0 | US-2.1, US-2.2, US-2.3, US-2.4 | 18 | 100% |
| F3: Edit Note | P0 | US-3.1, US-3.2, US-3.3, US-3.4 | 17 | 100% |
| F4: Delete Note | P0 | US-4.1, US-4.2 | 9 | 100% |
| F5: REST API | P0 | US-5.1, US-5.2, US-5.3 | 18 | 100% |
| F6: Health Endpoint | P0 | US-6.1 | 6 | 100% |
| F7: Auto-Migration | P0 | US-7.1, US-7.2, US-7.3 | 12 | 100% |
| F8: Mobile-First UI | P1 | US-8.1, US-8.2, US-8.3 | 13 | 100% |
| F9: Iframe & Port | P0 | US-9.1, US-9.2 | 8 | 100% |
| **Total** | — | **29 stories** | **130 AC** | **100%** |

### Test Case Reference Table

Individual test cases are identified by story ID and acceptance criterion index (AC-n).

| Test Case ID | User Story | Description | Feature | Type |
|---|---|---|---|---|
| TEST-0.1-1 | US-0.1 | `GET /` renders all notes from DB | F0 | Integration |
| TEST-0.1-2 | US-0.1 | Notes display title in each card | F0 | UI |
| TEST-0.1-3 | US-0.1 | Pinned notes show Gold indicator | F0 | UI |
| TEST-0.1-4 | US-0.1 | Sort order: pinned-first, newest-first | F0 | Integration |
| TEST-0.1-5 | US-0.1 | Each card links to `/notes/[id]/edit` | F0 | UI |
| TEST-0.1-6 | US-0.1 | "New note" link always visible | F0 | UI |
| TEST-0.1-7 | US-0.1 | Page loads under 500 ms (< 1,000 notes) | F0 | Performance |
| TEST-0.2-1 | US-0.2 | Empty table renders "No notes yet" | F0 | Integration |
| TEST-0.2-2 | US-0.2 | Empty state includes "New note" button | F0 | UI |
| TEST-0.2-3 | US-0.2 | No note cards in empty state | F0 | UI |
| TEST-0.2-4 | US-0.2 | Empty state readable on 375 px viewport | F0 | UI |
| TEST-0.3-1 | US-0.3 | POST success redirects to `/` | F0 | Integration |
| TEST-0.3-2 | US-0.3 | New note visible without page refresh | F0 | Integration |
| TEST-0.3-3 | US-0.3 | Unpinned note appears first among unpinned | F0 | Integration |
| TEST-0.3-4 | US-0.3 | Pinned note appears first among pinned | F0 | Integration |
| TEST-0.4-1 | US-0.4 | PUT success redirects to `/` | F0 | Integration |
| TEST-0.4-2 | US-0.4 | Updated title shown in note card | F0 | Integration |
| TEST-0.4-3 | US-0.4 | No stale data displayed after edit | F0 | Integration |
| TEST-0.5-1 | US-0.5 | DELETE success redirects to `/` | F0 | Integration |
| TEST-0.5-2 | US-0.5 | Deleted note absent from list | F0 | Integration |
| TEST-0.5-3 | US-0.5 | Remaining notes retain correct order | F0 | Integration |
| TEST-1.1-1 | US-1.1 | Search input rendered on list view | F1 | UI |
| TEST-1.1-2 | US-1.1 | Typing filters to matching titles only | F1 | Integration |
| TEST-1.1-3 | US-1.1 | Non-matching notes are hidden | F1 | UI |
| TEST-1.1-4 | US-1.1 | Sort order preserved in filtered results | F1 | Integration |
| TEST-1.1-5 | US-1.1 | Clearing input restores full list | F1 | UI |
| TEST-1.1-6 | US-1.1 | Search input pre-populated from `?q=` on load | F1 | Integration |
| TEST-1.2-1 | US-1.2 | Zero-match filter shows empty state | F1 | UI |
| TEST-1.2-2 | US-1.2 | No note cards shown in filtered empty state | F1 | UI |
| TEST-1.2-3 | US-1.2 | Clearing input restores full list from empty | F1 | UI |
| TEST-2.1-1 | US-2.1 | `/notes/new` renders blank form with all fields | F2 | UI |
| TEST-2.1-2 | US-2.1 | Title input auto-focused on page load | F2 | UI |
| TEST-2.1-3 | US-2.1 | Submit sends correct POST body | F2 | Integration |
| TEST-2.1-4 | US-2.1 | 201 response redirects to `/` with new note visible | F2 | Integration |
| TEST-2.1-5 | US-2.1 | "New note" link on `/` navigates to `/notes/new` | F2 | UI |
| TEST-2.1-6 | US-2.1 | Form renders without horizontal scroll on 375 px | F2 | UI |
| TEST-2.2-1 | US-2.2 | Checked pinned checkbox sends `"pinned": true` | F2 | Integration |
| TEST-2.2-2 | US-2.2 | Pinned note appears in pinned section after redirect | F2 | Integration |
| TEST-2.2-3 | US-2.2 | Pinned indicator visible on note card | F2 | UI |
| TEST-2.3-1 | US-2.3 | Empty title blocks API call | F2 | Unit |
| TEST-2.3-2 | US-2.3 | "Title is required" message shown | F2 | UI |
| TEST-2.3-3 | US-2.3 | Form stays on screen with other values intact | F2 | UI |
| TEST-2.3-4 | US-2.3 | Valid title resubmission proceeds normally | F2 | Integration |
| TEST-2.4-1 | US-2.4 | Non-2xx response shows error banner | F2 | Integration |
| TEST-2.4-2 | US-2.4 | Form fields retain values on API error | F2 | UI |
| TEST-2.4-3 | US-2.4 | User can retry without re-entering data | F2 | UI |
| TEST-3.1-1 | US-3.1 | Note card click navigates to `/notes/[id]/edit` | F3 | UI |
| TEST-3.1-2 | US-3.1 | Title input pre-filled with current title | F3 | Integration |
| TEST-3.1-3 | US-3.1 | Body textarea pre-filled (empty string if null) | F3 | Integration |
| TEST-3.1-4 | US-3.1 | Pinned checkbox state matches note.pinned | F3 | Integration |
| TEST-3.1-5 | US-3.1 | Data sourced from GET /api/notes/[id] or DB | F3 | Integration |
| TEST-3.2-1 | US-3.2 | Changing title and saving calls PUT correctly | F3 | Integration |
| TEST-3.2-2 | US-3.2 | 200 response redirects to `/` | F3 | Integration |
| TEST-3.2-3 | US-3.2 | List shows updated title after redirect | F3 | Integration |
| TEST-3.2-4 | US-3.2 | `created_at` unchanged by PUT | F3 | Integration |
| TEST-3.3-1 | US-3.3 | Toggle pinned sends updated value in PUT | F3 | Integration |
| TEST-3.3-2 | US-3.3 | Note appears in correct section after redirect | F3 | Integration |
| TEST-3.3-3 | US-3.3 | Pinned indicator reflects updated state | F3 | UI |
| TEST-3.4-1 | US-3.4 | Non-existent id renders "Note not found." | F3 | Integration |
| TEST-3.4-2 | US-3.4 | Form not rendered in not-found state | F3 | UI |
| TEST-3.4-3 | US-3.4 | Back link to `/` present on not-found page | F3 | UI |
| TEST-3.4-4 | US-3.4 | Non-integer id segment triggers not-found state | F3 | Integration |
| TEST-4.1-1 | US-4.1 | "Delete" button visible on edit page | F4 | UI |
| TEST-4.1-2 | US-4.1 | Delete click triggers confirmation step | F4 | UI |
| TEST-4.1-3 | US-4.1 | Confirmation displays note title | F4 | UI |
| TEST-4.1-4 | US-4.1 | Confirm calls DELETE; 204 redirects to `/` | F4 | Integration |
| TEST-4.1-5 | US-4.1 | Deleted note absent from list after redirect | F4 | Integration |
| TEST-4.1-6 | US-4.1 | Cancel returns form to normal; no API call | F4 | UI |
| TEST-4.2-1 | US-4.2 | DELETE 404 shows correct error banner with link | F4 | Integration |
| TEST-4.2-2 | US-4.2 | DELETE 500/network error shows error banner | F4 | Integration |
| TEST-4.2-3 | US-4.2 | Edit form accessible after failed delete | F4 | UI |
| TEST-5.1-1 | US-5.1 | GET /api/notes returns 200 + JSON array | F5 | API |
| TEST-5.1-2 | US-5.1 | Response body is Note[] (may be empty array) | F5 | API |
| TEST-5.1-3 | US-5.1 | Sort order: pinned DESC, created_at DESC | F5 | API |
| TEST-5.1-4 | US-5.1 | Each Note object has id, title, body, pinned, created_at | F5 | API |
| TEST-5.1-5 | US-5.1 | GET /api/notes?q= filters by title (case-insensitive) | F5 | API |
| TEST-5.2-1 | US-5.2 | POST valid body returns 201 with created Note | F5 | API |
| TEST-5.2-2 | US-5.2 | POST empty title returns 400 TITLE_REQUIRED | F5 | API |
| TEST-5.2-3 | US-5.2 | POST malformed JSON returns 400 BAD_REQUEST | F5 | API |
| TEST-5.2-4 | US-5.2 | pinned defaults to false if not provided | F5 | API |
| TEST-5.2-5 | US-5.2 | body may be omitted (stored as NULL) | F5 | API |
| TEST-5.3-1 | US-5.3 | GET /api/notes/[id] valid id returns 200 Note | F5 | API |
| TEST-5.3-2 | US-5.3 | GET /api/notes/[id] non-existent returns 404 NOTE_NOT_FOUND | F5 | API |
| TEST-5.3-3 | US-5.3 | PUT valid body returns 200 updated Note; created_at unchanged | F5 | API |
| TEST-5.3-4 | US-5.3 | PUT empty title returns 400 TITLE_REQUIRED | F5 | API |
| TEST-5.3-5 | US-5.3 | PUT non-existent id returns 404 NOTE_NOT_FOUND | F5 | API |
| TEST-5.3-6 | US-5.3 | DELETE existing note returns 204 no body | F5 | API |
| TEST-5.3-7 | US-5.3 | DELETE non-existent id returns 404 NOTE_NOT_FOUND | F5 | API |
| TEST-5.3-8 | US-5.3 | Non-integer id on any /[id] route returns 404 | F5 | API |
| TEST-6.1-1 | US-6.1 | GET /api/health returns 200 application/json | F6 | API |
| TEST-6.1-2 | US-6.1 | Response body is exactly `{"status":"ok"}` | F6 | API |
| TEST-6.1-3 | US-6.1 | No database query performed | F6 | Unit |
| TEST-6.1-4 | US-6.1 | Response within 200 ms | F6 | Performance |
| TEST-6.1-5 | US-6.1 | No auth or special headers required | F6 | API |
| TEST-6.1-6 | US-6.1 | Non-GET method returns 405 | F6 | API |
| TEST-7.1-1 | US-7.1 | App executes CREATE TABLE IF NOT EXISTS on startup | F7 | Integration |
| TEST-7.1-2 | US-7.1 | Schema matches DDL spec | F7 | Integration |
| TEST-7.1-3 | US-7.1 | Migration uses DATABASE_URL; no hard-coded credentials | F7 | Security |
| TEST-7.1-4 | US-7.1 | After startup: health + CRUD endpoints functional | F7 | Integration |
| TEST-7.2-1 | US-7.2 | After restart: GET /api/notes returns same notes | F7 | Integration |
| TEST-7.2-2 | US-7.2 | Migration re-run is no-op (no errors, no data loss) | F7 | Integration |
| TEST-7.2-3 | US-7.2 | Note created pre-restart retrievable post-restart | F7 | Integration |
| TEST-7.2-4 | US-7.2 | No hard-coded credentials in source files | F7 | Security |
| TEST-7.3-1 | US-7.3 | Missing DATABASE_URL → process exits non-zero | F7 | Integration |
| TEST-7.3-2 | US-7.3 | Log contains "DATABASE_URL environment variable is not set" | F7 | Integration |
| TEST-7.3-3 | US-7.3 | HTTP server does not start without DATABASE_URL | F7 | Integration |
| TEST-8.1-1 | US-8.1 | All pages single-column, no horizontal scroll at 375 px | F8 | UI |
| TEST-8.1-2 | US-8.1 | All interactive elements ≥ 44×44 px tap target | F8 | Accessibility |
| TEST-8.1-3 | US-8.1 | Text #0A0A0A on white #FFFFFF; sufficient contrast | F8 | Accessibility |
| TEST-8.1-4 | US-8.1 | Gold accent ≤ 10% of any view; limited to CTAs/pinned/focus | F8 | UI |
| TEST-8.1-5 | US-8.1 | No external CSS framework or CSS-in-JS | F8 | Unit |
| TEST-8.2-1 | US-8.2 | Save/Create button: Gold background, near-black text | F8 | UI |
| TEST-8.2-2 | US-8.2 | Delete button: no Gold accent | F8 | UI |
| TEST-8.2-3 | US-8.2 | Both buttons meet 44×44 px tap target | F8 | Accessibility |
| TEST-8.2-4 | US-8.2 | Buttons visually distinct without relying on colour alone | F8 | Accessibility |
| TEST-8.3-1 | US-8.3 | Every input/textarea has associated label | F8 | Accessibility |
| TEST-8.3-2 | US-8.3 | Validation errors use aria-invalid + #CC0000 text | F8 | Accessibility |
| TEST-8.3-3 | US-8.3 | Focus styles visible on all interactive elements | F8 | Accessibility |
| TEST-8.3-4 | US-8.3 | Pinned indicator has non-colour cue in addition to Gold | F8 | Accessibility |
| TEST-9.1-1 | US-9.1 | HTTP responses contain no X-Frame-Options header | F9 | Security |
| TEST-9.1-2 | US-9.1 | CSP (if present) has no frame-ancestors 'none'/'self' | F9 | Security |
| TEST-9.1-3 | US-9.1 | App renders inside cross-origin iframe without errors | F9 | Integration |
| TEST-9.1-4 | US-9.1 | next.config.mjs exists; next.config.ts does not exist | F9 | Unit |
| TEST-9.2-1 | US-9.2 | Server binds to 0.0.0.0:3000 not 127.0.0.1 | F9 | Integration |
| TEST-9.2-2 | US-9.2 | App reachable from outside container on port 3000 | F9 | Integration |
| TEST-9.2-3 | US-9.2 | Default port is 3000 | F9 | Integration |
| TEST-9.2-4 | US-9.2 | next.config.mjs does not introduce port restrictions | F9 | Unit |

**Total test cases: 130** across API, Integration, UI, Unit, Performance, Security, and Accessibility types.

---

## 6. Reverse Traceability — User Story to PRD Feature

This table enables bottom-up traceability: given any User Story, locate its originating PRD feature and FRD section.

| User Story | Title | Feature | FRD Section | TechArch Component(s) | Priority |
|---|---|---|---|---|---|
| US-0.1 | View the Note List | F0 | F00 | SPEC-007, SPEC-011 | P0 |
| US-0.2 | Empty State When No Notes Exist | F0 | F00 | SPEC-007 | P0 |
| US-0.3 | Newly Created Note Appears at Top | F0 | F00, F02 | SPEC-007, SPEC-008 | P0 |
| US-0.4 | Updated Note Title Reflected in List | F0 | F00, F03 | SPEC-007, SPEC-009 | P0 |
| US-0.5 | Deleted Note No Longer in List | F0 | F00, F04 | SPEC-007, SPEC-009 | P0 |
| US-1.1 | Filter Notes by Partial Title | F1 | F01 | SPEC-007, SPEC-004 | P1 |
| US-1.2 | Empty State When Search Matches Nothing | F1 | F01 | SPEC-007 | P1 |
| US-2.1 | Create a New Note with Title and Body | F2 | F02 | SPEC-008, SPEC-004 | P0 |
| US-2.2 | Create a Pinned Note | F2 | F02 | SPEC-008, SPEC-004 | P0 |
| US-2.3 | Block Submission When Title Is Empty | F2 | F02, F05 | SPEC-008, SPEC-004, SPEC-012 | P0 |
| US-2.4 | Error Banner on API Failure (Create) | F2 | F02 | SPEC-008 | P0 |
| US-3.1 | Open Note with Pre-filled Values | F3 | F03 | SPEC-009, SPEC-005 | P0 |
| US-3.2 | Save Edit and See Updated Title in List | F3 | F03 | SPEC-009, SPEC-005 | P0 |
| US-3.3 | Toggle Pinned Status on Existing Note | F3 | F03 | SPEC-009, SPEC-005 | P0 |
| US-3.4 | Not-Found State for Missing Note | F3 | F03 | SPEC-009, SPEC-005 | P0 |
| US-4.1 | Delete a Note with Confirmation | F4 | F04 | SPEC-009, SPEC-005 | P0 |
| US-4.2 | Error Message If Deletion Fails | F4 | F04 | SPEC-009, SPEC-005 | P0 |
| US-5.1 | Retrieve All Notes via API | F5 | F05, Y1 | SPEC-004, SPEC-003 | P0 |
| US-5.2 | Create a Note via API | F5 | F05, Y1 | SPEC-004, SPEC-003, SPEC-012 | P0 |
| US-5.3 | Fetch, Update, and Delete via API | F5 | F05, Y1 | SPEC-005, SPEC-003, SPEC-012 | P0 |
| US-6.1 | Confirm App Liveness via Health Endpoint | F6 | F06, Y1 | SPEC-006 | P0 |
| US-7.1 | Notes Table Created Automatically | F7 | F07, Y0 | SPEC-002, SPEC-011 | P0 |
| US-7.2 | Data Survives Server Restart | F7 | F07, Y0 | SPEC-002, SPEC-003, SPEC-011 | P0 |
| US-7.3 | Clear Error on Missing DATABASE_URL | F7 | F07 | SPEC-002 | P0 |
| US-8.1 | Use App on Mobile Viewport | F8 | F08 | SPEC-013, SPEC-007, SPEC-008, SPEC-009 | P1 |
| US-8.2 | Submit and Delete Buttons Are Distinct | F8 | F08 | SPEC-013, SPEC-008, SPEC-009 | P1 |
| US-8.3 | All Form Inputs Are Accessible | F8 | F08 | SPEC-013, SPEC-008, SPEC-009 | P1 |
| US-9.1 | App Renders Inside Iframe | F9 | F09 | SPEC-010, SPEC-001 | P0 |
| US-9.2 | App Reachable on Port 3000 | F9 | F09 | SPEC-010, SPEC-001 | P0 |

---

## 7. TechArch Component Coverage

Every TechArch component defined in the architecture document maps to at least one PRD feature and one User Story.

| Component ID | Component | PRD Features | User Stories |
|---|---|---|---|
| SPEC-001 | Monolithic Next.js Architecture Pattern | F0, F2, F3, F4, F9 | US-0.1–US-0.5, US-2.1–US-4.2, US-9.1, US-9.2 |
| SPEC-002 | instrumentation.js Startup Migration Hook | F7 | US-7.1, US-7.2, US-7.3 |
| SPEC-003 | lib/db.js Database Client Singleton | F5, F7 | US-5.1–US-5.3, US-7.1, US-7.2 |
| SPEC-004 | app/api/notes/route.js (GET, POST) | F1, F2, F5 | US-1.1, US-2.1–US-2.4, US-5.1, US-5.2 |
| SPEC-005 | app/api/notes/[id]/route.js (GET, PUT, DELETE) | F3, F4, F5 | US-3.1–US-4.2, US-5.3 |
| SPEC-006 | app/api/health/route.js | F6 | US-6.1 |
| SPEC-007 | app/page.js Note List View | F0, F1 | US-0.1–US-0.5, US-1.1, US-1.2 |
| SPEC-008 | app/notes/new/page.js Create Note | F2, F8 | US-2.1–US-2.4, US-8.1, US-8.2, US-8.3 |
| SPEC-009 | app/notes/[id]/edit/page.js Edit + Delete | F3, F4, F8 | US-3.1–US-4.2, US-8.1, US-8.2, US-8.3 |
| SPEC-010 | next.config.mjs Configuration | F9 | US-9.1, US-9.2 |
| SPEC-011 | PostgreSQL Data Model & DDL | F0, F7 | US-0.1–US-0.5, US-7.1, US-7.2 |
| SPEC-012 | Security Architecture (parameterized queries, validation) | F2, F3, F5 | US-2.3, US-3.4, US-5.2, US-5.3 |
| SPEC-013 | CSS Modules Design System | F8 | US-8.1, US-8.2, US-8.3 |

---

## 8. Critical Constraints Traceability

The TechArch document defines seven hard constraints that must be verified before deployment. Each is traced to its PRD source and verification test case.

| # | Constraint | PRD Source | FRD Section | Test Case(s) |
|---|---|---|---|---|
| C-1 | Config file is `next.config.mjs` — never `next.config.ts` | F9 | F09 | TEST-9.1-4 |
| C-2 | No `X-Frame-Options` header on any response | F9 | F09 | TEST-9.1-1 |
| C-3 | No `frame-ancestors 'none'` or `'self'` in CSP | F9 | F09 | TEST-9.1-2 |
| C-4 | Server binds to `0.0.0.0:3000` | F9 | F09 | TEST-9.2-1, TEST-9.2-2 |
| C-5 | Auto-migration runs before first request | F7 | F07 | TEST-7.1-1, TEST-7.1-4 |
| C-6 | `DATABASE_URL` from environment only — never hard-coded | F7 | F07 | TEST-7.1-3, TEST-7.2-4 |
| C-7 | Migration is idempotent — safe to re-run | F7 | F07 | TEST-7.2-2 |

---

## 9. Change Management

| Version | Date | Author | Change Description | Affected Features |
|---|---|---|---|---|
| 1.0 | 2026-06-17 | Generated | Initial RTM — all features F0–F9; 29 stories; 130 test cases | All |

---

## 10. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
| Project Manager | | | |

---

## Appendix A: ID Convention Reference

| Prefix | Document | Level | Example |
|---|---|---|---|
| F0–F9 | PRD | Feature | F0: Note List View |
| F00–F09 | FRD | Functional section | F00: Note List View behaviour |
| Y0–Y3 | FRD | Cross-feature appendix | Y0: Database Schema DDL |
| SPEC-001–SPEC-013 | TechArch | Architectural component | SPEC-002: instrumentation.js |
| US-X.Y | UserStories | User story (epic.sequence) | US-0.1: View the Note List |
| TEST-X.Y-N | RTM | Test case (story.ac-index) | TEST-5.2-2: POST empty title → 400 |
| PER-01–03 | UserStories | Persona | PER-01: Quick Capturer |
| C-1–C-7 | TechArch | Critical constraint | C-4: Bind to 0.0.0.0:3000 |

---

## Appendix B: Coverage Validation Checklist

- [x] All 10 PRD features (F0–F9) have at least one FRD section reference
- [x] All 10 PRD features (F0–F9) have at least one TechArch component reference
- [x] All 10 PRD features (F0–F9) have at least one User Story reference
- [x] All 29 User Stories map back to a PRD feature
- [x] All 29 User Stories map to at least one TechArch component
- [x] All 13 TechArch components map to at least one PRD feature
- [x] All 7 critical constraints map to at least one test case
- [x] All 130 test cases reference a User Story
- [x] FRD appendix sections (Y0, Y1) referenced in F5, F6, F7 feature rows
- [x] No orphaned requirements — every requirement has implementation and verification coverage

---

*RTM generated: 2026-06-17 | Product: QuickNotes v1.0 | Stack: Next.js 14 App Router + PostgreSQL*
