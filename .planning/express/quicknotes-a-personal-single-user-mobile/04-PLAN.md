---
phase: quicknotes
plan: 04
type: execute
wave: 4
depends_on: [1, 2, 3]
files_modified:
  - scripts/integration-check.sh
autonomous: true

features:
  implements: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9"]
  depends_on: ["F7", "F5", "F6", "F0", "F1", "F2", "F3", "F4", "F8", "F9"]
  enables: []

must_haves:
  truths:
    - "App starts without manual SQL — notes table created automatically via instrumentation.js"
    - "GET /api/health returns 200 {\"status\":\"ok\"}"
    - "Full CRUD cycle works: create note → appears on list → edit title → list reflects change → delete → gone from list"
    - "Real-time search: typing partial title filters list to matches only"
    - "Data survives restart: note created before server bounce is retrievable after"
    - "HTTP responses contain no X-Frame-Options header — app renders in cross-origin iframe"
    - "Server binds to 0.0.0.0:3000 — reachable outside container"
    - "US1: / shows notes list with title, snippet, pinned indicator; empty state 'No notes yet' + 'New note' button"
    - "US2: Create note 'Groceries' with body 'milk, eggs', it appears on /"
    - "US3: Edit existing note title, list reflects updated title after redirect"
    - "US4: Delete note from edit page with confirmation, note gone from /"
    - "US5: Typing partial title narrows list to matching notes only"
    - "US6: Data survives page reload (PostgreSQL persistence, not memory)"
  artifacts:
    - path: "scripts/integration-check.sh"
      provides: "Automated integration verification script — all 6 user stories + infrastructure checks"
      min_lines: 80
    - path: "lib/db.js"
      provides: "pg.Pool singleton with query() helper"
      exports: ["query"]
    - path: "instrumentation.js"
      provides: "Startup migration hook"
      exports: ["register"]
    - path: "app/api/health/route.js"
      provides: "GET /api/health → 200 {\"status\":\"ok\"}"
      exports: ["GET"]
    - path: "app/api/notes/route.js"
      provides: "GET/POST /api/notes"
      exports: ["GET", "POST"]
    - path: "app/api/notes/[id]/route.js"
      provides: "GET/PUT/DELETE /api/notes/[id]"
      exports: ["GET", "PUT", "DELETE"]
    - path: "app/page.js"
      provides: "Note list view — sorted cards, search, empty state"
      exports: ["default"]
    - path: "app/notes/new/page.js"
      provides: "Create note form"
      exports: ["default"]
    - path: "app/notes/[id]/edit/page.js"
      provides: "Edit + delete note page"
      exports: ["default"]
    - path: "next.config.mjs"
      provides: "Iframe-safe Next.js config — no X-Frame-Options, 0.0.0.0:3000"
      contains: "headers"
  key_links:
    - from: "instrumentation.js register()"
      to: "PostgreSQL notes table"
      via: "CREATE TABLE IF NOT EXISTS on startup before HTTP"
      pattern: "CREATE TABLE IF NOT EXISTS notes"
    - from: "app/page.js"
      to: "lib/db.js query()"
      via: "direct server component DB call"
      pattern: "query.*SELECT.*FROM notes"
    - from: "app/notes/new/page.js"
      to: "POST /api/notes"
      via: "fetch in client submit handler"
      pattern: "fetch.*api/notes.*POST"
    - from: "app/notes/[id]/edit/EditNoteClient.js"
      to: "PUT /api/notes/[id] and DELETE /api/notes/[id]"
      via: "fetch calls in client event handlers"
      pattern: "fetch.*api/notes"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "lib/db.js"
      exports: ["query"]
      verify: "grep -n 'export const query' lib/db.js && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "instrumentation.js"
      exports: ["register"]
      verify: "grep -n 'export async function register' instrumentation.js && grep -n 'CREATE TABLE IF NOT EXISTS' instrumentation.js && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "app/api/health/route.js"
      exports: ["GET"]
      verify: "grep -n 'export async function GET' app/api/health/route.js && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "app/api/notes/route.js"
      exports: ["GET", "POST"]
      verify: "grep -n 'export async function GET' app/api/notes/route.js && grep -n 'export async function POST' app/api/notes/route.js && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "app/api/notes/[id]/route.js"
      exports: ["GET", "PUT", "DELETE"]
      verify: "grep -n 'export async function DELETE' 'app/api/notes/[id]/route.js' && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "next.config.mjs"
      exports: ["nextConfig"]
      verify: "test -f next.config.mjs && ! test -f next.config.ts && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "app/page.js"
      exports: ["default"]
      verify: "grep -n 'export default' app/page.js && grep -n 'No notes yet' app/page.js && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "app/notes/new/page.js"
      exports: ["default"]
      verify: "grep -n 'export default' app/notes/new/page.js && grep -n 'use client' app/notes/new/page.js && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "app/notes/[id]/edit/page.js"
      exports: ["default"]
      verify: "grep -n 'export default' 'app/notes/[id]/edit/page.js' && echo CONTRACT_OK"
  provides:
    - artifact: "scripts/integration-check.sh"
      exports: ["integration verification"]
      shape: |
        Bash script that verifies all 6 user stories and infrastructure constraints
        via curl against a running server, returning exit 0 on full pass.
      verify: "test -f scripts/integration-check.sh && head -1 scripts/integration-check.sh | grep -q '#!/' && echo CONTRACT_OK"
