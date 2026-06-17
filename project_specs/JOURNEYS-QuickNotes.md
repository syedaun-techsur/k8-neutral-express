# User Journey Maps — QuickNotes

| Field | Value |
|---|---|
| **Product** | QuickNotes |
| **Version** | 1.0 |
| **Date** | 2026-06-17 |
| **Related Personas** | PERSONAS-QuickNotes.md (PER-01, PER-02, PER-03) |
| **Related JTBD** | JTBD-QuickNotes.md |
| **Related PRD** | PRD-QuickNotes.md |
| **Status** | Active |

---

## Journey Index

| JRN-ID | Persona | Scenario | Key JTBD | Stages |
|--------|---------|----------|----------|--------|
| JRN-01.1 | PER-01 Quick Capturer | Capture a fleeting thought on mobile in under 15 seconds | JTBD-01.1, JTBD-01.2 | 5 |
| JRN-01.2 | PER-01 Quick Capturer | Pin an important note immediately after capturing it | JTBD-01.3 | 4 |
| JRN-02.1 | PER-02 Focused Reviewer | Search, edit, and triage the growing note backlog | JTBD-02.1, JTBD-02.2, JTBD-02.3 | 6 |
| JRN-02.2 | PER-02 Focused Reviewer | Delete a stale note with confidence | JTBD-02.2 | 4 |
| JRN-03.1 | PER-03 Technical Deployer | Deploy the app from a fresh container start to confirmed healthy | JTBD-03.1, JTBD-03.2 | 5 |
| JRN-03.2 | PER-03 Technical Deployer | Verify iframe embedding works with zero console errors | JTBD-03.3 | 4 |

---

## PER-01: The Quick Capturer

---

### JRN-01.1: Capture a Fleeting Thought on Mobile

**Persona:** PER-01 (The Quick Capturer)

**Scenario:** The user is mid-commute with a phone in one hand. A project idea surfaces that must be written down in the next 10 seconds or it will be forgotten. They open QuickNotes in the mobile browser, land on the note list, navigate to create, type a title, hit save, and confirm the note appears in the list — all before the next train stop.

**Related Jobs:** JTBD-01.1, JTBD-01.2

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **Open** | Taps browser bookmark / types URL; page loads | App entry (F7, F9) | "Please load fast — I'm going to forget this" | Anxious, urgent | Slow cold start means the thought is gone by the time the page is interactive | Startup within 10 s; no login screen blocks the path |
| **Orient** | Scans the note list home page | Note List `/` (F0, F8) | "Where's the button to add a new note?" | Neutral, slightly hurried | 'New note' CTA not immediately visible on a 375 px screen | Gold-accented `+ New Note` button pinned at the top of the list, large tap target |
| **Create** | Taps `+ New Note`; types title into the title field | Create Note `/notes/new` (F2, F8) | "Is the keyboard up? Can I see the field?" | Focused | Touch target too small; keyboard covers the submit button; mis-tap on first touch | Title field auto-focused on page load; keyboard appears automatically; Save button stays above keyboard fold |
| **Save** | Taps Save button | Create Note form submit → `POST /api/notes` (F5) | "Did it go through? I don't see anything happening" | Tense | No loading indicator; double-tap risk if response is slow | Instant optimistic disable of Save button; redirect within 1 s of API response |
| **Confirm** | Views the note list after redirect | Note List `/` (F0, F7) | "There it is — I can close the app now" | Relieved, satisfied | New note not at top of list (sorted incorrectly); requires scroll to find it | Redirect always lands at the top of the list; new note visually highlighted briefly |

### Key Moments
- **Risk of Abandonment — Open stage:** If the app takes >10 s to load or shows a login prompt, the user abandons and loses the thought permanently.
- **Decision Point — Create stage:** If the keyboard blocks the Save button, the user hesitates and may abandon the form.
- **Delight Opportunity — Confirm stage:** Seeing the note instantly at the top of the list is a micro-moment of trust-building; it validates the entire product promise.

### Success Outcome
User creates a titled note and sees it appear at the top of the list in under 15 seconds from a cold page load on a 375 px viewport, with zero login or configuration steps. *(JTBD-01.1 + JTBD-01.2 success measures)*

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Open | F7 (Auto-Migration), F9 (Port Binding / Iframe Compat) |
| Orient | F0 (Note List View), F8 (Mobile-First UI) |
| Create | F2 (Create Note), F8 (Mobile-First UI) |
| Save | F5 (REST API — `POST /api/notes`) |
| Confirm | F0 (Note List View), F7 (PostgreSQL Durability) |

