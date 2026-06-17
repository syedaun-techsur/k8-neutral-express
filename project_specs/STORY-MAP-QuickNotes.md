# Story Map — QuickNotes

| Field | Value |
|---|---|
| **Product** | QuickNotes |
| **Version** | 1.0 |
| **Date** | 2026-06-17 |
| **Related Artifacts** | PERSONAS-QuickNotes.md · JOURNEYS-QuickNotes.md · JTBD-QuickNotes.md · UserStories-QuickNotes.md · PRD-QuickNotes.md |
| **Status** | Active |

---

## 1. Overview

This story map organizes all 29 QuickNotes user stories into a two-dimensional grid:

- **X-axis (columns):** Journey stages drawn from JOURNEYS-QuickNotes.md — the "when/where" of usage
- **Y-axis (rows):** Epics and stories within each stage — the "what is built"
- **NaC column:** Natural Acceptance Criteria derived from the intersection of a specific JTBD outcome and the journey stage — the "what matters, tested"
- **Release column:** Increment assignment driven by priority (P0→R1, P1→R2) and journey completeness

### NaC Concept

NaC (Natural Acceptance Criteria) are **not invented** — they are derived from a traceable chain:

> **JTBD outcome** (the "what matters") × **Journey stage** (the "when/where") → **testable NaC statement**

Each NaC in Section 3 is fully traceable back to a JTBD ID and a JRN stage. They are cross-checked against UserStory acceptance criteria in Section 7.

### Personas

| ID | Name | Context |
|----|------|---------|
| PER-01 | Quick Capturer | On-the-go mobile capture — speed, zero friction |
| PER-02 | Focused Reviewer | Desktop triage, search, pin, cleanup |
| PER-03 | Technical Deployer | App setup, deployment, integration validation |

---

## 2. Journey Stage Reference

| Journey | Persona | Stages (in order) |
|---------|---------|-------------------|
| JRN-01.1 | PER-01 | Open → Orient → Create → Save → Confirm |
| JRN-01.2 | PER-01 | Identify → Navigate → Toggle → Save & Verify |
| JRN-02.1 | PER-02 | Orient → Search → Open → Edit & Pin → Save → Triage Remainder |
| JRN-02.2 | PER-02 | Navigate → Locate Delete → Confirm → Return |
| JRN-03.1 | PER-03 | Configure → Monitor Startup → Verify Health → Validate Schema → Confirm Idempotency |
| JRN-03.2 | PER-03 | Embed → Inspect Headers → Check Console → Interact |

---

## 3. Story Map Matrix

The map is organized in three sections — one per persona context — to keep each journey scannable. SM IDs use `SM-{Epic}.{NN}` notation.

### 3.1 PER-01: The Quick Capturer

