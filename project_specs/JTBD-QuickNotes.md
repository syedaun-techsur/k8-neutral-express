# Jobs-to-be-Done — QuickNotes

| Field | Value |
|---|---|
| **Product** | QuickNotes |
| **Version** | 1.0 |
| **Date** | 2026-06-17 |
| **Related Personas** | PERSONAS-QuickNotes.md (PER-01, PER-02, PER-03) |
| **Related PRD** | PRD-QuickNotes.md |
| **Status** | Active |

---

## 1. JTBD Summary Table

| JTBD-ID | Persona | Job Statement (abbreviated) | Priority |
|---|---|---|---|
| JTBD-01.1 | PER-01 Quick Capturer | Capture a thought before it disappears, with no login or setup friction | P0 |
| JTBD-01.2 | PER-01 Quick Capturer | Confirm a note was saved and is retrievable without doing extra work | P0 |
| JTBD-01.3 | PER-01 Quick Capturer | Elevate an important note so it stays visible on the next visit | P1 |
| JTBD-02.1 | PER-02 Focused Reviewer | Locate a specific note from a growing backlog without scrolling the full list | P1 |
| JTBD-02.2 | PER-02 Focused Reviewer | Triage the note backlog — edit, pin, or delete notes — in a single focused session | P0 |
| JTBD-02.3 | PER-02 Focused Reviewer | Trust that the list order is predictable and stable between visits | P1 |
| JTBD-03.1 | PER-03 Technical Deployer | Deploy the app in a containerized environment with zero manual database setup | P0 |
| JTBD-03.2 | PER-03 Technical Deployer | Confirm the app is alive and correctly integrated without querying the database | P0 |
| JTBD-03.3 | PER-03 Technical Deployer | Embed the app in an iframe preview without hitting frame-blocking errors | P0 |

---

## 2. PER-01: The Quick Capturer — Jobs

---

### JTBD-01.1: Capture a Fleeting Thought Before It's Gone

**Job Statement:**
When I have an idea, reminder, or snippet that will disappear in the next few seconds, I want to open the app, type a title, and hit save — with no login, no configuration, and no waiting — so I can preserve the thought and move on immediately.

**Current Alternatives:**
- Typing into the phone's default notes app (requires unlocking, finding the app, waiting for sync)
- Sending a message to themselves on a chat app (creates clutter; hard to retrieve later)
- Relying on memory (high failure rate for fleeting thoughts)
- Using a note app that requires login (the thought is gone by the time authentication completes)

**Hiring Criteria:**
- App loads and is interactive within 10 seconds of process start — no login screen
- Create-note form is reachable in one tap from the home screen
- Title field is the first focused element; keyboard appears automatically on mobile
- Save completes and redirects to the note list in under 15 seconds from cold page load on a 375 px viewport
- All tap targets (title input, Save button) are ≥ 44 × 44 px — no mis-taps on first touch

**Success Measure:** User creates a titled note and sees it appear in the list in under 15 seconds from a cold page load on a 375 px mobile viewport, with zero login or configuration steps.

**Related Features:** F2, F5, F7, F8, F9
**Priority:** P0

---

### JTBD-01.2: Confirm a Note Was Saved Without Extra Effort

**Job Statement:**
When I have just saved a note, I want to see it immediately at the top of the list without taking any additional action, so I can be confident the thought is safely persisted before I close the app.

**Current Alternatives:**
- Refreshing the page manually to verify the save took effect
- Opening the note again to confirm its contents are intact
- Trusting that the save succeeded based solely on the redirect (no visual confirmation)

**Hiring Criteria:**
- Redirect to the list view happens automatically after a successful save — no extra tap required
- The newly created note appears at the top of the list (newest-first, unless pinned notes push it down)
- The list renders all saved notes including the new one in < 500 ms
- Notes survive a full server restart — a note created before a restart is retrievable after

**Success Measure:** Within 3 seconds of hitting Save, the user sees their new note rendered at the top of the list view with no additional action required.

**Related Features:** F0, F5, F7
**Priority:** P0

---

### JTBD-01.3: Elevate an Important Note So It Stays Visible