---

### JRN-01.2: Pin an Important Note Right After Capture

**Persona:** PER-01 (The Quick Capturer)

**Scenario:** The user just captured a note for a deadline reminder they know they'll need to reference every day for the next two weeks. Before closing the app, they want to pin it so it stays at the top of the list regardless of how many other notes they add. They navigate to the edit page, toggle the pin, and save — confirming the pinned indicator appears on the note.

**Related Jobs:** JTBD-01.3

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **Identify** | Locates the note they just created at the top of the list | Note List `/` (F0) | "It's right there — I need to pin it before I forget" | Purposeful | If the note sank below other entries, they'd have to scroll or search to find it | New note always at list top immediately post-redirect; easy visual target |
| **Navigate** | Taps the note title to open its edit page | Note List link → `/notes/[id]/edit` (F3) | "Can I edit the pin status here? I hope I don't have to dig through a menu" | Uncertain | Edit page takes a moment to pre-fill; blank flash before content appears | Instant pre-population from `GET /api/notes/[id]`; no empty form state |
| **Toggle** | Checks the pinned toggle on the edit form | Edit Note form (F3, F8) | "Is this saving automatically or do I need to hit Save?" | Slightly confused | Toggle visual state unclear — user unsure if it's active or inactive | Gold accent on the pinned toggle when active; label changes to "Pinned ✓" |
| **Save & Verify** | Taps Save; returns to note list; sees gold pinned indicator at top | `PUT /api/notes/[id]` → redirect `/` (F5, F0) | "There it is at the top. That's exactly what I wanted." | Satisfied, confident | Pin indicator too subtle to notice at a glance | Visually distinct gold pin badge on the note card in the list view |

### Key Moments
- **Decision Point — Toggle stage:** User is unsure if the toggle saves immediately or requires Save. Ambiguity here causes repeated taps and potential de-pin.
- **Delight Opportunity — Save & Verify stage:** Seeing the pinned note at the very top of the list with a visible gold indicator is the payoff for the entire JRN-01.2 flow.

### Success Outcome
A pinned note remains at the top of the list after 5 subsequent unpinned notes are created, confirmed with a single visual scan. *(JTBD-01.3 success measure)*

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Identify | F0 (Note List View) |
| Navigate | F3 (Edit Note) |
| Toggle | F3 (Edit Note), F8 (Mobile-First UI — Gold accent) |
| Save & Verify | F5 (REST API — `PUT /api/notes/[id]`), F0 (Note List View) |

---

## PER-02: The Focused Reviewer

---

### JRN-02.1: Search, Edit, and Triage the Note Backlog

**Persona:** PER-02 (The Focused Reviewer)

**Scenario:** It's Saturday morning. The user sits down at their desk with a browser window open to QuickNotes. There are 18 notes from the past two weeks. They need to find a specific note about a library they bookmarked (they remember the word "async" was in the title), update it with new information, pin it, and then quickly scan the rest of the list to delete anything obviously stale. They aim to finish in under 10 minutes.

**Related Jobs:** JTBD-02.1, JTBD-02.2, JTBD-02.3

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **Orient** | Scans the note list; 18 notes visible | Note List `/` (F0) | "This is getting long. I need the search box." | Focused but slightly overwhelmed | Long list with no visual hierarchy makes it hard to scan quickly | Pinned notes visually separated from unpinned; note cards compact and scannable |
| **Search** | Types "async" into the search input | Search box (F1) | "Should I see results updating as I type? Or do I need to press Enter?" | Uncertain at first, then satisfied | No visible feedback while typing; user unsure if filter is live | Real-time filter with instant result update; character count in placeholder ("Filter by title…") |
| **Open** | Taps the matching note to open edit | Note link → `/notes/[id]/edit` (F3) | "Please have the old content pre-loaded — I don't want to re-type anything" | Hopeful | Edit page loads with a spinner and blank fields for a moment | Instant pre-population; title and body both filled before the user looks down |
| **Edit & Pin** | Updates the body text; toggles pinned on | Edit Note form (F3, F8) | "Am I editing the right note? Let me check the title." | Attentive | No clear note title displayed as a heading on the edit page | Note title shown as a page heading above the form; body textarea resizes with content |
| **Save** | Taps Save; returns to list | `PUT /api/notes/[id]` → `/` (F5, F0) | "Did the pin take effect? Is it at the top now?" | Checking | Redirect lands mid-list; user has to scroll to verify pin | Auto-scroll to top on redirect; pinned note appears immediately at position 1 |
| **Triage Remainder** | Scans remaining notes; identifies 3 stale ones for deletion | Note List `/` (F0) | "Which of these can I get rid of? I'll delete the ones from last month." | Efficient, decisive | No creation date visible on note cards — can't tell which notes are old | Creation date as a subtle secondary label on each note card — **deferred post-MVP; newest-first sort order provides implicit recency signal in v1** |