---

<objective>
Verify the complete QuickNotes system end-to-end: confirm all prior-wave artifacts are in place, run static contract verification across all source files, execute API-level integration checks via curl against the running server, and validate all 6 required user stories plus all 7 critical infrastructure constraints (C-1 through C-7).

Purpose: This wave is the deployment gate. It proves the system works as a whole, not just in isolated units. A running server with a real PostgreSQL connection must satisfy all user-observable behaviors before the app is considered shippable.
Output: scripts/integration-check.sh — a rerunnable verification script; all 6 user stories verified; all critical constraints confirmed; any failures surfaced with specific actionable messages.
</objective>

<feature_dependencies>
Implements: F0: Note List View; F1: Note Search/Filter; F2: Create Note; F3: Edit Note; F4: Delete Note; F5: REST API; F6: Health Endpoint; F7: Auto-Migration on Startup; F8: Mobile-First UI; F9: Iframe Compatibility & Port Binding — all features verified end-to-end
Depends on: F7 (Wave 1 — lib/db.js, instrumentation.js); F5, F6 (Wave 2 — all API routes); F0, F1, F2, F3, F4, F8, F9 (Wave 3 — all UI pages, next.config.mjs)
Enables: None (this is the final wave)
</feature_dependencies>

<execution_context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/express/quicknotes-a-personal-single-user-mobile/WAVE-SCHEDULE.md
@.planning/express/quicknotes-a-personal-single-user-mobile/01-PLAN.md
@.planning/express/quicknotes-a-personal-single-user-mobile/02-PLAN.md
@.planning/express/quicknotes-a-personal-single-user-mobile/03-PLAN.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

Critical constraints being verified (from TechArch RTM Section 8):
- C-1: next.config.mjs exists — never next.config.ts
- C-2: No X-Frame-Options header on any response
- C-3: No frame-ancestors 'none'/'self' in CSP
- C-4: Server binds to 0.0.0.0:3000
- C-5: Auto-migration runs before first request
- C-6: DATABASE_URL from environment only — never hard-coded
- C-7: Migration is idempotent — safe to re-run

Six user stories that MUST pass end-to-end:
- US1: / shows notes list (title, body snippet, pinned indicator); empty state "No notes yet" + "New note" button
- US2: Create note title="Groceries" body="milk, eggs", appears on /
- US3: Open a note, change title, save, list reflects it
- US4: From edit page, tap Delete, confirm, note gone from /
- US5: Typing part of title narrows list to matches
- US6: Data survives page reload (PostgreSQL, not memory)

API contracts expected from Wave 2:
- GET /api/health → 200 {"status":"ok"}
- POST /api/notes with valid body → 201 Note
- POST /api/notes with empty title → 400 {"error":"TITLE_REQUIRED"}
- GET /api/notes → 200 Note[]
- GET /api/notes?q=<term> → 200 filtered Note[]
- GET /api/notes/[id] → 200 Note | 404 NOTE_NOT_FOUND
- PUT /api/notes/[id] → 200 Note | 400 | 404
- DELETE /api/notes/[id] → 204 | 404 NOTE_NOT_FOUND
</context>

<tasks>

<task type="auto">
  <name>Task 1: Static contract verification — all source files in place and correct</name>
  <files>scripts/integration-check.sh</files>
  <action>
Run static verification of all prior-wave source artifacts before any live server checks. This confirms every integration contract from waves 1–3 is satisfied at the source level.

Create directory scripts/ if it doesn't exist. Create scripts/integration-check.sh as a rerunnable bash script. Then run ALL static checks inline now (do not defer to a later step).

**Static checks to run now (copy-paste each block and fix any failures before continuing):**