| SM-ID | Journey Stage | Activity | Epic | Story | NaC (derived) | Release |
|-------|--------------|----------|------|-------|---------------|---------|
| SM-7.01 | Open (JRN-01.1) | App starts; no login screen | Epic 7 (F7) | US-7.1: Notes Table Created Automatically | JTBD-01.1 → "App loads interactive within 10 s, no login" → App executes auto-migration before serving any request; no manual SQL required | R1 |
| SM-9.01 | Open (JRN-01.1) | App reachable in container | Epic 9 (F9) | US-9.2: App Reachable on Port 3000 | JTBD-01.1 → "No waiting" → Server binds to `0.0.0.0:3000` so the app is reachable immediately on container start with no extra configuration | R1 |
| SM-9.02 | Open (JRN-01.1) | No iframe block on load | Epic 9 (F9) | US-9.1: App Renders Inside Iframe | JTBD-03.3 → "Renders in cross-origin iframe with zero errors" → No `X-Frame-Options` header; no `frame-ancestors` CSP; app visible in iframe | R1 |
| SM-0.01 | Orient (JRN-01.1) | Scan note list | Epic 0 (F0) | US-0.1: View the Note List | JTBD-01.2 → "Saved note visible immediately" → Navigating to `/` renders all notes pinned-first, newest-first in < 500 ms | R1 |
| SM-0.02 | Orient (JRN-01.1) | Empty state on first use | Epic 0 (F0) | US-0.2: Empty State When No Notes Exist | JTBD-01.1 → "App is there and ready" → Empty state shows "No notes yet" + "New note" CTA; no confusing blank screen | R1 |
| SM-8.01 | Orient (JRN-01.1) | Mobile layout loads correctly | Epic 8 (F8) | US-8.1: Use App on Mobile Viewport | JTBD-01.1 → "One-handed on 375 px, no pinching" → Single-column layout, no horizontal scroll, all tap targets ≥ 44 × 44 px | R2 |
| SM-2.01 | Create (JRN-01.1) | Open new-note form | Epic 2 (F2) | US-2.1: Create a New Note with Title and Body | JTBD-01.1 → "Type title and hit save with no friction" → `/notes/new` renders blank form; `POST /api/notes` on submit; redirect to `/` on `201` | R1 |
| SM-2.02 | Create (JRN-01.1) | Form validation (no empty title) | Epic 2 (F2) | US-2.3: Block Submission When Title Is Empty | JTBD-01.1 → "Capture the thought — don't lose typed content" → Empty title shows inline error; form stays with current values intact | R1 |
| SM-2.03 | Create (JRN-01.1) | API error recovery | Epic 2 (F2) | US-2.4: Error Banner on API Failure | JTBD-01.1 → "Know to retry; don't lose my text" → Non-2xx response shows error banner; form fields retain current values | R1 |
| SM-8.02 | Create (JRN-01.1) | Accessible, labelled form inputs | Epic 8 (F8) | US-8.3: All Form Inputs Are Accessible | JTBD-01.1 → "Can see and tap the field easily" → Every input has `<label>`; focus styles visible; pin state conveyed beyond color alone | R2 |
| SM-5.01 | Save (JRN-01.1) | API persists the note | Epic 5 (F5) | US-5.2: Create a Note via API | JTBD-01.1 → "Save completes; redirect within 15 s" → `POST /api/notes` returns `201` with created Note object; `400` on missing title | R1 |
| SM-0.03 | Confirm (JRN-01.1) | New note at top of list | Epic 0 (F0) | US-0.3: Newly Created Note Appears at Top | JTBD-01.2 → "See it at the top without any extra action" → After `POST`, redirect to `/`; new note visible at top (below pinned if applicable) | R1 |
| SM-7.02 | Confirm (JRN-01.1) | Note survives restart | Epic 7 (F7) | US-7.2: Data Survives Server Restart | JTBD-01.2 → "Safely persisted before I close the app" → Note created before restart retrievable after restart; `CREATE TABLE IF NOT EXISTS` is a no-op | R1 |
| SM-0.04 | Identify (JRN-01.2) | Spot just-created note to pin | Epic 0 (F0) | US-0.1: View the Note List | JTBD-01.3 → "Note right there at top; easy visual target" → Newest unpinned note at top of list immediately post-redirect | R1 |
| SM-2.04 | Create (JRN-01.2) | Create note with pin | Epic 2 (F2) | US-2.2: Create a Pinned Note | JTBD-01.3 → "Pin at creation so it stays visible" → `pinned: true` in `POST` body; note appears in pinned section with Gold indicator after redirect | R1 |
| SM-3.01 | Navigate (JRN-01.2) | Open edit page for pinning | Epic 3 (F3) | US-3.1: Open Note with Pre-filled Values | JTBD-01.3 → "Don't re-type anything; content pre-loaded" → `/notes/[id]/edit` pre-fills title, body, pinned from `GET /api/notes/[id]` | R1 |
| SM-3.02 | Toggle (JRN-01.2) | Toggle pin on edit page | Epic 3 (F3) | US-3.3: Toggle Pinned Status on Existing Note | JTBD-01.3 → "Toggle accessible; gold indicator active" → Pin checkbox on edit page; `PUT` sends updated `pinned`; note moves to correct section on redirect | R1 |
| SM-8.03 | Toggle (JRN-01.2) | Visually distinct Save vs Delete | Epic 8 (F8) | US-8.2: Submit and Delete Buttons Are Distinct | JTBD-01.3 → "Won't accidentally delete when trying to save" → Gold Save CTA vs neutral/red Delete; both ≥ 44 × 44 px; difference not color-only | R2 |
| SM-5.02 | Save & Verify (JRN-01.2) | PUT updates pin in API | Epic 5 (F5) | US-5.3: Fetch, Update, and Delete via API | JTBD-01.3 → "Pinned note at position 1 after PUT + redirect" → `PUT /api/notes/[id]` returns `200` with updated Note; `created_at` unchanged | R1 |

### 3.2 PER-02: The Focused Reviewer