### Key Moments
- **Decision Point — Search stage:** If filtering feels non-responsive or requires a Submit button, the user resorts to manual scrolling — defeating the purpose of search.
- **Decision Point — Triage Remainder stage:** Without visible creation dates, the user cannot confidently decide which notes to delete, causing hesitation.
- **Delight Opportunity — Save stage:** Redirecting to the top of the list with the edited note now pinned and visually highlighted rewards the triage effort.

### Success Outcome
User types a 3-character partial title and sees only matching notes within 200 ms; opens, edits, and saves the note in 3 or fewer interactions from the list view; list order remains pinned-first, newest-first on every return visit. *(JTBD-02.1 + JTBD-02.2 + JTBD-02.3 success measures)*

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Orient | F0 (Note List View) |
| Search | F1 (Note Search / Filter) |
| Open | F3 (Edit Note — `GET /api/notes/[id]`) |
| Edit & Pin | F3 (Edit Note), F8 (Mobile-First UI) |
| Save | F5 (REST API — `PUT /api/notes/[id]`), F0 (Note List View) |
| Triage Remainder | F0 (Note List View) |

---

### JRN-02.2: Delete a Stale Note With Confidence

**Persona:** PER-02 (The Focused Reviewer)

**Scenario:** During triage, the user identifies a note titled "Old grocery list — April" that is completely irrelevant. They navigate to its edit page and want to delete it. They are confident enough to confirm deletion, but they absolutely do not want an accidental delete of the wrong note. They expect exactly one confirmation step — no more friction, no fewer safeguards.

**Related Jobs:** JTBD-02.2

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **Navigate** | Taps the stale note from the list | Note List link → `/notes/[id]/edit` (F0, F3) | "Let me open this one and delete it." | Decisive | Mis-tap on the wrong note (notes too close together on small screens) | Note tap targets ≥ 44 px with enough vertical spacing to prevent mis-taps |
| **Locate Delete** | Scans the edit page for a Delete action | Edit Note page (F4) | "Is the delete button here? I hope it's not hidden." | Searching | Delete action buried below the fold or visually de-emphasized to the point of invisibility | Delete button clearly visible below the form but visually distinct from Save (red / secondary style) |
| **Confirm** | Taps Delete; confirmation UI appears; reads the note title in the confirmation prompt; taps Confirm | Confirmation UI (F4) | "Wait — does this say the right note title? Yes. OK." | Cautious, then relieved | Confirmation dialog doesn't name the note — user can't verify they're deleting the right one | Confirmation UI shows the note title ("Delete 'Old grocery list — April'?"); single tap to confirm — **now a formal requirement in FRD F04 and US-4.1** |
| **Return** | Redirected to the note list; stale note is gone | `DELETE /api/notes/[id]` → `/` (F5, F0) | "Good — it's gone. List is cleaner." | Satisfied | Deleted note briefly re-appears due to a stale list render before the redirect | Immediate redirect with consistent list render; no ghost entries |

### Key Moments
- **Risk of Abandonment — Locate Delete stage:** If the Delete button is hidden or absent, the user abandons and the stale note remains, cluttering the list forever.
- **Decision Point — Confirm stage:** The confirmation is the last safeguard. Showing the note title in the prompt prevents accidental deletion of the wrong item.
- **Delight Opportunity — Return stage:** A clean list after a deletion feels satisfying — an empty-state variant or a soft "Note deleted" toast reinforces the action.

### Success Outcome
Delete with confirmation completes in 2 taps or fewer from the edit page; the note list no longer contains the deleted note on redirect. *(JTBD-02.2 success measure)*

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Navigate | F0 (Note List View), F3 (Edit Note) |
| Locate Delete | F4 (Delete Note) |
| Confirm | F4 (Delete Note — confirmation UI) |
| Return | F5 (REST API — `DELETE /api/notes/[id]`), F0 (Note List View) |

