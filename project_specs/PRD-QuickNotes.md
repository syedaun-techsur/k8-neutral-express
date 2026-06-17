# Product Requirements Document — QuickNotes

**Project:** QuickNotes
**Version:** 1.0
**Date:** 2026-06-17
**Status:** Active

---

## 1. Executive Summary

QuickNotes is a personal, single-user, mobile-first web application for capturing and managing plain-text notes. It delivers one entity (notes) and four operations (create, read, update, delete) with durable PostgreSQL storage and zero authentication overhead. The MVP ships as a Next.js 14 App Router application that runs on port 3000, auto-migrates its database schema on startup, and renders correctly inside an embedded preview iframe.

---

## 2. Problem Statement

Developers and individuals working in embedded environments need a frictionless way to capture notes without installing native apps, logging in, or configuring external services. Existing note tools introduce unnecessary complexity — authentication flows, sharing surfaces, AI layers — that slow down a user whose only goal is to write something down and find it again later.

**Core pain points:**

- No lightweight, self-contained note app runs cleanly inside an iframe-based preview environment
- Note apps almost universally require authentication even for purely personal, single-user use
- Setup friction (manual database migrations, hard-coded credentials) prevents quick deployment
- Mobile-unfriendly layouts make quick capture on small screens cumbersome

---

## 3. Product Vision

> **Give a single user the fastest possible path from thought to persisted note, with no login, no configuration, and no distractions.**

**Strategic goals:**

- Validate the core write-find-edit loop with zero auth friction
- Prove that a full-stack Next.js 14 + PostgreSQL app can be deployed in an embedded iframe context with auto-migration and zero manual database setup
- Establish a clean, minimal codebase that can be extended later (tags, export, multi-user) without architectural debt
- Deliver a mobile-first experience that feels native on small screens without any native app overhead

---

## 4. Technical Architecture

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Prescribed stack; no alternatives |
| Language | TypeScript / JavaScript | Plain JS acceptable |
| Database | PostgreSQL | Prescribed; durable persistence |
| Styling | Plain CSS / CSS Modules | No Tailwind, no CSS-in-JS |
| Config | `next.config.mjs` or `.js` | `.ts` config hard-errors in Next 14 |
| Port | `0.0.0.0:3000` | Required for container/iframe binding |
| Migrations | Auto-run on startup | Idempotent `CREATE TABLE IF NOT EXISTS` |
| Credentials | Runtime environment variables | Never hard-coded |
| Headers | No `X-Frame-Options: DENY`, no `frame-ancestors 'none'/'self'` | Must render in iframe |

**Data Model — `notes` table:**

| Column | Type | Constraints |
|---|---|---|
| `id` | `serial` | Primary key |
| `title` | `text` | `NOT NULL` |
| `body` | `text` | Nullable |
| `pinned` | `boolean` | `NOT NULL DEFAULT false` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |

> **Note:** There is no `updated_at` column — this is a deliberate MVP scope decision. Edits to a note do not update any timestamp.

---

## 5. Feature Requirements

### F0: Note List View (`/`)

**Description:** The home page displays all saved notes ordered by pinned status first, then by creation time descending (newest first). When no notes exist, an empty state message ("No notes yet") is shown. Each note entry shows the title and provides a link to its edit page.

**Capabilities:**
- Render all notes sorted: pinned notes at top, then newest-first within each group
- Display empty state ("No notes yet") when the notes table has zero rows
- Each note card/row links to `/notes/[id]/edit`
- Link to `/notes/new` to create a first/new note
- Responsive, mobile-first layout with near-black `#0A0A0A` text on white surface

**Priority:** P0 (Critical — MVP entry point)

---

### F1: Note Search / Filter

**Description:** A search input on the list view allows users to filter visible notes by title in real time. Only notes whose title contains the search string (case-insensitive) are shown. Clearing the input restores the full list.

**Capabilities:**
- Search box rendered at the top of the list view
- Filters notes client-side or via query parameter on title field
- Case-insensitive matching
- Empty search restores the full sorted list
- Pinned-first, newest-first sort preserved within filtered results

**Priority:** P1 (High — listed as an active requirement)

---

### F2: Create Note (`/notes/new`)

**Description:** A dedicated page provides a form for creating a new note. Title is required; body is optional; a pinned toggle defaults to off. On successful submission the user is redirected to the home list view.

**Capabilities:**
- Form fields: `title` (text input, required), `body` (textarea, optional), `pinned` (checkbox/toggle, default unchecked)
- Client-side validation: title must be non-empty before submission
- `POST /api/notes` called on submit
- Redirect to `/` on success
- Error state displayed if the API call fails
- Mobile-first layout; Gold `#FBCA5C` accent on the submit CTA button