| SM-ID | Journey Stage | Activity | Epic | Story | NaC (derived) | Release |
|-------|--------------|----------|------|-------|---------------|---------|
| SM-0.05 | Orient (JRN-02.1) | Scan backlog; assess list | Epic 0 (F0) | US-0.1: View the Note List | JTBD-02.3 → "Pinned-first, newest-first order every time" → List renders pinned notes above unpinned; within each group newest-first; sort survives page reload | R1 |
| SM-1.01 | Search (JRN-02.1) | Filter by partial title | Epic 1 (F1) | US-1.1: Filter Notes by Partial Title | JTBD-02.1 → "3-char substring → matching notes in < 200 ms" → Real-time case-insensitive title filter; pinned-first order preserved; `?q=` param survives refresh | R2 |
| SM-1.02 | Search (JRN-02.1) | Search with no match | Epic 1 (F1) | US-1.2: Empty State When Search Matches Nothing | JTBD-02.1 → "Know filter is working; adjust my query" → Zero-match state shows clear message; clearing input restores full list immediately | R2 |
| SM-3.03 | Open (JRN-02.1) | Open note from filtered list | Epic 3 (F3) | US-3.1: Open Note with Pre-filled Values | JTBD-02.2 → "Pre-loaded; don't re-type anything" → `/notes/[id]/edit` pre-populates all fields before user looks down; no blank flash | R1 |
| SM-3.04 | Edit & Pin (JRN-02.1) | Update body; toggle pin | Epic 3 (F3) | US-3.2: Save Edit and See Updated Title in List | JTBD-02.2 → "Edit + save in ≤ 3 interactions from list" → Change title/body/pin → Save → `PUT /api/notes/[id]` → redirect `/` with updated card | R1 |
| SM-3.05 | Edit & Pin (JRN-02.1) | Update pin status | Epic 3 (F3) | US-3.3: Toggle Pinned Status on Existing Note | JTBD-02.2 → "Each action ≤ few taps; no re-navigation" → Pin toggle saves on explicit Save tap; note moves to correct section on redirect | R1 |
| SM-5.03 | Save (JRN-02.1) | API saves edit | Epic 5 (F5) | US-5.3: Fetch, Update, and Delete via API | JTBD-02.2 → "Change reflected immediately after redirect" → `PUT /api/notes/[id]` returns `200` with updated Note; list reflects change on redirect | R1 |
| SM-0.06 | Save (JRN-02.1) | List reflects edit on return | Epic 0 (F0) | US-0.4: Updated Note Title Reflected in List | JTBD-02.2 → "List reflects current state; no stale data" → After `PUT`, redirect to `/`; note card shows new title; no stale cache | R1 |
| SM-0.07 | Triage Remainder (JRN-02.1) | Stable list order on return | Epic 0 (F0) | US-0.1: View the Note List | JTBD-02.3 → "Sort order identical on every return visit" → Pinned-first, newest-first deterministic; same order as before the session | R1 |
| SM-3.06 | Navigate (JRN-02.2) | Open stale note for delete | Epic 3 (F3) | US-3.1: Open Note with Pre-filled Values | JTBD-02.2 → "Open and identify the note to delete" → Note pre-populates on edit page; title visible so user confirms they have the right note | R1 |
| SM-4.01 | Locate Delete (JRN-02.2) | Find Delete button | Epic 4 (F4) | US-4.1: Delete a Note with Confirmation | JTBD-02.2 → "Delete visible, not buried" → Delete button clearly visible on edit page; distinct from Save (no Gold); ≥ 44 × 44 px | R1 |
| SM-4.02 | Confirm (JRN-02.2) | Confirm deletion | Epic 4 (F4) | US-4.1: Delete a Note with Confirmation | JTBD-02.2 → "Exactly 1 confirmation step; note title in prompt" → Confirmation UI shows note title; 1 tap to confirm; no API call on Cancel | R1 |
| SM-4.03 | Confirm (JRN-02.2) | Error if delete fails | Epic 4 (F4) | US-4.2: Error Message If Deletion Fails | JTBD-02.2 → "Know to retry; don't assume note was removed" → `404`/`500` response shows distinct error banners; edit form remains accessible | R1 |
| SM-5.04 | Return (JRN-02.2) | API deletes note | Epic 5 (F5) | US-5.3: Fetch, Update, and Delete via API | JTBD-02.2 → "Delete confirmed; note absent from list on redirect" → `DELETE /api/notes/[id]` returns `204`; `404` if already gone | R1 |
| SM-0.08 | Return (JRN-02.2) | Deleted note gone from list | Epic 0 (F0) | US-0.5: Deleted Note No Longer in List | JTBD-02.2 → "Permanent deletion; clean list" → After `DELETE`, redirect to `/`; deleted card absent; remaining notes retain sort order | R1 |
| SM-3.07 | (Error state) | Not-found state | Epic 3 (F3) | US-3.4: Not-Found State for Missing Note | JTBD-02.2 → "Understand note was deleted; link back to list" → Non-existent/non-integer id renders "Note not found." with back link; no form shown | R1 |
| SM-5.05 | (API layer) | Retrieve all notes via API | Epic 5 (F5) | US-5.1: Retrieve All Notes via API | JTBD-02.3 → "Sort order identical; API matches UI" → `GET /api/notes` returns sorted JSON array; `?q=` filter preserves pinned-first order | R1 |

### 3.3 PER-03: The Technical Deployer

