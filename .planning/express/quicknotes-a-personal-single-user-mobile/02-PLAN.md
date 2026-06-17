---
phase: quicknotes
plan: 02
type: execute
wave: 2
depends_on: [1]
files_modified:
  - app/api/health/route.js
  - app/api/notes/route.js
  - app/api/notes/[id]/route.js
autonomous: true

features:
  implements: ["F5", "F6"]
  depends_on: ["F7"]
  enables: ["F0", "F1", "F2", "F3", "F4"]

must_haves:
  truths:
    - "GET /api/health returns 200 {\"status\":\"ok\"} with no database query"
    - "GET /api/notes returns 200 Note[] sorted pinned DESC, created_at DESC"
    - "GET /api/notes?q=<term> returns 200 Note[] filtered by ILIKE on title"
    - "POST /api/notes with valid title returns 201 with created Note object"
    - "POST /api/notes with empty/missing title returns 400 {\"error\":\"TITLE_REQUIRED\",\"message\":\"Title is required\"}"
    - "GET /api/notes/[id] returns 200 Note for valid id, 404 NOTE_NOT_FOUND for missing or non-integer id"
    - "PUT /api/notes/[id] returns 200 updated Note on success, 400 on empty title, 404 on missing note"
    - "DELETE /api/notes/[id] returns 204 no body on success, 404 NOTE_NOT_FOUND if not found"
    - "All endpoints use parameterized queries — no user input interpolated into SQL"
    - "All route handlers import query from lib/db.js — no hard-coded DB credentials"
  artifacts:
    - path: "app/api/health/route.js"
      provides: "GET /api/health → 200 {\"status\":\"ok\"}"
      exports: ["GET"]
    - path: "app/api/notes/route.js"
      provides: "GET /api/notes (with optional ?q=), POST /api/notes"
      exports: ["GET", "POST"]
    - path: "app/api/notes/[id]/route.js"
      provides: "GET, PUT, DELETE /api/notes/[id]"
      exports: ["GET", "PUT", "DELETE"]
  key_links:
    - from: "app/api/notes/route.js"
      to: "lib/db.js"
      via: "import { query } from '../../../lib/db.js'"
      pattern: "import.*query.*lib/db"
    - from: "app/api/notes/[id]/route.js"
      to: "lib/db.js"
      via: "import { query } from '../../../../lib/db.js'"
      pattern: "import.*query.*lib/db"
    - from: "app/api/notes/route.js"
      to: "notes table"
      via: "parameterized SELECT/INSERT queries"
      pattern: "SELECT.*FROM notes|INSERT INTO notes"
    - from: "app/api/notes/[id]/route.js"
      to: "notes table"
      via: "parameterized SELECT/UPDATE/DELETE queries"
      pattern: "SELECT.*FROM notes|UPDATE notes|DELETE FROM notes"

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
  provides:
    - artifact: "app/api/health/route.js"
      exports: ["GET"]
      shape: |
        export async function GET() {
          return Response.json({ status: 'ok' }, { status: 200 });
        }
      verify: "grep -n 'export async function GET' app/api/health/route.js && echo CONTRACT_OK"
    - artifact: "app/api/notes/route.js"
      exports: ["GET", "POST"]
      shape: |
        GET /api/notes → 200 Note[] (sorted pinned DESC, created_at DESC; optional ?q= ILIKE filter)
        POST /api/notes → 201 Note | 400 {error: "TITLE_REQUIRED"} | 400 {error: "BAD_REQUEST"}
        Note: { id: number, title: string, body: string|null, pinned: boolean, created_at: string }
      verify: "grep -n 'export async function GET' app/api/notes/route.js && grep -n 'export async function POST' app/api/notes/route.js && echo CONTRACT_OK"
    - artifact: "app/api/notes/[id]/route.js"
      exports: ["GET", "PUT", "DELETE"]
      shape: |
        GET /api/notes/[id] → 200 Note | 404 {error: "NOTE_NOT_FOUND"}
        PUT /api/notes/[id] → 200 Note | 400 {error: "TITLE_REQUIRED"} | 404 {error: "NOTE_NOT_FOUND"}
        DELETE /api/notes/[id] → 204 (no body) | 404 {error: "NOTE_NOT_FOUND"}
      verify: "grep -n 'export async function GET' app/api/notes/[id]/route.js && grep -n 'export async function PUT' app/api/notes/[id]/route.js && grep -n 'export async function DELETE' app/api/notes/[id]/route.js && echo CONTRACT_OK"