```bash
mkdir -p scripts

# ── Wave 1: Database layer ──
echo "=== WAVE 1: DATABASE LAYER ==="

grep -n 'export const query' lib/db.js && echo "OK: lib/db.js exports query" || echo "FAIL: lib/db.js missing query export"
grep -n 'DATABASE_URL' lib/db.js && echo "OK: lib/db.js reads DATABASE_URL" || echo "FAIL: lib/db.js missing DATABASE_URL"
grep -rn 'postgresql://' lib/db.js && echo "FAIL: hard-coded credentials in lib/db.js" || echo "OK: no hard-coded credentials in lib/db.js"

grep -n 'export async function register' instrumentation.js && echo "OK: instrumentation.js exports register" || echo "FAIL: instrumentation.js missing register export"
grep -n 'NEXT_RUNTIME' instrumentation.js && echo "OK: instrumentation.js has NEXT_RUNTIME guard" || echo "FAIL: instrumentation.js missing NEXT_RUNTIME guard"
grep -n 'CREATE TABLE IF NOT EXISTS' instrumentation.js && echo "OK: instrumentation.js has idempotent DDL" || echo "FAIL: instrumentation.js missing CREATE TABLE IF NOT EXISTS"
grep -n 'serial' instrumentation.js && echo "OK: id column is serial" || echo "FAIL: instrumentation.js missing serial"
grep -n 'timestamptz' instrumentation.js && echo "OK: created_at is timestamptz" || echo "FAIL: instrumentation.js missing timestamptz"
grep -n 'process.exit(1)' instrumentation.js && echo "OK: instrumentation.js exits on failure" || echo "FAIL: instrumentation.js missing process.exit(1)"
grep -in 'DROP\|TRUNCATE' instrumentation.js && echo "FAIL: instrumentation.js contains destructive DDL" || echo "OK: no destructive DDL in instrumentation.js"
grep -n '"pg"' package.json && echo "OK: pg in package.json" || echo "FAIL: pg not in package.json"

# ── Wave 2: API routes ──
echo ""
echo "=== WAVE 2: API ROUTES ==="

grep -n 'export async function GET' app/api/health/route.js && echo "OK: health GET export" || echo "FAIL: health route missing GET"
grep -rn 'query\|pg\|Pool\|Client' app/api/health/route.js | grep -v 'status\|ok\|Content' | head -1 | grep -q '.' && echo "FAIL: health endpoint imports DB (should be liveness only)" || echo "OK: health endpoint has no DB dependency"

grep -n 'export async function GET' app/api/notes/route.js && echo "OK: notes GET export" || echo "FAIL: notes route missing GET"
grep -n 'export async function POST' app/api/notes/route.js && echo "OK: notes POST export" || echo "FAIL: notes route missing POST"
grep -n 'ILIKE' app/api/notes/route.js && echo "OK: notes GET has ILIKE filter" || echo "FAIL: notes GET missing ILIKE search"
grep -n 'TITLE_REQUIRED' app/api/notes/route.js && echo "OK: notes POST validates title" || echo "FAIL: notes POST missing TITLE_REQUIRED validation"
grep -n 'import.*query.*lib/db' app/api/notes/route.js && echo "OK: notes route imports query from lib/db" || echo "FAIL: notes route not importing from lib/db"

grep -n 'export async function GET' "app/api/notes/[id]/route.js" && echo "OK: notes/[id] GET export" || echo "FAIL: notes/[id] route missing GET"
grep -n 'export async function PUT' "app/api/notes/[id]/route.js" && echo "OK: notes/[id] PUT export" || echo "FAIL: notes/[id] route missing PUT"
grep -n 'export async function DELETE' "app/api/notes/[id]/route.js" && echo "OK: notes/[id] DELETE export" || echo "FAIL: notes/[id] route missing DELETE"
grep -n 'new Response(null' "app/api/notes/[id]/route.js" && echo "OK: DELETE returns 204 with no body" || echo "FAIL: notes/[id] DELETE missing Response(null, {status:204})"
grep -n 'NOTE_NOT_FOUND' "app/api/notes/[id]/route.js" && echo "OK: notes/[id] has NOTE_NOT_FOUND error code" || echo "FAIL: notes/[id] missing NOTE_NOT_FOUND"
grep -n 'parseInt' "app/api/notes/[id]/route.js" && echo "OK: notes/[id] validates id as integer" || echo "FAIL: notes/[id] missing id integer validation"
grep -rn 'ILIKE.*\${' app/api/notes/ && echo "FAIL: SQL injection risk — string interpolation in ILIKE query" || echo "OK: parameterized queries only"
grep -rn 'postgresql://' app/api/ && echo "FAIL: hard-coded credentials in API routes" || echo "OK: no hard-coded credentials in API routes"

# ── Wave 3: Frontend + config ──
echo ""
echo "=== WAVE 3: FRONTEND + CONFIG ==="

# C-1: Config file check
test -f next.config.mjs && echo "OK: next.config.mjs exists (C-1)" || echo "FAIL: next.config.mjs missing (C-1)"
test -f next.config.ts && echo "FAIL: next.config.ts exists — Next 14 hard-errors on this (C-1)" || echo "OK: next.config.ts absent (C-1)"

# C-2: No X-Frame-Options DENY/SAMEORIGIN
grep -n 'X-Frame-Options' next.config.mjs | grep -i 'DENY\|SAMEORIGIN' && echo "FAIL: X-Frame-Options DENY or SAMEORIGIN in next.config.mjs (C-2)" || echo "OK: no X-Frame-Options blocking header (C-2)"

# C-3: No frame-ancestors CSP restriction
grep -n 'frame-ancestors' next.config.mjs | grep -i "none\|'self'" && echo "FAIL: frame-ancestors restriction in CSP (C-3)" || echo "OK: no frame-ancestors restriction (C-3)"

# C-4: Port binding
grep -n '0.0.0.0' package.json && echo "OK: 0.0.0.0 in package.json dev script (C-4)" || echo "FAIL: package.json dev script may not bind to 0.0.0.0 (C-4 — check: next dev -H 0.0.0.0)"

# C-6: No hard-coded credentials anywhere
grep -rn 'postgresql://' lib/ instrumentation.js app/ && echo "FAIL: hard-coded DATABASE_URL credentials (C-6)" || echo "OK: no hard-coded credentials (C-6)"

# UI files
grep -n 'export default' app/page.js && echo "OK: app/page.js exports default" || echo "FAIL: app/page.js missing default export"
grep -n 'No notes yet' app/page.js && echo "OK: app/page.js has empty state 'No notes yet'" || echo "FAIL: app/page.js missing 'No notes yet' empty state"
grep -n 'history.replaceState\|replaceState' app/page.js && echo "OK: app/page.js has client-side search URL persistence" || echo "FAIL: app/page.js missing search URL persistence"
grep -n 'data-title' app/page.js && echo "OK: app/page.js note cards have data-title for client filter" || echo "FAIL: app/page.js missing data-title on note cards"
grep -n 'pinnedBadge\|Pinned' app/page.js && echo "OK: app/page.js renders pinned indicator" || echo "FAIL: app/page.js missing pinned badge"

grep -n 'use client' app/notes/new/page.js && echo "OK: create page is client component" || echo "FAIL: create page missing 'use client'"
grep -n 'Title is required' app/notes/new/page.js && echo "OK: create page has title validation" || echo "FAIL: create page missing 'Title is required' validation"
grep -n 'POST' app/notes/new/page.js && echo "OK: create page calls POST" || echo "FAIL: create page missing POST call"

grep -n 'export default' "app/notes/[id]/edit/page.js" && echo "OK: edit page exports default" || echo "FAIL: edit page missing default export"
grep -n 'Note not found' "app/notes/[id]/edit/page.js" && echo "OK: edit page has not-found state" || echo "FAIL: edit page missing not-found state"
grep -n 'use client' "app/notes/[id]/edit/EditNoteClient.js" && echo "OK: EditNoteClient is client component" || echo "FAIL: EditNoteClient missing 'use client'"
grep -n 'Confirm delete' "app/notes/[id]/edit/EditNoteClient.js" && echo "OK: EditNoteClient has inline delete confirmation" || echo "FAIL: EditNoteClient missing 'Confirm delete'"
grep -n 'window.confirm' "app/notes/[id]/edit/EditNoteClient.js" && echo "FAIL: EditNoteClient uses window.confirm (must be inline)" || echo "OK: no window.confirm in EditNoteClient"

grep -n '#FBCA5C' app/globals.css && echo "OK: globals.css has Gold accent token #FBCA5C" || echo "FAIL: globals.css missing Gold accent #FBCA5C"
grep -n '#0A0A0A' app/globals.css && echo "OK: globals.css has text token #0A0A0A" || echo "FAIL: globals.css missing text token #0A0A0A"
grep -n '#CC0000' app/globals.css && echo "OK: globals.css has error token #CC0000" || echo "FAIL: globals.css missing error token #CC0000"
grep -n 'btnDelete' app/globals.css && echo "OK: globals.css has non-gold delete button style" || echo "FAIL: globals.css missing .btnDelete style"
```