| SM-ID | Journey Stage | Activity | Epic | Story | NaC (derived) | Release |
|-------|--------------|----------|------|-------|---------------|---------|
| SM-7.03 | Configure (JRN-03.1) | Set DATABASE_URL; start container | Epic 7 (F7) | US-7.1: Notes Table Created Automatically | JTBD-03.1 → "Only DATABASE_URL needed; everything else automatic" → Schema created on startup using env var; no hard-coded credentials; no manual SQL | R1 |
| SM-7.04 | Configure (JRN-03.1) | Missing DATABASE_URL fails loudly | Epic 7 (F7) | US-7.3: Clear Error on Missing DATABASE_URL | JTBD-03.1 → "Diagnose misconfiguration immediately" → Absent/empty `DATABASE_URL` → non-zero exit code + clear log message; no HTTP requests served | R1 |
| SM-7.05 | Monitor Startup (JRN-03.1) | Migration runs with log output | Epic 7 (F7) | US-7.1: Notes Table Created Automatically | JTBD-03.1 → "Clear log lines; schema ready signal" → Migration log confirms `CREATE TABLE IF NOT EXISTS` ran; server accepts requests only after completion | R1 |
| SM-6.01 | Verify Health (JRN-03.1) | Call health endpoint | Epic 6 (F6) | US-6.1: Confirm App Liveness via Health Endpoint | JTBD-03.2 → "`GET /api/health` → `200 {"status":"ok"}` in < 200 ms" → `200` + JSON body; no DB query; no auth required; `405` on non-GET | R1 |
| SM-5.06 | Validate Schema (JRN-03.1) | POST a test note to confirm table | Epic 5 (F5) | US-5.2: Create a Note via API | JTBD-03.1 → "Table really exists; POST succeeds" → `POST /api/notes` with valid body returns `201`; missing title returns `400 TITLE_REQUIRED` | R1 |
| SM-7.06 | Confirm Idempotency (JRN-03.1) | Restart; migration re-runs safely | Epic 7 (F7) | US-7.2: Data Survives Server Restart | JTBD-03.1 → "Second startup clean; same data; zero migration errors" → `IF NOT EXISTS` makes migration a no-op on restart; existing rows untouched | R1 |
| SM-9.03 | Embed (JRN-03.2) | Load app in cross-origin iframe | Epic 9 (F9) | US-9.1: App Renders Inside Iframe | JTBD-03.3 → "Renders in iframe; no blank frame" → No `X-Frame-Options` header; app visible in cross-origin iframe with no blank page | R1 |
| SM-9.04 | Inspect Headers (JRN-03.2) | Check response headers | Epic 9 (F9) | US-9.1: App Renders Inside Iframe | JTBD-03.3 → "No `X-Frame-Options`; no `frame-ancestors` CSP" → DevTools Network confirms neither header present; `next.config.mjs` exists (not `.ts`) | R1 |
| SM-9.05 | Check Console (JRN-03.2) | Zero console errors | Epic 9 (F9) | US-9.1: App Renders Inside Iframe | JTBD-03.3 → "Zero SecurityError; zero frame-blocking warnings across 3 loads" → Console clean; app renders full UI inside iframe with correct layout | R1 |
| SM-9.06 | Interact (JRN-03.2) | Create note inside iframe | Epic 9 (F9) | US-9.2: App Reachable on Port 3000 | JTBD-03.3 → "Full interactivity inside iframe confirms deployment" → Create note flow completes inside iframe; `0.0.0.0:3000` reachable from container | R1 |

---

## 4. NaC Derivation Table

Full traceability: JTBD outcome → Journey stage → NaC statement → Story

