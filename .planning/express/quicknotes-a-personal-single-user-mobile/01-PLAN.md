---
phase: quicknotes
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/db.js
  - instrumentation.js
autonomous: true

features:
  implements: ["F7"]
  depends_on: []
  enables: ["F5", "F6"]

must_haves:
  truths:
    - "lib/db.js exports a query() helper that uses a pg.Pool reading DATABASE_URL"
    - "instrumentation.js exports a register() function that runs CREATE TABLE IF NOT EXISTS notes on startup"
    - "Migration is idempotent — re-running against an existing schema produces no errors and no data loss"
    - "Missing DATABASE_URL causes process.exit(1) with a clear error log before the HTTP server starts"
    - "Migration uses a dedicated short-lived pg.Client, separate from the pool used by request handlers"
  artifacts:
    - path: "lib/db.js"
      provides: "pg.Pool singleton with query() helper"
      exports: ["query"]
    - path: "instrumentation.js"
      provides: "Next.js startup migration hook"
      exports: ["register"]
  key_links:
    - from: "instrumentation.js"
      to: "PostgreSQL notes table"
      via: "pg.Client CREATE TABLE IF NOT EXISTS"
      pattern: "CREATE TABLE IF NOT EXISTS notes"
    - from: "lib/db.js"
      to: "process.env.DATABASE_URL"
      via: "pg.Pool connectionString"
      pattern: "process\\.env\\.DATABASE_URL"

integration_contracts:
  requires: []
  provides:
    - artifact: "lib/db.js"
      exports: ["query"]
      shape: |
        import pg from 'pg';
        const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
        export const query = (text, params) => pool.query(text, params);
      verify: "grep -n 'export const query' lib/db.js && echo CONTRACT_OK"
    - artifact: "instrumentation.js"
      exports: ["register"]
      shape: |
        export async function register() { /* CREATE TABLE IF NOT EXISTS notes ... */ }
      verify: "grep -n 'export async function register' instrumentation.js && grep -n 'CREATE TABLE IF NOT EXISTS' instrumentation.js && echo CONTRACT_OK"
    - artifact: "PostgreSQL notes table (DDL)"
      exports: ["notes"]
      shape: |
        CREATE TABLE IF NOT EXISTS notes (
          id          serial       PRIMARY KEY,
          title       text         NOT NULL,
          body        text,
          pinned      boolean      NOT NULL DEFAULT false,
          created_at  timestamptz  NOT NULL DEFAULT now()
        );
      verify: "grep -n 'serial' instrumentation.js && grep -n 'timestamptz' instrumentation.js && echo CONTRACT_OK"
---

<objective>
Wire up the PostgreSQL layer for QuickNotes: create the lib/db.js singleton pool used by all request handlers and write instrumentation.js which runs the idempotent notes table migration via Next.js's register() startup hook — before the HTTP server ever accepts a connection.

Purpose: All subsequent waves (backend API, frontend) depend on a live database connection (lib/db.js) and an existing notes table. This wave fulfills F7 (Auto-Migration on Startup) and the SPEC-002/SPEC-003/SPEC-011 TechArch components.
Output: lib/db.js (pool + query helper) and instrumentation.js (startup migration hook).
</objective>

<feature_dependencies>
Implements: F7: Auto-Migration on Startup — idempotent CREATE TABLE IF NOT EXISTS notes via instrumentation.js register(); DATABASE_URL from env; lib/db.js singleton pool
Depends on: None
Enables: F5: REST API (all route handlers consume lib/db.js query()); F6: Health Endpoint (server process must start cleanly)
</feature_dependencies>

<execution_context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/express/quicknotes-a-personal-single-user-mobile/WAVE-SCHEDULE.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

Key constraints (non-negotiable):
- DATABASE_URL from process.env ONLY — never hard-coded
- instrumentation.js uses register() export (Next.js 14 Instrumentation API)
- Migration uses a dedicated pg.Client (not the pool) — connected, used, then ended
- Guarded by process.env.NEXT_RUNTIME === 'nodejs' to skip edge runtime
- process.exit(1) on missing DATABASE_URL or SQL failure
- lib/db.js exports query(text, params) using pg.Pool
- No next.config.ts — config file must be next.config.mjs (handled in wave 3)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create lib/db.js — pg.Pool singleton with query helper</name>
  <files>lib/db.js</files>
  <action>