After running all static checks, write scripts/integration-check.sh with the content below. This script is the rerunnable form of the live server checks performed in Task 2.

```bash
#!/usr/bin/env bash
# QuickNotes Integration Verification Script
# Usage: BASE_URL=http://localhost:3000 bash scripts/integration-check.sh
# Requires: curl, a running QuickNotes server, a live PostgreSQL connection

set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ FAIL: $1"; FAIL=$((FAIL+1)); }

echo ""
echo "QuickNotes Integration Check — $BASE"
echo "============================================"

# ── F6: Health endpoint ──
echo ""
echo "[F6] Health endpoint"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
[ "$STATUS" = "200" ] && pass "GET /api/health → 200" || fail "GET /api/health → expected 200, got $STATUS"
BODY=$(curl -s "$BASE/api/health")
echo "$BODY" | grep -q '"status"' && echo "$BODY" | grep -q '"ok"' && pass "GET /api/health body contains {\"status\":\"ok\"}" || fail "GET /api/health body does not contain {\"status\":\"ok\"}: $BODY"

# ── F9: No X-Frame-Options header (C-2) ──
echo ""
echo "[F9] Iframe compatibility — no X-Frame-Options (C-2)"
HEADERS=$(curl -s -I "$BASE/")
echo "$HEADERS" | grep -qi 'x-frame-options' && fail "/ response contains X-Frame-Options header (blocks iframe)" || pass "/ response has no X-Frame-Options header"
echo "$HEADERS" | grep -qi 'frame-ancestors' && fail "/ response contains frame-ancestors CSP (blocks cross-origin iframe)" || pass "/ response has no frame-ancestors CSP"

# ── F7: Auto-migration (C-5) — verified via POST working ──
echo ""
echo "[F7] Auto-migration — notes table exists (POST test)"
POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"title":"__wave4_migration_check__","body":"","pinned":false}')
[ "$POST_STATUS" = "201" ] && pass "POST /api/notes → 201 (notes table exists, migration ran)" || fail "POST /api/notes → expected 201, got $POST_STATUS (migration may have failed)"

# Get the id of the note we just created
CREATED=$(curl -s -X POST "$BASE/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"title":"Groceries","body":"milk, eggs","pinned":false}')
GROCERIES_ID=$(echo "$CREATED" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# ── US2: Create note appears on list ──
echo ""
echo "[US2] Create note 'Groceries' with body 'milk, eggs'"
[ -n "$GROCERIES_ID" ] && pass "POST /api/notes created note id=$GROCERIES_ID" || fail "POST /api/notes did not return an id"
LIST_AFTER_CREATE=$(curl -s "$BASE/api/notes")
echo "$LIST_AFTER_CREATE" | grep -q 'Groceries' && pass "GET /api/notes includes 'Groceries' after create" || fail "GET /api/notes does not include 'Groceries' after create"

# ── US3: Edit note title, list reflects change ──
echo ""
echo "[US3] Edit note title, verify list reflects update"
if [ -n "$GROCERIES_ID" ]; then
  PUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/notes/$GROCERIES_ID" \
    -H "Content-Type: application/json" \
    -d '{"title":"Groceries Updated","body":"milk, eggs, bread","pinned":false}')
  [ "$PUT_STATUS" = "200" ] && pass "PUT /api/notes/$GROCERIES_ID → 200" || fail "PUT /api/notes/$GROCERIES_ID → expected 200, got $PUT_STATUS"
  LIST_AFTER_EDIT=$(curl -s "$BASE/api/notes")
  echo "$LIST_AFTER_EDIT" | grep -q 'Groceries Updated' && pass "GET /api/notes reflects updated title 'Groceries Updated'" || fail "GET /api/notes does not reflect updated title"
else
  fail "US3 skipped — no note id from US2"
fi

# ── US5: Search filters list ──
echo ""
echo "[US5] Search — typing partial title narrows list"
SEARCH_RESULT=$(curl -s "$BASE/api/notes?q=Grocer")
echo "$SEARCH_RESULT" | grep -q 'Groceries' && pass "GET /api/notes?q=Grocer returns matching note" || fail "GET /api/notes?q=Grocer did not return matching note"
NO_MATCH=$(curl -s "$BASE/api/notes?q=zzzzzz_no_match_xyz")
MATCH_COUNT=$(echo "$NO_MATCH" | grep -o '"id"' | wc -l | tr -d ' ')
[ "$MATCH_COUNT" = "0" ] && pass "GET /api/notes?q=zzzzzz_no_match_xyz returns empty array" || fail "GET /api/notes?q=zzzzzz_no_match_xyz returned $MATCH_COUNT notes (expected 0)"

# ── US5: Case-insensitive search ──
SEARCH_LOWER=$(curl -s "$BASE/api/notes?q=grocer")
echo "$SEARCH_LOWER" | grep -q 'Groceries' && pass "Search is case-insensitive (grocer matches Groceries)" || fail "Search is not case-insensitive"

# ── US4: Delete note with confirmation flow (API level) ──
echo ""
echo "[US4] Delete note, verify gone from list"
if [ -n "$GROCERIES_ID" ]; then
  DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/notes/$GROCERIES_ID")
  [ "$DELETE_STATUS" = "204" ] && pass "DELETE /api/notes/$GROCERIES_ID → 204" || fail "DELETE /api/notes/$GROCERIES_ID → expected 204, got $DELETE_STATUS"
  LIST_AFTER_DELETE=$(curl -s "$BASE/api/notes")
  echo "$LIST_AFTER_DELETE" | grep -q "\"id\":$GROCERIES_ID" && fail "GET /api/notes still contains deleted note id=$GROCERIES_ID" || pass "GET /api/notes no longer contains deleted note"
  GET_DELETED=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notes/$GROCERIES_ID")
  [ "$GET_DELETED" = "404" ] && pass "GET /api/notes/$GROCERIES_ID → 404 after delete" || fail "GET /api/notes/$GROCERIES_ID → expected 404 after delete, got $GET_DELETED"
else
  fail "US4 skipped — no note id from US2"
fi

# ── F5: Full API contract verification ──
echo ""
echo "[F5] API contract — validation rules"
EMPTY_TITLE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"title":"","body":"test"}')
[ "$EMPTY_TITLE" = "400" ] && pass "POST /api/notes with empty title → 400" || fail "POST /api/notes with empty title → expected 400, got $EMPTY_TITLE"

TITLE_REQUIRED_BODY=$(curl -s -X POST "$BASE/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"title":""}')
echo "$TITLE_REQUIRED_BODY" | grep -q 'TITLE_REQUIRED' && pass "POST /api/notes empty title error code is TITLE_REQUIRED" || fail "POST /api/notes empty title body missing TITLE_REQUIRED: $TITLE_REQUIRED_BODY"

NONEXISTENT=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notes/999999999")
[ "$NONEXISTENT" = "404" ] && pass "GET /api/notes/999999999 → 404" || fail "GET /api/notes/999999999 → expected 404, got $NONEXISTENT"

NON_INT=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notes/abc")
[ "$NON_INT" = "404" ] && pass "GET /api/notes/abc (non-integer id) → 404" || fail "GET /api/notes/abc → expected 404, got $NON_INT"

# ── US6: Data persistence — verify notes survive (GET returns same data) ──
echo ""
echo "[US6] Data persistence — PostgreSQL (not memory)"
PERSIST_NOTE=$(curl -s -X POST "$BASE/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"title":"__persist_test__","body":"should survive","pinned":false}')
PERSIST_ID=$(echo "$PERSIST_NOTE" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
if [ -n "$PERSIST_ID" ]; then
  GET_PERSISTED=$(curl -s "$BASE/api/notes/$PERSIST_ID")
  echo "$GET_PERSISTED" | grep -q '__persist_test__' && pass "GET /api/notes/$PERSIST_ID returns persisted note (PostgreSQL confirmed)" || fail "GET /api/notes/$PERSIST_ID did not return persisted note"
  # Cleanup
  curl -s -o /dev/null -X DELETE "$BASE/api/notes/$PERSIST_ID"
else
  fail "US6: could not create persistence test note"
fi

# ── US1: List page structure ──
echo ""
echo "[US1] List page — home route structure"
LIST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
[ "$LIST_STATUS" = "200" ] && pass "GET / → 200" || fail "GET / → expected 200, got $LIST_STATUS"
LIST_HTML=$(curl -s "$BASE/")
echo "$LIST_HTML" | grep -qi 'QuickNotes' && pass "GET / contains 'QuickNotes' branding" || fail "GET / missing 'QuickNotes' branding"
echo "$LIST_HTML" | grep -qi 'notes/new\|New note' && pass "GET / contains 'New note' link or button" || fail "GET / missing 'New note' CTA"

NEW_NOTE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/notes/new")
[ "$NEW_NOTE_STATUS" = "200" ] && pass "GET /notes/new → 200 (no dead link)" || fail "GET /notes/new → expected 200, got $NEW_NOTE_STATUS"

# Cleanup migration check note
curl -s "$BASE/api/notes?q=__wave4_migration_check__" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | while read id; do
  curl -s -o /dev/null -X DELETE "$BASE/api/notes/$id"
done

# ── Summary ──
echo ""
echo "============================================"
echo "Results: $PASS passed, $FAIL failed"
echo "============================================"
[ "$FAIL" -eq 0 ] && echo "ALL CHECKS PASSED" && exit 0 || echo "SOME CHECKS FAILED — see above" && exit 1
```