| NaC-ID | JTBD-ID | JTBD Outcome (abbreviated) | Journey Stage | NaC Statement | Stories |
|--------|---------|---------------------------|---------------|---------------|---------|
| NaC-01 | JTBD-01.1 | Note captured in < 15 s, no auth | JRN-01.1: Open | App auto-migrates and serves requests within 10 s of container start; no login screen at any path | US-7.1, US-9.2 |
| NaC-02 | JTBD-01.1 | Note captured in < 15 s, no auth | JRN-01.1: Create | `/notes/new` form renders with title field; submits via `POST /api/notes`; all tap targets ≥ 44 × 44 px on 375 px viewport | US-2.1, US-2.3, US-8.1 |
| NaC-03 | JTBD-01.1 | Note captured in < 15 s, no auth | JRN-01.1: Save | `POST /api/notes` with valid body returns `201`; save + redirect completes within 15 s of cold page load | US-5.2, US-2.4 |
| NaC-04 | JTBD-01.2 | Saved note appears at list top immediately | JRN-01.1: Confirm | Redirect after `POST` lands at `/`; new note is the topmost unpinned entry (or topmost overall if pinned); no manual refresh needed | US-0.3, US-7.2 |
| NaC-05 | JTBD-01.3 | Pinned note stays at top after new notes added | JRN-01.2: Toggle | Pin checkbox accessible on edit page; gold indicator visible when active; toggling + saving moves note to pinned section immediately | US-3.3, US-2.2 |
| NaC-06 | JTBD-01.3 | Pinned note stays at top after new notes added | JRN-01.2: Save & Verify | After `PUT` with `pinned: true`, redirect shows note at position 1 in list; 5 subsequent unpinned notes do not push it down | US-5.3, US-3.2 |
| NaC-07 | JTBD-02.1 | Partial search returns accurate results in real time | JRN-02.1: Search | Typing a 3-char substring into the search box narrows list to matching titles within 200 ms; case-insensitive; pinned-first order preserved; clear restores full list | US-1.1, US-1.2 |
| NaC-08 | JTBD-02.2 | Edit + save in ≤ 3 interactions | JRN-02.1: Open → Edit & Pin → Save | Open note (1) → edit field (2) → tap Save (3) → redirect to updated list; exactly 3 interactions from list view | US-3.1, US-3.2, US-0.4 |
| NaC-09 | JTBD-02.2 | Delete with confirmation in ≤ 2 taps | JRN-02.2: Locate Delete → Confirm → Return | Delete button visible on edit page; confirmation prompt shows note title; 1 tap to confirm; redirect to list with note absent | US-4.1, US-4.2, US-0.5 |
| NaC-10 | JTBD-02.3 | Sort order identical after restart | JRN-02.1: Orient + Triage Remainder | `GET /api/notes` returns pinned-first, newest-first on every call including after server restart; no user action required to restore order | US-0.1, US-5.1, US-7.2 |
| NaC-11 | JTBD-03.1 | Healthy in 30 s with only DATABASE_URL | JRN-03.1: Configure → Monitor Startup | Only `DATABASE_URL` needed; migration runs automatically with log output; no manual SQL; `GET /api/health` returns `200` within 30 s | US-7.1, US-7.3, US-6.1 |
| NaC-12 | JTBD-03.1 | Idempotent; existing data survives restart | JRN-03.1: Confirm Idempotency | Server restart runs `CREATE TABLE IF NOT EXISTS` as a no-op; `GET /api/notes` returns identical list post-restart; zero migration errors in logs | US-7.2, US-5.1 |
| NaC-13 | JTBD-03.2 | Health endpoint responds in < 200 ms | JRN-03.1: Verify Health | `GET /api/health` returns HTTP `200`, body `{"status":"ok"}`, `Content-Type: application/json`; response time < 200 ms; no DB query issued | US-6.1 |
| NaC-14 | JTBD-03.3 | App renders in cross-origin iframe | JRN-03.2: Embed → Inspect Headers → Check Console | No `X-Frame-Options` header; no `frame-ancestors` CSP; app renders visible content in cross-origin iframe; zero `SecurityError` across 3 consecutive loads | US-9.1, US-9.2 |

---

## 5. Release Planning

### Release Strategy

| Principle | Application |
|-----------|-------------|
| P0 stories → R1 (MVP) | All P0 stories must ship together for any persona to get end-to-end value |
| P1 stories → R2 | Search (F1) and mobile polish (F8) enhance the experience but do not block core CRUD |
| Journey completeness | R1 delivers complete JRN-01.1, JRN-01.2, JRN-02.1 (minus search), JRN-02.2, JRN-03.1, JRN-03.2 |
| R2 adds depth | R2 completes the search journey (JRN-02.1 full) and adds the mobile-first UX polish layer |

---

### R1 — MVP: Core Write-Find-Edit Loop

**Theme:** Every persona can complete their primary journey end-to-end.

**Personas served:** PER-01, PER-02, PER-03

**JTBD addressed:** JTBD-01.1, JTBD-01.2, JTBD-01.3, JTBD-02.2, JTBD-02.3, JTBD-03.1, JTBD-03.2, JTBD-03.3

**Stories (24 total — all P0):**