**Job Statement:**
When I capture a note that I know I'll need to reference repeatedly, I want to pin it so it always appears at the top of the list regardless of how many newer notes I add, so I can find it instantly on every future visit without searching.

**Current Alternatives:**
- Editing the note title to start with "!!!" or "IMPORTANT" to make it visually distinct
- Relying on memory for which notes are high-priority
- Keeping the most important note as the most recently created so it stays at the top (fragile)

**Hiring Criteria:**
- Pinned toggle is accessible on both the create form and the edit page
- Pinned notes appear before all unpinned notes in the list, regardless of creation time
- The pinned indicator is visually distinct (Gold `#FBCA5C` accent) without being distracting
- Toggling pin status takes no more than 2 taps from the list view (list → edit → toggle + save)

**Success Measure:** A pinned note remains at the top of the list after 5 subsequent notes are created, confirmed with a single visual scan of the home screen.

**Related Features:** F0, F2, F3, F8
**Priority:** P1

---

## 3. PER-02: The Focused Reviewer — Jobs

---

### JTBD-02.1: Locate a Specific Note From a Growing Backlog

**Job Statement:**
When I have accumulated a dozen or more notes and need to find one whose full title I only partially remember, I want to type a keyword into a search box and see only matching notes instantly, so I can locate the right note without scrolling through the entire list.

**Current Alternatives:**
- Scrolling through the full note list and visually scanning each title
- Using browser Ctrl+F (unreliable on mobile; only finds text currently rendered)
- Relying on a mental model of creation date to estimate where a note might appear in the list
- Using a cloud note app that requires an account just to get search functionality

**Hiring Criteria:**
- Search input is visible at the top of the list view without navigating to a separate page
- Filtering is case-insensitive and matches any substring within the title
- Results update in real time as characters are typed — no Submit button required
- Clearing the search input restores the full sorted list immediately
- Pinned-first, newest-first sort order is preserved within filtered results

**Success Measure:** User types a 3-character partial title and sees only matching notes within 200 ms, with zero false positives or false negatives.

**Related Features:** F0, F1
**Priority:** P1

---

### JTBD-02.2: Triage the Note Backlog in a Single Focused Session

**Job Statement:**
When I sit down with 10–20 accumulated notes and want to clear the backlog, I want to quickly open, edit, pin, or delete notes in sequence — with each action taking no more than a few taps — so I can process the entire backlog in one focused session without context-switching or re-navigating.

**Current Alternatives:**
- Opening notes one at a time with no clear flow back to the list (losing position)
- Deleting notes without a confirmation step and accidentally losing important content
- Using a heavyweight notes app that adds sharing and collaboration surfaces that slow down triage

**Hiring Criteria:**
- Each note in the list links directly to its edit page in one tap
- Edit page pre-populates all fields (title, body, pinned status) without user input
- Save redirects back to the list view automatically, ready for the next note
- Delete action requires exactly one confirmation step — no more, no fewer
- The list reflects edits (updated title, new pin status) immediately after redirect

**Success Measure:** User opens, edits, and saves a note in 3 or fewer interactions from the list view; delete with confirmation completes in 2 taps or fewer.

**Related Features:** F0, F3, F4, F5
**Priority:** P0

---

### JTBD-02.3: Trust That List Order Is Predictable and Stable

**Job Statement:**
When I return to the app after a period away, I want to see pinned notes at the top and remaining notes in newest-first order every time — without the list having been shuffled, re-sorted randomly, or having lost my pinned items — so I can orient myself instantly and rely on the app as a stable reference point.

**Current Alternatives:**
- Manually re-pinning notes after each session because the pin state was not persisted
- Accepting random or undefined sort order and compensating by remembering creation dates
- Using the note body to encode priority ("Priority 1:") rather than relying on list position

**Hiring Criteria:**
- Sort order is deterministic: pinned notes first (by creation time descending), then unpinned notes (by creation time descending)
- Pinned status and note content survive a full server restart — no data is held in memory
- The same sort order is applied to both the full list and filtered (search) results
- No user action is required to restore sort order after a session ends

**Success Measure:** After a server restart, the note list renders with the identical pinned-first, newest-first order as before the restart, with all pinned flags intact.