Create lib/db.js as an ES Module. This file provides the pg.Pool singleton used by all API route handlers and server components. It must NEVER hard-code credentials.

Exact implementation (from TechArch SPEC-003):

```js
// lib/db.js
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);
```

Requirements:
- Uses `import pg from 'pg'` (ES Module; pg package must be installed)
- Pool reads connectionString exclusively from process.env.DATABASE_URL
- Exports a named export `query` — this is the ONLY export consumed by wave 2 route handlers
- No connection validation at module load time (the pool is lazy; validation happens on first query)
- No hard-coded host, port, user, password, or database name anywhere in this file

Also ensure pg is in package.json dependencies. Run: `npm install pg` if package.json does not already include `"pg"`.
  </action>
  <verify>
```bash
# Confirm file exists and exports query
grep -n "export const query" lib/db.js && echo "QUERY_EXPORT_OK"
# Confirm no hard-coded credentials
grep -rn "postgresql://" lib/db.js && echo "CREDS_HARDCODED_FAIL" || echo "NO_HARDCODED_CREDS_OK"
# Confirm DATABASE_URL env usage
grep -n "DATABASE_URL" lib/db.js && echo "ENV_VAR_OK"
# Confirm pg is a dependency
grep '"pg"' package.json && echo "PG_DEP_OK"
```
  </verify>
  <done>
- lib/db.js exists with a pg.Pool reading process.env.DATABASE_URL
- Named export `query(text, params)` is present
- No credentials are hard-coded anywhere in the file
- `pg` package is listed in package.json dependencies
  </done>
</task>

<task type="auto">
  <name>Task 2: Create instrumentation.js — startup migration hook with exact DDL</name>
  <files>instrumentation.js</files>
  <action>
Create instrumentation.js at the project root. This file uses the Next.js 14 Instrumentation API — the `register()` async function is called exactly once by the framework before the HTTP server opens. It runs the idempotent notes table DDL.

Exact implementation (from TechArch SPEC-002 and Section 3.5):