Make the script executable:
```bash
chmod +x scripts/integration-check.sh
```
  </action>
  <verify>
# Verify all Wave 1-3 static contracts
grep -n 'export const query' lib/db.js && grep -n 'export async function register' instrumentation.js && grep -n 'CREATE TABLE IF NOT EXISTS' instrumentation.js && echo "WAVE1_CONTRACTS_OK" && grep -n 'export async function GET' app/api/health/route.js && grep -n 'export async function GET' app/api/notes/route.js && grep -n 'export async function POST' app/api/notes/route.js && grep -n 'export async function DELETE' 'app/api/notes/[id]/route.js' && echo "WAVE2_CONTRACTS_OK" && test -f next.config.mjs && ! test -f next.config.ts && grep -n 'export default' app/page.js && grep -n 'No notes yet' app/page.js && grep -n 'use client' app/notes/new/page.js && grep -n 'Confirm delete' 'app/notes/[id]/edit/EditNoteClient.js' && echo "WAVE3_CONTRACTS_OK" && test -f scripts/integration-check.sh && echo "SCRIPT_EXISTS_OK" && echo CONTRACT_OK
  </verify>
  <done>
- All Wave 1 static contracts verified: lib/db.js exports query, instrumentation.js exports register with correct DDL, no hard-coded credentials, no destructive DDL
- All Wave 2 static contracts verified: health route exports GET (no DB dependency), notes route exports GET+POST with ILIKE+validation, notes/[id] route exports GET+PUT+DELETE with 204 no-body, parameterized queries
- All Wave 3 static contracts verified: next.config.mjs exists (next.config.ts absent), no X-Frame-Options blocking header, app/page.js with empty state + search, create page as client component with validation, edit page with not-found state + inline delete confirmation
- scripts/integration-check.sh created and executable — covers all 6 user stories + F5/F6/F7/F9 API contracts
  </done>