**Related Features:** F0, F1, F5, F7
**Priority:** P1

---

## 4. PER-03: The Technical Deployer — Jobs

---

### JTBD-03.1: Deploy the App With Zero Manual Database Setup

**Job Statement:**
When I start the app in a new containerized environment by providing only a `DATABASE_URL` environment variable, I want the database schema to be created automatically on startup — with no SQL commands, no migration scripts to run manually, and no hard-coded credentials — so I can have a fully functional app without any manual intervention.

**Current Alternatives:**
- Running `psql` manually to execute schema creation scripts before starting the server
- Copying and editing SQL migration files each time the environment is rebuilt
- Using ORMs with complex CLI migration workflows that add setup overhead
- Hard-coding database credentials in config files (brittle, insecure, non-portable)

**Hiring Criteria:**
- Server runs `CREATE TABLE IF NOT EXISTS notes (...)` automatically before accepting any requests
- The only required configuration is a `DATABASE_URL` environment variable — no other setup
- Migration is idempotent: re-running on an existing schema produces no errors and causes no data loss
- Migration failure produces a clear error log and halts server startup (fail loudly, not silently)
- No credentials appear in source code; all database config is read from runtime environment

**Success Measure:** App reaches a healthy state (health endpoint returns `200 {"status":"ok"}`) within 30 seconds of container start, providing only `DATABASE_URL` — zero manual SQL commands executed.

**Related Features:** F5, F6, F7, F9
**Priority:** P0

---

### JTBD-03.2: Confirm App Health Without Querying the Database

**Job Statement:**
When the app has started and I need to verify it is alive and the startup sequence completed successfully, I want to call a single lightweight endpoint and receive an unambiguous `200 OK` response — without connecting to the database myself or parsing log files — so I can integrate this check into orchestration tooling and automate deployment verification.

**Current Alternatives:**
- Querying the PostgreSQL instance directly to check if the `notes` table exists
- Parsing server startup logs for success/failure signals (brittle, varies by environment)
- Making a test request to a data endpoint like `GET /api/notes` and interpreting the response (conflates liveness with data correctness)
- No health check at all — relying on absence of errors as a proxy for health

**Hiring Criteria:**
- `GET /api/health` returns HTTP `200` with body `{"status":"ok"}` every time the app is running
- The endpoint requires no authentication, no query parameters, and no request body
- Response time is under 200 ms under normal conditions
- The endpoint does not perform a database query — it is a liveness check only
- Returns a non-200 status or is unavailable if the server has not yet started

**Success Measure:** Automated smoke test calls `GET /api/health` and receives `200 {"status":"ok"}` within 200 ms, with 100% reliability across 10 consecutive restarts.

**Related Features:** F6
**Priority:** P0

---

### JTBD-03.3: Embed the App in an Iframe Without Frame-Blocking Errors

**Job Statement:**
When I embed the running app inside an iframe preview pane in a cross-origin parent page, I want the app to render fully without a blank page, `SecurityError`, or console warnings about frame-blocking headers — and without needing to configure any CSP exceptions on the parent — so I can use the app in its intended deployment context immediately.

**Current Alternatives:**
- Setting `allow="*"` iframe attributes on the parent page to override restrictive headers (requires parent page control)
- Manually removing `X-Frame-Options` headers from a middleware layer each time the app is rebuilt
- Running the app in a non-iframe context and losing the embedded preview workflow entirely
- Configuring a reverse proxy to strip frame-blocking headers (adds infrastructure complexity)

**Hiring Criteria:**
- HTTP responses do not include `X-Frame-Options` header (any value)
- Content Security Policy (if set) does not include `frame-ancestors 'none'` or `frame-ancestors 'self'`
- Server binds to `0.0.0.0:3000` — reachable from container networking, not just localhost
- Config file is `next.config.mjs` or `next.config.js` — never `next.config.ts` (Next 14 hard-errors on TypeScript config)
- App renders visibly in a 375 px × 812 px iframe on a cross-origin parent page with no console errors

**Success Measure:** App renders with visible content inside a cross-origin iframe with zero `SecurityError`, blank page, or frame-blocking console warnings across three consecutive loads.