---

<objective>
Implement all six REST API handlers for QuickNotes: the liveness health check (F6) and all five notes CRUD endpoints (F5). Every handler uses the lib/db.js query() pool from Wave 1. Input is validated server-side; all queries are parameterized; HTTP status codes match the FRD spec exactly.

Purpose: Wave 3 (frontend) pages call these endpoints directly from client components and server components. The integration test wave (4) verifies these endpoints end-to-end. No frontend can be built without working API routes.
Output: app/api/health/route.js, app/api/notes/route.js, app/api/notes/[id]/route.js
</objective>

<feature_dependencies>
Implements: F5: REST API — GET/POST /api/notes, GET/PUT/DELETE /api/notes/[id]; F6: Health Endpoint — GET /api/health → 200 {"status":"ok"}
Depends on: F7: Auto-Migration on Startup (lib/db.js pool + notes table must exist — provided by Wave 1)
Enables: F0: Note List View; F1: Note Search/Filter; F2: Create Note; F3: Edit Note; F4: Delete Note
</feature_dependencies>

<execution_context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/express/quicknotes-a-personal-single-user-mobile/WAVE-SCHEDULE.md
@.planning/express/quicknotes-a-personal-single-user-mobile/01-PLAN.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

Key constraints (non-negotiable):
- All route files use .js extension (not .ts) — Next.js 14 App Router
- Import query from lib/db.js — never instantiate pg directly in route handlers
- All DB queries MUST use parameterized form ($1, $2, etc.) — never string interpolation
- No hard-coded DATABASE_URL or credentials in any route file
- HTTP status codes must match spec exactly: 200, 201, 204, 400, 404, 500
- DELETE /api/notes/[id] returns 204 with NO response body (use new Response(null, { status: 204 }))
- POST /api/notes returns 201 (not 200)
- Non-integer id path params return 404 (not 400)
- Error body shape: { "error": "ERROR_CODE", "message": "human text" }
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create health endpoint and notes collection endpoints</name>
  <files>
    app/api/health/route.js
    app/api/notes/route.js
  </files>
  <action>
Create two route handler files. Both are Next.js 14 App Router route handlers that export named async functions.

--- FILE 1: app/api/health/route.js (F6, SPEC-006) ---

From TechArch §4.2 GET /api/health:
- Returns 200 {"status":"ok"} with Content-Type: application/json
- NO database query — liveness check only
- No authentication, no query params, no request body

```js
// app/api/health/route.js
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}
```

That is the complete file. Nothing else. No DB import.

--- FILE 2: app/api/notes/route.js (F5, SPEC-004) ---

Implements GET /api/notes and POST /api/notes.

Import query from lib/db.js. Relative path from app/api/notes/ to lib/db.js is ../../../lib/db.js.

GET /api/notes (from TechArch §4.2 GET /api/notes):
1. Read optional `?q=` query parameter from the URL
2. If q is present and non-empty after trim:
   - SQL: `SELECT * FROM notes WHERE title ILIKE $1 ORDER BY pinned DESC, created_at DESC`
   - Param: `['%' + q + '%']`
3. If q is absent or empty:
   - SQL: `SELECT * FROM notes ORDER BY pinned DESC, created_at DESC`
4. Return 200 with JSON array of rows (may be empty array [])
5. On DB error: return 500 { "error": "INTERNAL_ERROR", "message": "Internal server error" }

POST /api/notes (from TechArch §4.2 POST /api/notes):
1. Parse JSON request body. On JSON parse error: return 400 { "error": "BAD_REQUEST", "message": "Invalid request body" }
2. Extract title, body, pinned from body
3. Trim title. If empty string after trim (or missing): return 400 { "error": "TITLE_REQUIRED", "message": "Title is required" }
4. Coerce pinned to boolean: `Boolean(pinned ?? false)`
5. Coerce body to null if not a string: `typeof body === 'string' ? body : null`
6. SQL: `INSERT INTO notes (title, body, pinned) VALUES ($1, $2, $3) RETURNING *`
   Params: [trimmedTitle, bodyValue, pinnedValue]