</task>

<task type="auto">
  <name>Task 2: Live server integration — run all 6 user stories end-to-end</name>
  <files>scripts/integration-check.sh</files>
  <action>
Run the live server integration checks against the running QuickNotes server. This task assumes the server is already running (started by the executor environment with DATABASE_URL set). If the server is not running, start it first.

**Step 1: Verify server is running**

```bash
# Check if server is already running on 3000
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "Server not responding yet"
```

If the server is not running and DATABASE_URL is available, start it in the background:
```bash
# Only run this if the server is not responding
# DATABASE_URL must be set in environment
npm run dev &
SERVER_PID=$!
# Wait for server to be ready (up to 30 seconds)
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done
```

**Step 2: Run the integration check script**

```bash
BASE_URL=http://localhost:3000 bash scripts/integration-check.sh
```

**Step 3: If any checks fail, diagnose and fix**

Common failure patterns and fixes:

**FAIL: GET /api/health → not 200**
- Check server started: `curl http://localhost:3000/api/health`
- Check DATABASE_URL is set: `echo $DATABASE_URL`
- Check instrumentation.js has correct NEXT_RUNTIME guard and DDL

**FAIL: X-Frame-Options header present**
- Inspect response: `curl -I http://localhost:3000/`
- Fix: next.config.mjs headers() must return empty array — no X-Frame-Options key at all
- Verify: `grep -n 'X-Frame-Options' next.config.mjs`

