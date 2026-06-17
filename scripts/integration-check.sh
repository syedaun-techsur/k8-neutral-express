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