| Story | Title | Epic | Primary Persona |
|-------|-------|------|----------------|
| US-0.1 | View the Note List | F0 | PER-01 |
| US-0.2 | Empty State When No Notes Exist | F0 | PER-01 |
| US-0.3 | Newly Created Note Appears at Top | F0 | PER-01 |
| US-0.4 | Updated Note Title Reflected in List | F0 | PER-02 |
| US-0.5 | Deleted Note No Longer in List | F0 | PER-02 |
| US-2.1 | Create a New Note with Title and Body | F2 | PER-01 |
| US-2.2 | Create a Pinned Note | F2 | PER-01 |
| US-2.3 | Block Submission When Title Is Empty | F2 | PER-01 |
| US-2.4 | Error Banner on API Failure (Create) | F2 | PER-01 |
| US-3.1 | Open Note with Pre-filled Values | F3 | PER-02 |
| US-3.2 | Save Edit and See Updated Title in List | F3 | PER-02 |
| US-3.3 | Toggle Pinned Status on Existing Note | F3 | PER-02 |
| US-3.4 | Not-Found State for Missing Note | F3 | PER-02 |
| US-4.1 | Delete a Note with Confirmation | F4 | PER-02 |
| US-4.2 | Error Message If Deletion Fails | F4 | PER-02 |
| US-5.1 | Retrieve All Notes via API | F5 | PER-03 |
| US-5.2 | Create a Note via API | F5 | PER-03 |
| US-5.3 | Fetch, Update, and Delete via API | F5 | PER-03 |
| US-6.1 | Confirm App Liveness via Health Endpoint | F6 | PER-03 |
| US-7.1 | Notes Table Created Automatically | F7 | PER-03 |
| US-7.2 | Data Survives Server Restart | F7 | PER-03 |
| US-7.3 | Clear Error on Missing DATABASE_URL | F7 | PER-03 |
| US-9.1 | App Renders Inside Iframe | F9 | PER-03 |
| US-9.2 | App Reachable on Port 3000 | F9 | PER-03 |

**Journeys completed by R1:**

| Journey | Completeness | Notes |
|---------|-------------|-------|
| JRN-01.1 (Capture a thought) | ✅ Full | Open→Orient→Create→Save→Confirm all covered |
| JRN-01.2 (Pin after capture) | ✅ Full | Identify→Navigate→Toggle→Save & Verify all covered |
| JRN-02.1 (Search + triage) | ⚠️ Partial | Search stage requires US-1.1/1.2 (R2); all other stages covered |
| JRN-02.2 (Delete stale note) | ✅ Full | Navigate→Locate Delete→Confirm→Return all covered |
| JRN-03.1 (Deploy + health check) | ✅ Full | Configure→Monitor→Verify→Validate→Idempotency all covered |
| JRN-03.2 (Iframe verification) | ✅ Full | Embed→Inspect Headers→Check Console→Interact all covered |

**NaC gate for R1:** All of NaC-01, NaC-02, NaC-03, NaC-04, NaC-05, NaC-06, NaC-08, NaC-09, NaC-10, NaC-11, NaC-12, NaC-13, NaC-14 must pass.

---

### R2 — Search + Mobile Polish

**Theme:** Backlog triage becomes fast and comfortable on any device.

**Personas served:** PER-01, PER-02 (PER-03 gains no new stories in R2)

**JTBD addressed:** JTBD-02.1 (completed), JTBD-01.1 (mobile polish adds UX depth)

**Stories (5 total — all P1):**

| Story | Title | Epic | Primary Persona |
|-------|-------|------|----------------|
| US-1.1 | Filter Notes by Partial Title | F1 | PER-02 |
| US-1.2 | Empty State When Search Matches Nothing | F1 | PER-02 |
| US-8.1 | Use App on Mobile Viewport | F8 | PER-01 |
| US-8.2 | Submit and Delete Buttons Are Distinct | F8 | PER-01 |
| US-8.3 | All Form Inputs Are Accessible | F8 | PER-01 |

**Journeys completed by R2:**

| Journey | Completeness | Notes |
|---------|-------------|-------|
| JRN-02.1 (Search + triage) | ✅ Full | Search stage now covered by US-1.1, US-1.2 |
| All PER-01 journeys | ✅ Enhanced | Mobile UX polish (F8) reduces friction across JRN-01.1 and JRN-01.2 |

**NaC gate for R2:** NaC-07 (search returns results in < 200 ms) must pass in addition to all R1 NaC.

---

## 6. Coverage Analysis

### 6.1 Persona Coverage by Release

| Persona | R1 | R2 | Notes |
|---------|----|----|-------|
| PER-01 Quick Capturer | ✅ Core flows (create, pin, list) | ✅ Mobile polish (F8) added | JRN-01.1 + JRN-01.2 fully served in R1 |
| PER-02 Focused Reviewer | ✅ Edit, delete, list | ✅ Search (F1) completed | JRN-02.2 fully served in R1; JRN-02.1 completes in R2 |
| PER-03 Technical Deployer | ✅ All 10 PER-03 stories in R1 | — No new stories | Both JRN-03.1 + JRN-03.2 fully served in R1 |

### 6.2 JTBD Coverage by Release