```js
// instrumentation.js
export async function register() {
  // Only run in the Node.js runtime (not edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: pg } = await import('pg');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    const client = new pg.Client({ connectionString });
    try {
      await client.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS notes (
          id          serial       PRIMARY KEY,
          title       text         NOT NULL,
          body        text,
          pinned      boolean      NOT NULL DEFAULT false,
          created_at  timestamptz  NOT NULL DEFAULT now()
        )
      `);
      console.log('Migration: notes table ready');
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    } finally {
      await client.end();
    }
  }
}
```

Critical requirements (from TechArch Section 3.5 and F7 FRD):
- DDL is EXACTLY `CREATE TABLE IF NOT EXISTS notes (...)` — copy column names/types verbatim:
  - `id serial PRIMARY KEY`
  - `title text NOT NULL`
  - `body text` (nullable — no NOT NULL constraint)
  - `pinned boolean NOT NULL DEFAULT false`
  - `created_at timestamptz NOT NULL DEFAULT now()`
- Uses a dedicated `pg.Client` (NOT the pool from lib/db.js) — connected for migration, then ended in `finally`
- Guarded by `process.env.NEXT_RUNTIME === 'nodejs'` to prevent running in edge runtime
- `process.exit(1)` on missing DATABASE_URL — with log message: `'DATABASE_URL environment variable is not set'`
- `process.exit(1)` on SQL failure — with log: `'Migration failed:', err`
- `console.log('Migration: notes table ready')` on success
- Migration must NEVER DROP or TRUNCATE the notes table
- File must be at project root: `instrumentation.js` (not inside app/ or src/)

Also verify that next.config.mjs (if it exists) does NOT disable the instrumentation hook. Next.js 14 requires `experimental.instrumentationHook: true` in older patch versions — check if the project's Next.js version needs it. If next.config.mjs does not exist yet, create a minimal one:

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

Note: Wave 3 will expand next.config.mjs with headers() for iframe compatibility. This task only ensures the file exists and does not block instrumentation.
  </action>
  <verify>
```bash
# Confirm file exists at project root
ls instrumentation.js && echo "FILE_EXISTS_OK"
# Confirm register export
grep -n "export async function register" instrumentation.js && echo "REGISTER_EXPORT_OK"
# Confirm NEXT_RUNTIME guard
grep -n "NEXT_RUNTIME" instrumentation.js && echo "RUNTIME_GUARD_OK"
# Confirm exact DDL keywords
grep -n "CREATE TABLE IF NOT EXISTS" instrumentation.js && echo "DDL_IDEMPOTENT_OK"
grep -n "serial" instrumentation.js && echo "SERIAL_OK"
grep -n "timestamptz" instrumentation.js && echo "TIMESTAMPTZ_OK"
grep -n "pinned" instrumentation.js && echo "PINNED_OK"
# Confirm process.exit on missing DATABASE_URL
grep -n "process.exit(1)" instrumentation.js && echo "EXIT_ON_FAILURE_OK"
# Confirm no hard-coded credentials
grep -rn "postgresql://" instrumentation.js && echo "CREDS_HARDCODED_FAIL" || echo "NO_HARDCODED_CREDS_OK"
# Confirm uses pg.Client (not pool)
grep -n "pg.Client" instrumentation.js && echo "CLIENT_NOT_POOL_OK"
# Confirm no DROP or TRUNCATE
grep -in "DROP\|TRUNCATE" instrumentation.js && echo "DESTRUCTIVE_DDL_FAIL" || echo "NO_DESTRUCTIVE_DDL_OK"
```
  </verify>
  <done>
- instrumentation.js exists at project root with `export async function register()`
- register() is guarded by `process.env.NEXT_RUNTIME === 'nodejs'`
- Exact DDL: `CREATE TABLE IF NOT EXISTS notes (id serial PRIMARY KEY, title text NOT NULL, body text, pinned boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now())`
- Uses a dedicated pg.Client, not the pool from lib/db.js
- process.exit(1) on missing DATABASE_URL with exact log message
- process.exit(1) on SQL failure
- No DROP, TRUNCATE, or any destructive DDL present
- next.config.mjs exists at project root (minimal or pre-existing)
  </done>
</task>

</tasks>

<verification>
After both tasks complete, run these checks to confirm wave 1 is ready for wave 2 to consume:

```bash
# Integration contract: lib/db.js provides query export
grep -n "export const query" lib/db.js && echo "CONTRACT_DB_OK"

# Integration contract: instrumentation.js provides register export with DDL
grep -n "export async function register" instrumentation.js && \
grep -n "CREATE TABLE IF NOT EXISTS" instrumentation.js && echo "CONTRACT_MIGRATION_OK"

# Security: no hard-coded credentials in either file
grep -rn "postgresql://" lib/db.js instrumentation.js && echo "SECURITY_FAIL" || echo "SECURITY_OK"

# DDL completeness: all 5 columns present
grep -n "id" instrumentation.js && \
grep -n "title" instrumentation.js && \
grep -n "body" instrumentation.js && \
grep -n "pinned" instrumentation.js && \
grep -n "created_at" instrumentation.js && echo "ALL_COLUMNS_OK"
```
</verification>

<success_criteria>
- lib/db.js: pg.Pool singleton reading DATABASE_URL, named export `query(text, params)`
- instrumentation.js: `register()` export with NEXT_RUNTIME guard, exact 5-column DDL, pg.Client lifecycle, process.exit(1) on failure, no destructive DDL
- No credentials hard-coded in any file
- pg package present in package.json
- next.config.mjs exists at project root (wave 3 will fully configure it)
- Wave 2 (backend) can import `{ query } from '../lib/db.js'` with confidence the notes table will exist at runtime
</success_criteria>

<output>
After completion, create `.planning/express/quicknotes-a-personal-single-user-mobile/01-SUMMARY.md` summarizing:
- Files created: lib/db.js, instrumentation.js (and next.config.mjs if created)
- Key decisions: pg.Client for migration vs pg.Pool for request handlers; NEXT_RUNTIME guard; exact DDL copied from TechArch
- Integration contracts delivered: query() export shape, register() export shape, notes table DDL
- Any deviations from spec (flag, do not silently diverge)
</output>