**Priority:** P0 (Critical — core CRUD create operation)

---

### F3: Edit Note (`/notes/[id]/edit`)

**Description:** Navigating to `/notes/[id]/edit` loads the existing note data and presents a pre-filled form. Users can change the title, body, or pinned status and save. The page also hosts the delete action (see F4).

**Capabilities:**
- Pre-populate form fields from `GET /api/notes/[id]`
- Form fields: `title` (required), `body` (optional), `pinned` (toggle)
- `PUT /api/notes/[id]` called on save
- Redirect to `/` on successful save
- Error state displayed if note is not found (404) or save fails

**Priority:** P0 (Critical — core CRUD update operation)

---

### F4: Delete Note

**Description:** From the edit page (`/notes/[id]/edit`) the user can delete the current note. A confirmation step (inline confirmation UI or browser confirm dialog) prevents accidental deletion. On confirmation, `DELETE /api/notes/[id]` is called and the user is redirected to `/`.

**Capabilities:**
- "Delete" action available on the edit page
- Confirmation step required before the API call is made
- `DELETE /api/notes/[id]` called on confirmation
- Redirect to `/` after successful deletion
- Error state displayed if deletion fails

**Priority:** P0 (Critical — core CRUD delete operation)

---

### F5: REST API

**Description:** A set of JSON REST endpoints backs all UI interactions and can be called directly for testing or integration. All endpoints operate on the `notes` table and return standard HTTP status codes.

**Capabilities:**
- `GET /api/notes` — return all notes as JSON array, ordered pinned-first then newest-first
- `POST /api/notes` — create a note; accepts `{ title, body?, pinned? }`; returns created note with `201`
- `GET /api/notes/[id]` — return single note by id; `404` if not found
- `PUT /api/notes/[id]` — update note fields; returns updated note; `404` if not found
- `DELETE /api/notes/[id]` — delete note; returns `204`; `404` if not found
- All endpoints return `Content-Type: application/json`
- Input validation: `title` must be present and non-empty on create/update

**Priority:** P0 (Critical — all UI features depend on these endpoints)

---

### F6: Health Endpoint (`GET /api/health`)

**Description:** A lightweight health check endpoint returns a fixed JSON response used by orchestration platforms, load balancers, and smoke tests to confirm the application is alive.

**Capabilities:**
- `GET /api/health` returns HTTP `200` with body `{"status":"ok"}`
- No database query required (liveness check only)
- Responds within 200 ms under normal conditions

**Priority:** P0 (Critical — required by project definition)

---

### F7: Auto-Migration on Startup

**Description:** When the Next.js server starts, it automatically runs an idempotent SQL migration that creates the `notes` table if it does not already exist. No manual database setup is ever required. The migration is safe to re-run on every restart.

**Capabilities:**
- Executes `CREATE TABLE IF NOT EXISTS notes (...)` before accepting requests
- Reads `DATABASE_URL` (or equivalent) from runtime environment — no hard-coded credentials
- Migration failure causes startup to fail with a clear error log
- Idempotent: re-running against an existing schema is a no-op

**Priority:** P0 (Critical — zero-manual-setup is a hard constraint)

---

### F8: Mobile-First UI & Design System