| JTBD-ID | R1 | R2 | Fully Addressed |
|---------|----|----|----------------|
| JTBD-01.1 | Core (US-2.1, US-7.1, US-9.2) | Polish (US-8.1, US-8.2, US-8.3) | ✅ R2 |
| JTBD-01.2 | ✅ US-0.3, US-7.2 | — | ✅ R1 |
| JTBD-01.3 | ✅ US-2.2, US-3.3, US-5.3 | — | ✅ R1 |
| JTBD-02.1 | — | ✅ US-1.1, US-1.2 | ✅ R2 |
| JTBD-02.2 | ✅ US-3.1, US-3.2, US-4.1, US-4.2 | — | ✅ R1 |
| JTBD-02.3 | ✅ US-0.1, US-5.1, US-7.2 | — | ✅ R1 |
| JTBD-03.1 | ✅ US-7.1, US-7.2, US-7.3 | — | ✅ R1 |
| JTBD-03.2 | ✅ US-6.1 | — | ✅ R1 |
| JTBD-03.3 | ✅ US-9.1, US-9.2 | — | ✅ R1 |

### 6.3 Journey Stage Coverage

| Journey | Stage | Covered By | Release |
|---------|-------|-----------|---------|
| JRN-01.1 | Open | US-7.1, US-9.2 | R1 |
| JRN-01.1 | Orient | US-0.1, US-0.2 | R1 |
| JRN-01.1 | Create | US-2.1, US-2.3, US-2.4 | R1 |
| JRN-01.1 | Save | US-5.2 | R1 |
| JRN-01.1 | Confirm | US-0.3, US-7.2 | R1 |
| JRN-01.2 | Identify | US-0.1 | R1 |
| JRN-01.2 | Navigate | US-3.1 | R1 |
| JRN-01.2 | Toggle | US-3.3, US-2.2 | R1 |
| JRN-01.2 | Save & Verify | US-5.3, US-3.2 | R1 |
| JRN-02.1 | Orient | US-0.1 | R1 |
| JRN-02.1 | **Search** | **US-1.1, US-1.2** | **R2** |
| JRN-02.1 | Open | US-3.1 | R1 |
| JRN-02.1 | Edit & Pin | US-3.2, US-3.3 | R1 |
| JRN-02.1 | Save | US-5.3, US-0.4 | R1 |
| JRN-02.1 | Triage Remainder | US-0.1 | R1 |
| JRN-02.2 | Navigate | US-3.1 | R1 |
| JRN-02.2 | Locate Delete | US-4.1 | R1 |
| JRN-02.2 | Confirm | US-4.1, US-4.2 | R1 |
| JRN-02.2 | Return | US-5.3, US-0.5 | R1 |
| JRN-03.1 | Configure | US-7.1, US-7.3 | R1 |
| JRN-03.1 | Monitor Startup | US-7.1 | R1 |
| JRN-03.1 | Verify Health | US-6.1 | R1 |
| JRN-03.1 | Validate Schema | US-5.2 | R1 |
| JRN-03.1 | Confirm Idempotency | US-7.2, US-6.1 | R1 |
| JRN-03.2 | Embed | US-9.1, US-9.2 | R1 |
| JRN-03.2 | Inspect Headers | US-9.1 | R1 |
| JRN-03.2 | Check Console | US-9.1 | R1 |
| JRN-03.2 | Interact | US-9.2 | R1 |

**Only gap: JRN-02.1 / Search stage is deferred to R2.** JRN-02.1 Orient→Open→Edit→Save→Triage is fully covered in R1; the user can still triage by scrolling until R2 ships.

### 6.4 Gap Analysis

**Journey stages without R1 coverage:**
- JRN-02.1 → Search stage (covered in R2 by US-1.1, US-1.2) — **not a blocking gap; workaround is manual scroll**

**JTBD outcomes without R1 NaC:**
- JTBD-02.1 (Locate note from backlog) — deferred to R2; PER-02 can still triage without search in R1

**Orphan stories (not mapped to any journey stage):**
- *(None)* — all 29 stories are mapped to at least one journey stage in the matrix above

**JTBD outcomes with no derived NaC:**
- *(None)* — all 9 JTBD outcomes have at least one NaC entry in Section 4

**Personas not served by R1:**
- *(None)* — PER-01, PER-02, and PER-03 all receive end-to-end value from R1

---

## 7. NaC-to-Acceptance Criteria Alignment

This table verifies that each NaC statement aligns with the formal acceptance criteria in UserStories-QuickNotes.md.