7. Return 201 with created note object (result.rows[0])
8. On DB error: return 500 { "error": "INTERNAL_ERROR", "message": "Internal server error" }

```js
// app/api/notes/route.js
import { query } from '../../../lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    let result;
    if (q && q.trim().length > 0) {
      result = await query(
        'SELECT * FROM notes WHERE title ILIKE $1 ORDER BY pinned DESC, created_at DESC',
        ['%' + q.trim() + '%']
      );
    } else {
      result = await query(
        'SELECT * FROM notes ORDER BY pinned DESC, created_at DESC'
      );
    }
    return Response.json(result.rows, { status: 200 });
  } catch (err) {
    console.error('GET /api/notes error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'BAD_REQUEST', message: 'Invalid request body' }, { status: 400 });
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return Response.json({ error: 'TITLE_REQUIRED', message: 'Title is required' }, { status: 400 });
    }
    const noteBody = typeof body.body === 'string' ? body.body : null;
    const pinned = Boolean(body.pinned ?? false);
    const result = await query(
      'INSERT INTO notes (title, body, pinned) VALUES ($1, $2, $3) RETURNING *',
      [title, noteBody, pinned]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/notes error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}
```

Create the directory app/api/notes/ if it doesn't exist before writing the file.
  </action>
  <verify>
grep -n 'export async function GET' app/api/health/route.js && echo "HEALTH_GET_OK" && grep -n 'status.*ok' app/api/health/route.js && echo "HEALTH_BODY_OK" && grep -rn 'query\|pg\|database' app/api/health/route.js | grep -vi 'status' | head -1 | grep -q '.' && echo "HEALTH_HAS_DB_IMPORT_FAIL" || echo "HEALTH_NO_DB_OK" && grep -n 'export async function GET' app/api/notes/route.js && echo "NOTES_GET_OK" && grep -n 'export async function POST' app/api/notes/route.js && echo "NOTES_POST_OK" && grep -n 'ILIKE' app/api/notes/route.js && echo "NOTES_ILIKE_OK" && grep -n 'TITLE_REQUIRED' app/api/notes/route.js && echo "NOTES_VALIDATION_OK" && grep -n 'import.*query.*lib/db' app/api/notes/route.js && echo "NOTES_DB_IMPORT_OK" && grep -n 'RETURNING \*' app/api/notes/route.js && echo "NOTES_RETURNING_OK" && echo CONTRACT_OK
  </verify>
  <done>
- app/api/health/route.js exists, exports GET, returns 200 {"status":"ok"}, imports NO db library
- app/api/notes/route.js exists, exports GET and POST
- GET queries notes with optional ILIKE $1 filter, returns 200 array
- POST validates title (400 TITLE_REQUIRED on empty), inserts with RETURNING *, returns 201 with created note
- Both files use parameterized queries ($1, $2, etc.)
- app/api/notes/route.js imports query from ../../../lib/db.js
  </done>
</task>

<task type="auto">
  <name>Task 2: Create notes item endpoint (GET, PUT, DELETE /api/notes/[id])</name>
  <files>
    app/api/notes/[id]/route.js
  </files>
  <action>
Create app/api/notes/[id]/route.js. This is the dynamic route handler implementing SPEC-005 (TechArch §4.2).

Import query from lib/db.js. Relative path from app/api/notes/[id]/ to lib/db.js is ../../../../lib/db.js.

The `params` argument in Next.js 14 App Router dynamic routes is the second argument to the handler function: `async function GET(request, { params })`. The id comes from `params.id`.

**ID validation helper** (used by all three handlers):
Parse `params.id` as integer. If `parseInt(params.id, 10)` is NaN, or `params.id` contains non-digit characters (i.e., non-positive integer), return 404 immediately:
```js
const id = parseInt(params.id, 10);
if (!Number.isInteger(id) || id <= 0 || String(id) !== params.id) {
  return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
}
```