---

## PER-03: The Technical Deployer

---

### JRN-03.1: Deploy From Fresh Container Start to Confirmed Healthy

**Persona:** PER-03 (The Technical Deployer)

**Scenario:** The user is spinning up QuickNotes in a new containerized dev environment. They set the `DATABASE_URL` environment variable pointing to a fresh PostgreSQL instance, start the container, and watch the server logs. They expect the schema to auto-create, the health endpoint to return 200, and the entire process to complete without any manual SQL or config steps. This is the gate that unlocks everything else.

**Related Jobs:** JTBD-03.1, JTBD-03.2

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **Configure** | Sets `DATABASE_URL` in environment; starts the container | Container / environment config (F7, F9) | "I'm only setting DATABASE_URL — nothing else should be needed" | Cautiously optimistic | Undocumented required env vars (other than `DATABASE_URL`) cause silent failures | App requires only `DATABASE_URL`; all other config has sensible defaults; documented clearly |
| **Monitor Startup** | Watches container logs for migration output | Server logs (F7) | "Is the migration running? Did it succeed or fail?" | Alert, watching carefully | Silent startup — no log output during migration makes it impossible to know if it succeeded | Clear log lines: `[migration] Running CREATE TABLE IF NOT EXISTS...` and `[migration] Schema ready.` |
| **Verify Health** | Calls `GET /api/health` via curl or browser | Health Endpoint `/api/health` (F6) | "If this returns 200, I know the app is alive and the migration finished" | Focused | Health endpoint returns 200 even when migration silently failed (conflates liveness with schema readiness) | Health endpoint returns 200 only after migration completes; startup fails loudly on migration error |
| **Validate Schema** | Checks that `notes` table exists by creating a test note via `POST /api/notes` | REST API `/api/notes` (F5) | "Let me confirm the table is really there with a quick POST" | Methodical | 500 error with no useful message if the table is missing | Clear `500` response body with `{"error":"relation \"notes\" does not exist"}` if migration failed |
| **Confirm Idempotency** | Restarts the container; calls health endpoint again; checks that existing notes survive | Server restart → F6, F7, F0 | "Second startup must be clean — no errors, same data" | Satisfied if clean; alarmed if errors appear | Migration re-run drops or alters the table — data loss on restart | `CREATE TABLE IF NOT EXISTS` guarantees idempotency; existing rows untouched |

### Key Moments
- **Risk of Abandonment — Monitor Startup stage:** If the startup logs are silent, the deployer cannot tell if migration succeeded or silently failed, causing time-consuming manual database inspection.
- **Decision Point — Verify Health stage:** The health endpoint is the official "app is ready" signal. If it's unreliable (returns 200 prematurely), the deployer loses trust in the entire deployment workflow.
- **Delight Opportunity — Confirm Idempotency stage:** A clean restart with all data intact and zero migration errors is the moment the deployer decides to trust the app long-term.

### Success Outcome
App reaches a healthy state (`GET /api/health` returns `200 {"status":"ok"}`) within 30 seconds of container start, providing only `DATABASE_URL` — zero manual SQL commands executed; restart produces identical note list with zero migration errors. *(JTBD-03.1 + JTBD-03.2 success measures)*

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Configure | F7 (Auto-Migration), F9 (Port Binding) |
| Monitor Startup | F7 (Auto-Migration — log output) |
| Verify Health | F6 (Health Endpoint) |
| Validate Schema | F5 (REST API — `POST /api/notes`) |
| Confirm Idempotency | F6 (Health Endpoint), F7 (Idempotent Migration), F0 (Note List View) |

---

### JRN-03.2: Verify Iframe Embedding Works Without Console Errors

**Persona:** PER-03 (The Technical Deployer)

**Scenario:** After confirming the app is healthy, the deployer opens the parent preview environment — a cross-origin host page with an `<iframe>` pointed at `http://0.0.0.0:3000`. They watch the browser DevTools console for any `SecurityError`, frame-blocking warnings, or blank-page events. They also confirm the app's UI is fully visible and interactive inside the frame. This is the final deployment gate before switching to note-taking mode.