| NaC-ID | NaC Statement (abbreviated) | Story | Key AC Match |
|--------|----------------------------|-------|-------------|
| NaC-01 | App auto-migrates and serves requests within 10 s; no login | US-7.1, US-9.2 | US-7.1 AC: `CREATE TABLE IF NOT EXISTS` runs before HTTP requests accepted · US-9.2 AC: server binds to `0.0.0.0:3000` |
| NaC-02 | Form renders; tap targets ≥ 44 × 44 px on 375 px | US-2.1, US-8.1 | US-2.1 AC: "form renders correctly on a 375 px mobile viewport with no horizontal scroll" · US-8.1 AC: "minimum tap target of 44 × 44 px" |
| NaC-03 | `POST /api/notes` returns `201`; save + redirect in < 15 s | US-5.2, US-2.4 | US-5.2 AC: "valid body returns `201` with created Note object" · US-2.4 AC: error banner on non-2xx; fields retain values |
| NaC-04 | Redirect to `/`; new note at top; no manual refresh | US-0.3, US-7.2 | US-0.3 AC: "newly created note is visible on the list without a page refresh" · US-7.2 AC: note created before restart retrievable after |
| NaC-05 | Pin checkbox accessible; gold indicator; moves to pinned section | US-3.3, US-2.2 | US-3.3 AC: "note appears in the correct section based on the new value" · US-2.2 AC: "pinned indicator (Gold accent or icon) is visible on the note card" |
| NaC-06 | After `PUT pinned:true`, note at position 1 in list | US-5.3, US-3.2 | US-5.3 AC: "`PUT /api/notes/[id]` returns `200` with updated Note object; `created_at` unchanged" |
| NaC-07 | 3-char search → matching notes in < 200 ms; clear restores list | US-1.1, US-1.2 | US-1.1 AC: "case-insensitive substring match"; "clearing the search input restores the full, unfiltered list" |
| NaC-08 | Open (1) → edit field (2) → Save (3) → updated list | US-3.1, US-3.2, US-0.4 | US-3.1 AC: all fields pre-filled · US-3.2 AC: "redirects to `/`; note card shows updated title" · US-0.4 AC: "no stale data" |
| NaC-09 | Delete → confirmation shows note title → 1 tap confirm → note absent | US-4.1, US-4.2, US-0.5 | US-4.1 AC: "confirmation step required"; "deleted note no longer appears" · US-0.5 AC: "deleted note's card no longer appears" |
| NaC-10 | `GET /api/notes` pinned-first, newest-first; identical after restart | US-0.1, US-5.1, US-7.2 | US-0.1 AC: "pinned notes first (newest-first within pinned), then un-pinned (newest-first)" · US-5.1 AC: "ordered: pinned-first then newest-first" |
| NaC-11 | Only `DATABASE_URL`; migration auto-runs; health `200` in 30 s | US-7.1, US-7.3, US-6.1 | US-7.1 AC: "migration runs using `process.env.DATABASE_URL` — no credentials hard-coded" · US-7.3 AC: non-zero exit code on missing var · US-6.1 AC: `200` + `{"status":"ok"}` |
| NaC-12 | Restart → `IF NOT EXISTS` no-op; identical note list; zero errors | US-7.2, US-5.1 | US-7.2 AC: "migration runs silently as a no-op when table already exists — no errors, no data loss" |
| NaC-13 | `GET /api/health` → `200 {"status":"ok"}` in < 200 ms; no DB query | US-6.1 | US-6.1 AC: "endpoint performs no database query"; "responds within 200 ms"; `405` on non-GET |
| NaC-14 | No `X-Frame-Options`; no `frame-ancestors` CSP; zero SecurityError | US-9.1, US-9.2 | US-9.1 AC: "HTTP responses do not include an `X-Frame-Options` header"; "no `frame-ancestors 'none'` or `frame-ancestors 'self'`" |

**Alignment result:** All 14 NaC statements map to at least one explicit acceptance criterion in the UserStories document. No NaC is invented beyond what is grounded in JTBD and reflected in AC.

---

## 8. Validation Checklist

| Check | Status |
|-------|--------|
| Every UserStory (US-0.1 through US-9.2) appears in the map | ✅ All 29 stories placed (some multi-stage stories appear in multiple rows) |
| Every mapped story has a NaC derived from JTBD | ✅ All SM-entries carry a JTBD-ID traced NaC |
| NaC Derivation Table has full traceability chains | ✅ 14 NaC entries each include JTBD-ID → JRN stage → NaC text → story IDs |
| Release planning groups are defined | ✅ R1 (24 P0 stories) + R2 (5 P1 stories) |
| Coverage analysis identifies gaps and orphans | ✅ One gap (JRN-02.1 Search, R2); zero orphans |
| NaC-to-AC mapping verifies alignment | ✅ Section 7: all 14 NaC cross-checked against AC |
| No orphan stories (unmapped) | ✅ 0 orphan stories |
| Each release enables at least one complete journey | ✅ R1: 5 complete journeys · R2: completes JRN-02.1 |
| All 9 JTBD outcomes have ≥ 1 NaC | ✅ NaC-01 through NaC-14 cover all 9 JTBD IDs |
| All 3 personas served by R1 | ✅ PER-01, PER-02, PER-03 all receive end-to-end value in R1 |

---

*STORY-MAP generated: 2026-06-17 | Product: QuickNotes v1.0 | Derived from: PERSONAS-QuickNotes.md + JOURNEYS-QuickNotes.md + JTBD-QuickNotes.md + UserStories-QuickNotes.md + PRD-QuickNotes.md*