**Related Features:** F8, F9
**Priority:** P0

---

## 5. Outcome-to-Feature Traceability

| JTBD-ID | Related Features | Expected Outcome |
|---|---|---|
| JTBD-01.1 | F2, F5, F7, F8, F9 | Note created and saved to PostgreSQL in < 15 s on a 375 px viewport, no login required |
| JTBD-01.2 | F0, F5, F7 | Saved note appears at top of list immediately after redirect; survives server restart |
| JTBD-01.3 | F0, F2, F3, F8 | Pinned note remains at top of list regardless of subsequent note creation |
| JTBD-02.1 | F0, F1 | Partial-title search returns matching notes in real time (< 200 ms), no false positives |
| JTBD-02.2 | F0, F3, F4, F5 | Edit + save in ≤ 3 interactions; delete with confirmation in ≤ 2 taps |
| JTBD-02.3 | F0, F1, F5, F7 | Pinned-first, newest-first order identical before and after server restart |
| JTBD-03.1 | F5, F6, F7, F9 | App healthy within 30 s of container start; zero manual SQL; idempotent on restart |
| JTBD-03.2 | F6 | `GET /api/health` returns `200 {"status":"ok"}` in < 200 ms; no DB query required |
| JTBD-03.3 | F8, F9 | App renders in cross-origin iframe with zero console errors or blank-page events |

**Feature coverage check:** F0 ✅ · F1 ✅ · F2 ✅ · F3 ✅ · F4 ✅ · F5 ✅ · F6 ✅ · F7 ✅ · F8 ✅ · F9 ✅

---

## 6. NaC Preview

*Candidate Natural Acceptance Criteria for each job. These will be refined into formal NaC statements in the STORY-MAP phase.*

| JTBD-ID | Outcome | Candidate Natural Acceptance Criteria |
|---|---|---|
| JTBD-01.1 | Note saved in < 15 s with no auth | Given a cold page load on a 375 px viewport, when I enter a title and tap Save, then a new note is persisted in PostgreSQL and I am redirected to the list view within 15 seconds, with no login prompt shown at any point |
| JTBD-01.2 | Saved note appears at list top immediately | Given I have just saved a note, when I am redirected to `/`, then the new note appears at the top of the list (or below pinned notes) without any manual refresh |
| JTBD-01.3 | Pinned note stays at top after new notes added | Given a note has `pinned = true`, when 5 additional unpinned notes are created, then the pinned note still appears above all unpinned notes on the home page |
| JTBD-02.1 | Partial search returns accurate results in real time | Given the list contains notes with varied titles, when I type a 3-character substring into the search box, then only notes whose titles contain that substring (case-insensitive) are shown, updated within 200 ms of each keystroke |
| JTBD-02.2 | Edit + save in ≤ 3 interactions | Given I am on the note list, when I tap a note, update a field, and tap Save, then I am returned to the updated list in exactly 3 interactions with the change reflected |
| JTBD-02.3 | Sort order identical after restart | Given notes exist with mixed pinned statuses, when the server restarts and I load `/`, then pinned notes appear first followed by unpinned notes newest-first — identical to pre-restart order |
| JTBD-03.1 | Healthy in 30 s with only DATABASE_URL | Given only `DATABASE_URL` is set, when the container starts, then `GET /api/health` returns `200 {"status":"ok"}` within 30 seconds and the `notes` table exists without any manual SQL having been executed |
| JTBD-03.2 | Health endpoint responds in < 200 ms | Given the server is running, when `GET /api/health` is called, then it returns HTTP `200` with body `{"status":"ok"}` and `Content-Type: application/json` within 200 ms, with no database query issued |
| JTBD-03.3 | App renders in cross-origin iframe | Given the app is embedded in a cross-origin iframe at `0.0.0.0:3000`, when the parent page loads, then the app renders visible content with zero `SecurityError`, no blank page, and no frame-blocking warnings in the browser console |

---

*JTBD generated: 2026-06-17 | Product: QuickNotes v1.0 | Derived from: PERSONAS-QuickNotes.md + PRD-QuickNotes.md*