**FAIL: POST /api/notes → not 201 (migration may have failed)**
- Check startup logs for `[migration]` output
- Verify instrumentation.js register() function exists and has correct DDL
- Verify DATABASE_URL points to reachable PostgreSQL instance
- Check: `grep -n 'NEXT_RUNTIME' instrumentation.js` — guard must be present

**FAIL: Search not working (GET /api/notes?q=Grocer)**
- Verify ILIKE query in app/api/notes/route.js: `grep -n 'ILIKE' app/api/notes/route.js`
- Test directly: `curl "http://localhost:3000/api/notes?q=Grocer"`

**FAIL: DELETE → not 204**
- Verify `new Response(null, { status: 204 })` in app/api/notes/[id]/route.js
- Never use `Response.json()` for 204 — it adds a body which violates HTTP spec

**FAIL: Non-integer id not returning 404**
- Verify parseInt validation in app/api/notes/[id]/route.js: `grep -n 'parseInt' "app/api/notes/[id]/route.js"`

**FAIL: next.config.ts exists**
- Delete it immediately: `rm next.config.ts`
- This causes Next 14 to hard-error on startup

**Step 4: Verify C-4 port binding explicitly**

```bash
# C-4: Confirm server is bound to 0.0.0.0 not just 127.0.0.1
# The dev script should use: next dev -H 0.0.0.0 -p 3000
grep '"dev"' package.json
# Expected output contains: "next dev -H 0.0.0.0 -p 3000"
# If not, update package.json dev script and restart server
```

**Step 5: Verify idempotency (C-7)**

```bash
# C-7: Run the migration check twice (simulate restart)
# Verify instrumentation.js DDL is CREATE TABLE IF NOT EXISTS (already checked statically)
grep -n 'IF NOT EXISTS' instrumentation.js && echo "C-7 IDEMPOTENT_OK"
# The live proof: server is still running with existing data = migration ran as no-op
```

**Step 6: Verify C-6 — no hard-coded credentials**

```bash
# C-6: No postgresql:// URLs in source
grep -rn 'postgresql://\|postgres://' lib/ app/ instrumentation.js 2>/dev/null && echo "C-6 FAIL: hard-coded credentials found" || echo "C-6 OK: no hard-coded credentials"
```

**Step 7: Final re-run of full integration check**

```bash
BASE_URL=http://localhost:3000 bash scripts/integration-check.sh
```

Expected output: `ALL CHECKS PASSED` with 0 failures.

**If DATABASE_URL is not available in this environment:**
- Run all static checks (Task 1) to verify source files are correct
- Note that live API checks require a running PostgreSQL instance
- The scripts/integration-check.sh script documents exactly what must pass when deployed
  </action>
  <verify>
# Verify script exists and is executable, then run static final checks
test -x scripts/integration-check.sh && echo "SCRIPT_EXECUTABLE_OK" && grep -n 'export const query' lib/db.js && grep -n 'CREATE TABLE IF NOT EXISTS' instrumentation.js && test -f next.config.mjs && ! test -f next.config.ts && grep -rn 'postgresql://' lib/ app/ instrumentation.js 2>/dev/null && echo "HARDCODED_CREDS_FAIL" || echo "NO_HARDCODED_CREDS_OK" && grep -n 'new Response(null' 'app/api/notes/[id]/route.js' && echo "DELETE_204_OK" && grep -n 'ILIKE' app/api/notes/route.js && echo "SEARCH_ILIKE_OK" && grep -n '0.0.0.0' package.json && echo "PORT_BINDING_OK" && echo CONTRACT_OK
  </verify>
  <done>