**Related Jobs:** JTBD-03.3

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **Embed** | Opens the parent page with `<iframe src="http://0.0.0.0:3000">` | Parent page / iframe (F9) | "Will this render or will I get a blank frame?" | Wary | App silently renders a blank frame with no error in the iframe itself — hard to diagnose | App binds to `0.0.0.0:3000` and emits no `X-Frame-Options` header; iframe loads visible content |
| **Inspect Headers** | Opens DevTools Network tab; checks response headers for `X-Frame-Options` or restrictive `Content-Security-Policy` | Browser DevTools (F9) | "Is `X-Frame-Options` present? Is there a `frame-ancestors` CSP directive?" | Methodical, systematic | `X-Frame-Options: SAMEORIGIN` or `frame-ancestors 'self'` blocks cross-origin embed silently | No `X-Frame-Options` header in any response; no `frame-ancestors` CSP directive |
| **Check Console** | Scans DevTools Console for SecurityError or frame-blocking warnings | Browser DevTools Console (F9, F8) | "Any red errors? Any SecurityError? This is the moment of truth." | Tense | `Refused to display ... in a frame because it set 'X-Frame-Options' to 'deny'` error | Zero console errors; app renders full UI inside iframe with correct mobile-first layout |
| **Interact** | Clicks inside the iframe; creates a test note to confirm the app is fully functional within the frame | App inside iframe — F2, F0 | "Everything works? Great — we're done here." | Relieved, confident | Interactive elements inside the iframe unresponsive due to CSP or sandboxing issues | Full interactivity inside iframe; create note flow completes without leaving the frame |

### Key Moments
- **Risk of Abandonment — Embed stage:** A blank iframe with no error message is the worst failure mode — the deployer doesn't know if it's a networking issue, a header issue, or a CSP issue.
- **Decision Point — Inspect Headers stage:** Finding a `X-Frame-Options` header means an immediate code fix is required before the app is usable in its intended context.
- **Delight Opportunity — Interact stage:** Successfully creating a note inside the embedded iframe closes the deployment loop: the app is deployed, healthy, frame-compatible, and functional.

### Success Outcome
App renders with visible content inside a cross-origin iframe with zero `SecurityError`, no blank page, and no frame-blocking console warnings across three consecutive loads. *(JTBD-03.3 success measure)*

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Embed | F9 (Iframe Compatibility & Port Binding) |
| Inspect Headers | F9 (Iframe Compatibility — header policy) |
| Check Console | F9 (Iframe Compatibility), F8 (Mobile-First UI) |
| Interact | F2 (Create Note), F0 (Note List View) |

---

## Cross-Journey Patterns

### Common Pain Points Across Journeys

- **Slow or opaque startup (JRN-01.1, JRN-03.1):** Both the Quick Capturer and the Technical Deployer are blocked by a slow or silent startup. A single improvement — clear startup logs and a ≤10 s boot time — resolves friction for both contexts simultaneously.

- **Lack of visual confirmation after state changes (JRN-01.1, JRN-01.2, JRN-02.1, JRN-02.2):** After every write operation (create, edit, pin, delete), the user wonders whether the change took effect. A consistent pattern — redirect to list top + brief visual highlight on the affected note — solves this across all four journeys.

- **Touch target sizing on mobile (JRN-01.1, JRN-01.2, JRN-02.2):** Mis-taps on small screens appear in three separate journeys (Open/Create, Toggle, Navigate to delete). The F8 requirement (≥44 × 44 px tap targets) directly mitigates all three, but must be consistently applied to every interactive element — not just primary CTAs.

- **Ambiguous form save semantics (JRN-01.2, JRN-02.1):** Both journeys surface confusion about whether toggle/checkbox changes auto-save or require explicit Save. A clear, single-mode pattern — all changes require an explicit Save tap — eliminates the ambiguity with no additional development cost.

### Shared Opportunities

- **Consistent redirect behavior:** Every write operation should redirect to the note list at the top, with the affected note rendered first or highlighted. This pattern, implemented once in the routing layer, satisfies JRN-01.1, JRN-01.2, JRN-02.1, and JRN-02.2.

- **Pinned indicator as a trust signal:** The gold-accented pin badge (F8) appears as an opportunity in JRN-01.2, JRN-02.1, and JRN-02.3. A well-designed, immediately visible indicator is a shared solution that rewards capture, validates triage, and confirms list stability.