**GET /api/notes/[id]** (from TechArch §4.2 GET /api/notes/[id]):
1. Validate id (see above) → 404 if invalid
2. SQL: `SELECT * FROM notes WHERE id = $1` with params [id]
3. If result.rows.length === 0: return 404 { "error": "NOTE_NOT_FOUND", "message": "Note not found" }
4. Return 200 with result.rows[0]
5. On DB error: return 500 { "error": "INTERNAL_ERROR", "message": "Internal server error" }

**PUT /api/notes/[id]** (from TechArch §4.2 PUT /api/notes/[id]):
1. Validate id → 404 if invalid
2. Check note exists: `SELECT id FROM notes WHERE id = $1`. If not found → 404 NOTE_NOT_FOUND
3. Parse JSON body. On parse error → 400 BAD_REQUEST
4. Trim title. If empty → 400 TITLE_REQUIRED
5. Coerce body and pinned (same as POST)
6. SQL: `UPDATE notes SET title = $1, body = $2, pinned = $3 WHERE id = $4 RETURNING *`
   Params: [trimmedTitle, noteBody, pinned, id]
7. Return 200 with result.rows[0]
8. On DB error: return 500 INTERNAL_ERROR

**DELETE /api/notes/[id]** (from TechArch §4.2 DELETE /api/notes/[id]):
1. Validate id → 404 if invalid
2. SQL: `DELETE FROM notes WHERE id = $1 RETURNING id` with params [id]
3. If result.rows.length === 0: return 404 { "error": "NOTE_NOT_FOUND", "message": "Note not found" }
4. Return 204 with NO body: `return new Response(null, { status: 204 })`
   ⚠️ CRITICAL: Must use `new Response(null, { status: 204 })` — Response.json() with 204 sends a body which violates HTTP spec
5. On DB error: return 500 INTERNAL_ERROR

Complete implementation:

```js
// app/api/notes/[id]/route.js
import { query } from '../../../../lib/db.js';

function parseId(rawId) {
  const id = parseInt(rawId, 10);
  if (!Number.isInteger(id) || id <= 0 || String(id) !== String(rawId)) {
    return null;
  }
  return id;
}

export async function GET(request, { params }) {
  const id = parseId(params.id);
  if (id === null) {
    return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
  }
  try {
    const result = await query('SELECT * FROM notes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
    }
    return Response.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error('GET /api/notes/[id] error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const id = parseId(params.id);
  if (id === null) {
    return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
  }
  try {
    // Check note exists
    const existing = await query('SELECT id FROM notes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
    }
    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'BAD_REQUEST', message: 'Invalid request body' }, { status: 400 });
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return Response.json({ error: 'TITLE_REQUIRED', message: 'Title is required' }, { status: 400 });
    }
    const noteBody = typeof body.body === 'string' ? body.body : null;
    const pinned = Boolean(body.pinned ?? false);
    const result = await query(
      'UPDATE notes SET title = $1, body = $2, pinned = $3 WHERE id = $4 RETURNING *',
      [title, noteBody, pinned, id]
    );
    return Response.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error('PUT /api/notes/[id] error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const id = parseId(params.id);
  if (id === null) {
    return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
  }
  try {
    const result = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/notes/[id] error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}
```

Create the directory app/api/notes/[id]/ if it doesn't exist before writing the file.
  </action>
  <verify>
grep -n 'export async function GET' "app/api/notes/[id]/route.js" && echo "ITEM_GET_OK" && grep -n 'export async function PUT' "app/api/notes/[id]/route.js" && echo "ITEM_PUT_OK" && grep -n 'export async function DELETE' "app/api/notes/[id]/route.js" && echo "ITEM_DELETE_OK" && grep -n 'NOTE_NOT_FOUND' "app/api/notes/[id]/route.js" && echo "NOT_FOUND_CODE_OK" && grep -n 'TITLE_REQUIRED' "app/api/notes/[id]/route.js" && echo "TITLE_REQUIRED_OK" && grep -n 'new Response(null' "app/api/notes/[id]/route.js" && echo "NO_BODY_204_OK" && grep -n 'import.*query.*lib/db' "app/api/notes/[id]/route.js" && echo "DB_IMPORT_OK" && grep -n 'RETURNING \*' "app/api/notes/[id]/route.js" && echo "RETURNING_OK" && grep -n 'parseInt' "app/api/notes/[id]/route.js" && echo "ID_PARSE_OK" && echo CONTRACT_OK
  </verify>
  <done>