**Description:** All pages are styled with a consistent mobile-first design system using plain CSS / CSS Modules. The palette uses near-black `#0A0A0A` for text, white (`#FFFFFF`) for surfaces, and Gold `#FBCA5C` as the sole accent color, applied sparingly (≤10% of any view's visual area).

**Capabilities:**
- Base styles target mobile viewports first (min-width breakpoints for larger screens)
- Color tokens: text `#0A0A0A`, surface `#FFFFFF`, accent `#FBCA5C`
- Gold accent used only on primary CTAs, active states, and the pinned indicator
- Tap targets ≥ 44 × 44 px on all interactive elements
- No external UI framework — plain CSS or CSS Modules only
- No `X-Frame-Options: DENY` header and no `frame-ancestors 'none'/'self'` CSP directive

**Priority:** P1 (High — UI/UX requirement across all pages)

---

### F9: Iframe Compatibility & Port Binding

**Description:** The application must render correctly when embedded inside a parent iframe and must bind to `0.0.0.0:3000` so it is reachable from container networking and the preview host.

**Capabilities:**
- Server binds to `0.0.0.0:3000` (not `localhost` or `127.0.0.1`)
- HTTP response headers do not include `X-Frame-Options`
- Content Security Policy (if set) does not include `frame-ancestors 'none'` or `frame-ancestors 'self'`
- `next.config.mjs` (or `.js`) used — never `next.config.ts`

**Priority:** P0 (Critical — iframe preview is a hard deployment requirement)

---

## 6. Non-Functional Requirements

| NFR | Requirement |
|---|---|
| **Performance** | List view loads all notes in < 500 ms under normal conditions (< 1,000 notes) |
| **Availability** | App starts and is ready to serve requests within 10 seconds of process launch |
| **Reliability** | All writes go to PostgreSQL; no in-memory-only state; notes survive server restarts |
| **Security** | No credentials hard-coded; `DATABASE_URL` read from environment at runtime |
| **Portability** | Runs in any environment that provides Node.js ≥ 18 and a PostgreSQL connection string |
| **Maintainability** | Plain CSS / CSS Modules only; no runtime CSS-in-JS dependencies |
| **Config safety** | Config file must be `next.config.mjs` or `next.config.js` — never `.ts` |
| **Idempotency** | DB migration re-runs safely on every server restart with no errors or data loss |
| **Accessibility** | All form inputs have associated labels; color is never the sole means of conveying state |

---

## 7. Success Metrics

- **Zero-setup deployment:** App reaches a healthy state (health endpoint returns `200`) within 30 seconds of container start with only a `DATABASE_URL` environment variable provided — no manual SQL commands required
- **CRUD completeness:** All five REST endpoints (`GET /api/notes`, `POST /api/notes`, `GET /api/notes/[id]`, `PUT /api/notes/[id]`, `DELETE /api/notes/[id]`) return correct status codes and JSON in automated integration tests
- **Iframe rendering:** App renders without a blank page, `SecurityError`, or console frame-blocking warnings when embedded in a cross-origin iframe
- **Mobile usability:** All interactive elements (buttons, inputs, links) meet the 44 × 44 px minimum touch target size on a 375 px wide viewport
- **Data durability:** A note created via `POST /api/notes` is retrievable via `GET /api/notes/[id]` after a full server restart
- **Search accuracy:** Filtering by a partial title string returns only notes whose titles contain that string (case-insensitive), with no false positives or false negatives

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `next.config.ts` accidentally created | Medium | High (hard startup error in Next 14) | Enforce `next.config.mjs` in code review and linting; document constraint in PROJECT.md |
| Frame-blocking headers added inadvertently | Medium | High (iframe preview breaks silently) | Add automated header check in CI smoke test |
| Hard-coded `DATABASE_URL` committed | Low | High (credential leak) | Use `.env.local` + `.gitignore`; runtime env only in production |
| Migration not idempotent (drops table) | Low | Critical (data loss) | Use `CREATE TABLE IF NOT EXISTS`; integration test on re-run |
| Port bound to `127.0.0.1` instead of `0.0.0.0` | Low | High (unreachable in container) | Document port binding; verify in startup smoke test |
| PostgreSQL connection failure on cold start | Medium | High (startup crash) | Clear error log on migration failure; add retry with backoff if needed |

---

## 9. Out of Scope (MVP)

The following items are explicitly deferred and must not be introduced in this iteration:

- Authentication or multi-user support
- Sharing or collaboration features
- Tags, folders, or attachments
- Import / export functionality
- Pagination (the list renders all notes)
- AI features of any kind
- `next.config.ts` (hard constraint — not deferred, permanently excluded for Next 14)

---

## 10. Feature Index

| ID | Feature | Priority | Pages / Endpoints |
|---|---|---|---|
| F0 | Note List View | P0 | `/` |
| F1 | Note Search / Filter | P1 | `/` |
| F2 | Create Note | P0 | `/notes/new`, `POST /api/notes` |
| F3 | Edit Note | P0 | `/notes/[id]/edit`, `PUT /api/notes/[id]` |
| F4 | Delete Note | P0 | `/notes/[id]/edit`, `DELETE /api/notes/[id]` |
| F5 | REST API | P0 | `/api/notes`, `/api/notes/[id]` |
| F6 | Health Endpoint | P0 | `GET /api/health` |
| F7 | Auto-Migration on Startup | P0 | Server startup hook |
| F8 | Mobile-First UI & Design System | P1 | All pages |
| F9 | Iframe Compatibility & Port Binding | P0 | Server config / `next.config.mjs` |

**Priority legend:** P0 = Critical / MVP blocker · P1 = High / required before launch · P2 = Medium / next iteration · P3 = Low / backlog

---

*PRD generated: 2026-06-17 | Stack: Next.js 14 App Router + PostgreSQL | Scope: Single-user MVP*