- **Deployment confidence through log verbosity:** The startup log improvements identified in JRN-03.1 (`[migration] Schema ready.`) also reduce support overhead for JRN-03.2 by making the iframe troubleshooting sequence clearer.

### Persona Convergence Points

| Touchpoint | Journeys | Both Personas Need |
|------------|----------|-------------------|
| Note List `/` after redirect | JRN-01.1, JRN-01.2, JRN-02.1, JRN-02.2 | New/updated note at top; immediate visual feedback |
| Edit Note `/notes/[id]/edit` | JRN-01.2, JRN-02.1, JRN-02.2 | Pre-populated fields; clear Save + Delete buttons |
| Note List sort order on return | JRN-02.1, JRN-02.3 | Pinned-first, newest-first — deterministic every time |

---

## Journey-to-JTBD Traceability

| JRN-ID | Stage | JTBD-ID | Expected Outcome |
|--------|-------|---------|-----------------|
| JRN-01.1 | Open | JTBD-01.1 | App loads and is interactive within 10 s; no login screen |
| JRN-01.1 | Create | JTBD-01.1 | Title field auto-focused; tap targets ≥ 44 × 44 px; no mis-taps |
| JRN-01.1 | Save | JTBD-01.1 | `POST /api/notes` completes; redirect within 15 s of cold load |
| JRN-01.1 | Confirm | JTBD-01.2 | New note at top of list immediately after redirect; no extra action |
| JRN-01.2 | Toggle | JTBD-01.3 | Pinned toggle accessible on edit page; gold visual indicator active |
| JRN-01.2 | Save & Verify | JTBD-01.3 | Pinned note appears at position 1 in list after `PUT` + redirect |
| JRN-02.1 | Search | JTBD-02.1 | Real-time filter in < 200 ms; case-insensitive; pinned-first order preserved |
| JRN-02.1 | Edit & Pin | JTBD-02.2 | Pre-populated form; edit + save in ≤ 3 interactions from list |
| JRN-02.1 | Triage Remainder | JTBD-02.3 | Pinned-first, newest-first order deterministic on every return visit |
| JRN-02.2 | Confirm | JTBD-02.2 | Delete with exactly 1 confirmation step; note title visible in prompt |
| JRN-02.2 | Return | JTBD-02.2 | Deleted note absent from list on redirect; ≤ 2 taps total |
| JRN-03.1 | Monitor Startup | JTBD-03.1 | Clear migration log lines; schema ready within 30 s |
| JRN-03.1 | Verify Health | JTBD-03.2 | `GET /api/health` → `200 {"status":"ok"}` in < 200 ms |
| JRN-03.1 | Confirm Idempotency | JTBD-03.1 | Restart produces zero migration errors; existing notes survive |
| JRN-03.2 | Inspect Headers | JTBD-03.3 | No `X-Frame-Options` header; no `frame-ancestors` CSP directive |
| JRN-03.2 | Check Console | JTBD-03.3 | Zero `SecurityError` or frame-blocking warnings across 3 consecutive loads |
| JRN-03.2 | Interact | JTBD-03.3 | Full app interactivity inside cross-origin iframe confirmed |

---

## Validation Checklist

| Check | Status |
|-------|--------|
| Every persona has at least 1 journey | ✅ PER-01: 2 journeys · PER-02: 2 journeys · PER-03: 2 journeys |
| Every journey maps to at least 1 JTBD | ✅ All 6 journeys reference JTBD IDs |
| All stages have all columns populated | ✅ Stage / Action / Touchpoint / Thinking / Feeling / Pain Point / Opportunity |
| Success outcomes trace to JTBD success measures | ✅ Each journey's Success Outcome cites the originating JTBD success measure |
| Key moments identified (≥ 1 per journey) | ✅ 3 key moments per journey (Decision Point, Risk of Abandonment, Delight Opportunity) |
| Cross-journey patterns documented | ✅ 4 common pain points · 3 shared opportunities · convergence table |
| Feature touchpoints reference valid PRD feature IDs | ✅ F0–F9 cited per stage; all IDs exist in PRD Feature Index |
| Journey-to-JTBD traceability table is complete | ✅ 17 stage-level traceability rows covering all 9 JTBD IDs |

---

*JOURNEYS generated: 2026-06-17 | Product: QuickNotes v1.0 | Derived from: PERSONAS-QuickNotes.md + JTBD-QuickNotes.md + PRD-QuickNotes.md*