- app/api/notes/[id]/route.js exists, exports GET, PUT, DELETE
- All three handlers validate id as positive integer; non-integer returns 404 NOTE_NOT_FOUND
- GET returns 200 Note or 404 NOTE_NOT_FOUND
- PUT validates title (400 TITLE_REQUIRED), checks note exists (404), updates with RETURNING *, returns 200
- DELETE uses `new Response(null, { status: 204 })` — no response body on success
- All queries are parameterized ($1, $2, etc.)
- File imports query from ../../../../lib/db.js — no direct pg instantiation
  </done>
</task>

</tasks>

<verification>
After both tasks complete, run these checks to confirm wave 2 integration contracts are satisfied:

```bash
# Health endpoint contract
grep -n 'export async function GET' app/api/health/route.js && echo "HEALTH_CONTRACT_OK"

# Notes collection contracts
grep -n 'export async function GET' app/api/notes/route.js && \
grep -n 'export async function POST' app/api/notes/route.js && echo "NOTES_COLLECTION_CONTRACT_OK"

# Notes item contracts
grep -n 'export async function GET' "app/api/notes/[id]/route.js" && \
grep -n 'export async function PUT' "app/api/notes/[id]/route.js" && \
grep -n 'export async function DELETE' "app/api/notes/[id]/route.js" && echo "NOTES_ITEM_CONTRACT_OK"

# Parameterized queries — no string interpolation into SQL
grep -rn 'ILIKE.*\${' app/api/notes/ && echo "SQL_INJECTION_RISK_FAIL" || echo "PARAMETERIZED_OK"

# No hard-coded credentials
grep -rn 'postgresql://' app/api/ && echo "HARDCODED_CREDS_FAIL" || echo "NO_HARDCODED_CREDS_OK"

# DELETE returns 204 no body
grep -n 'new Response(null' "app/api/notes/[id]/route.js" && echo "NO_BODY_204_OK"

# Wave 1 contracts consumed correctly
grep -n 'import.*query.*lib/db' app/api/notes/route.js && echo "WAVE1_CONTRACT_CONSUMED_OK"
grep -n 'import.*query.*lib/db' "app/api/notes/[id]/route.js" && echo "WAVE1_CONTRACT_CONSUMED_ITEM_OK"
```
</verification>

<success_criteria>
- GET /api/health → 200 {"status":"ok"}, no DB query, no imports from lib/db.js
- GET /api/notes → 200 Note[] sorted pinned DESC, created_at DESC; optional ?q= ILIKE title filter with parameterized query
- POST /api/notes → 201 Note on success; 400 TITLE_REQUIRED if title empty; 400 BAD_REQUEST on malformed JSON
- GET /api/notes/[id] → 200 Note or 404 NOTE_NOT_FOUND; non-integer id also 404
- PUT /api/notes/[id] → 200 updated Note; 404 if not found; 400 TITLE_REQUIRED if empty title
- DELETE /api/notes/[id] → 204 no body; 404 NOTE_NOT_FOUND if not found
- All queries use $1, $2 parameterized form — zero SQL string interpolation
- All handlers import { query } from lib/db.js — no direct pg usage in route files
- No credentials hard-coded anywhere
- Wave 3 (frontend) can call all six endpoints with confidence
</success_criteria>

<output>
After completion, create `.planning/express/quicknotes-a-personal-single-user-mobile/02-SUMMARY.md` summarizing:
- Files created: app/api/health/route.js, app/api/notes/route.js, app/api/notes/[id]/route.js
- Key decisions: 204 via new Response(null) not Response.json(); non-integer id → 404 not 400; POST returns 201; query imported from lib/db.js
- Integration contracts delivered: GET/POST /api/notes shapes, GET/PUT/DELETE /api/notes/[id] shapes, GET /api/health shape
- Any deviations from spec (flag, do not silently diverge)
</output>