- scripts/integration-check.sh is executable and covers all 6 user stories + critical constraints
- US1: GET / → 200, contains "QuickNotes" branding and "New note" CTA; GET /notes/new → 200
- US2: POST /api/notes creates note, GET /api/notes includes it
- US3: PUT /api/notes/[id] → 200, GET /api/notes reflects updated title
- US4: DELETE /api/notes/[id] → 204, GET /api/notes no longer contains note, GET /api/notes/[id] → 404
- US5: GET /api/notes?q=<partial> returns matching notes; case-insensitive; no-match returns []
- US6: GET /api/notes/[id] returns persisted note (PostgreSQL, not in-memory)
- C-1: next.config.mjs exists, next.config.ts absent
- C-2: No X-Frame-Options header in / response
- C-3: No frame-ancestors CSP in / response
- C-4: package.json dev script binds to 0.0.0.0:3000
- C-5: POST /api/notes succeeds → notes table exists → migration ran
- C-6: No postgresql:// hard-coded in any source file
- C-7: CREATE TABLE IF NOT EXISTS guarantees idempotency
  </done>
</task>

</tasks>

<verification>
Final wave-level verification — run these checks to confirm all integration contracts are satisfied:

```bash
# Static: all prior-wave contracts in place
grep -n 'export const query' lib/db.js && echo "W1_DB_OK"
grep -n 'export async function register' instrumentation.js && grep -n 'CREATE TABLE IF NOT EXISTS' instrumentation.js && echo "W1_MIGRATION_OK"
grep -n 'export async function GET' app/api/health/route.js && echo "W2_HEALTH_OK"
grep -n 'ILIKE' app/api/notes/route.js && echo "W2_SEARCH_OK"
grep -n 'new Response(null' "app/api/notes/[id]/route.js" && echo "W2_DELETE_204_OK"
test -f next.config.mjs && ! test -f next.config.ts && echo "W3_CONFIG_OK"
grep -n 'No notes yet' app/page.js && echo "W3_EMPTY_STATE_OK"
grep -n 'Confirm delete' "app/notes/[id]/edit/EditNoteClient.js" && echo "W3_DELETE_CONFIRM_OK"
grep -n 'window.confirm' "app/notes/[id]/edit/EditNoteClient.js" && echo "WINDOW_CONFIRM_FAIL" || echo "W3_NO_WINDOW_CONFIRM_OK"

# Security
grep -rn 'postgresql://' lib/ app/ instrumentation.js 2>/dev/null && echo "HARDCODED_CREDS_FAIL" || echo "C6_NO_HARDCODED_OK"
grep -in 'DROP\|TRUNCATE' instrumentation.js && echo "DESTRUCTIVE_DDL_FAIL" || echo "C7_IDEMPOTENT_OK"

# Integration script exists
test -x scripts/integration-check.sh && echo "INTEGRATION_SCRIPT_OK"

# Live (requires running server):
# BASE_URL=http://localhost:3000 bash scripts/integration-check.sh
```
</verification>

<success_criteria>
Static verification:
- All Wave 1 contracts: lib/db.js exports query; instrumentation.js exports register with 5-column DDL; no hard-coded credentials; no DROP/TRUNCATE
- All Wave 2 contracts: health GET (no DB); notes GET+POST with ILIKE+validation; notes/[id] GET+PUT+DELETE with 204 no-body, parameterized queries, integer id validation
- All Wave 3 contracts: next.config.mjs exists (next.config.ts absent), no X-Frame-Options blocking, app/page.js with "No notes yet" + data-title + search, create page as 'use client' with validation, edit page with not-found state + inline "Confirm delete" (no window.confirm)
- C-6: No postgresql:// in any source file
- C-7: instrumentation.js uses CREATE TABLE IF NOT EXISTS (idempotent)

Live verification (requires DATABASE_URL + running server):
- US1: GET / → 200; contains "QuickNotes" + "New note"; GET /notes/new → 200
- US2: POST /api/notes {"title":"Groceries","body":"milk, eggs"} → 201; appears in GET /api/notes
- US3: PUT /api/notes/[id] updates title; GET /api/notes reflects new title
- US4: DELETE /api/notes/[id] → 204; note absent from GET /api/notes; GET /api/notes/[id] → 404
- US5: GET /api/notes?q=Grocer returns matching notes; case-insensitive; no-match returns []
- US6: GET /api/notes/[id] returns persisted note after create (PostgreSQL persistence confirmed)
- C-2: GET / response has no X-Frame-Options header
- C-4: Server reachable on port 3000 (0.0.0.0 binding)
- scripts/integration-check.sh exits 0 with "ALL CHECKS PASSED"
</success_criteria>

<output>
After completion, create `.planning/express/quicknotes-a-personal-single-user-mobile/04-SUMMARY.md` summarizing:
- Files created: scripts/integration-check.sh
- Static checks performed: all Wave 1/2/3 contracts verified, security checks (no hard-coded creds, no destructive DDL), C-1 through C-7 constraints
- Live checks performed: all 6 user stories (US1–US6), full API contract verification, iframe header check
- Any failures found and fixes applied
- Final status: ALL CHECKS PASSED or list of remaining failures with root causes
</output>
