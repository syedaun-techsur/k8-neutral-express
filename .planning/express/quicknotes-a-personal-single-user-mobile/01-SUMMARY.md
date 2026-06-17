---
phase: quicknotes
plan: "01"
subsystem: database
tags: [postgresql, pg, next.js, instrumentation, migration, database]
dependency_graph:
  requires: []
  provides:
    - lib/db.js (pg.Pool singleton, query() helper)
    - instrumentation.js (Next.js register() startup migration hook)
    - PostgreSQL notes table (5-column DDL, idempotent)
  affects:
    - wave 2 backend (all route handlers consume lib/db.js query())
    - wave 3 frontend (server components use query() for page data)
tech_stack:
  added:
    - pg ^8.13.3 (node-postgres driver)
    - next 14.2.35 (framework, App Router)
    - react ^18 / react-dom ^18
  patterns:
    - pg.Pool singleton for request-handler DB access
    - dedicated pg.Client for migration (connect → migrate → end)
    - NEXT_RUNTIME guard to skip edge runtime
    - idempotent CREATE TABLE IF NOT EXISTS DDL
key_files:
  created:
    - lib/db.js
    - instrumentation.js
    - next.config.mjs
    - package.json
    - package-lock.json
  modified: []
decisions:
  - pg.Client used for migration (not pool) — matches TechArch SPEC-002 requirement for dedicated short-lived connection
  - NEXT_RUNTIME === 'nodejs' guard prevents migration running in Edge runtime
  - DDL copied verbatim from TechArch Section 3.2 / SPEC-003
  - next.config.mjs kept minimal — wave 3 will add headers() for iframe compatibility
  - Next.js app scaffolded manually (package.json + dependencies) because create-next-app was non-interactive and couldn't write to non-empty dir
metrics:
  duration: "~8 minutes"
  completed: "2026-06-17T22:18:09Z"
  tasks_completed: 2
  files_created: 5
---

# Phase quicknotes Plan 01: PostgreSQL Layer — DB Pool + Auto-Migration Summary

**One-liner:** pg.Pool singleton in lib/db.js and Next.js register() startup migration creating the 5-column notes table via idempotent CREATE TABLE IF NOT EXISTS DDL using a dedicated pg.Client.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create lib/db.js — pg.Pool singleton with query helper | f41c7b2 | lib/db.js, package.json, package-lock.json |
| 2 | Create instrumentation.js — startup migration hook with exact DDL | cb22c87 | instrumentation.js, next.config.mjs |

---

## Files Created

### `lib/db.js`
ES Module exporting a single named export `query(text, params)` backed by a `pg.Pool` that reads `connectionString` from `process.env.DATABASE_URL` exclusively. No credentials ever hard-coded. Pool is lazy — no connection validation at module load time.

```js
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const query = (text, params) => pool.query(text, params);
```

### `instrumentation.js`
Next.js 14 Instrumentation API hook. The `register()` export is called by the framework exactly once before the HTTP server accepts connections. Guarded by `NEXT_RUNTIME === 'nodejs'` to prevent running in the edge runtime. Uses a dedicated `pg.Client` (not the pool) that connects, runs the idempotent DDL, then ends in `finally`.

**DDL (exact, from TechArch Section 3.2):**
```sql
CREATE TABLE IF NOT EXISTS notes (
  id          serial       PRIMARY KEY,
  title       text         NOT NULL,
  body        text,
  pinned      boolean      NOT NULL DEFAULT false,
  created_at  timestamptz  NOT NULL DEFAULT now()
)
```

Failure modes: `process.exit(1)` on missing `DATABASE_URL` (with log `'DATABASE_URL environment variable is not set'`) and on SQL failure (with log `'Migration failed:', err`). No DROP or TRUNCATE anywhere.

### `next.config.mjs`
Minimal ES Module config file at project root. Wave 3 will add the `headers()` function for iframe compatibility (intentionally omitting X-Frame-Options). File uses `.mjs` extension as required by TechArch SPEC-001 (Next.js 14 hard-errors on `.ts` config).

### `package.json` + `package-lock.json`
Bootstrapped Next.js 14 project with dependencies: `next@14.2.35`, `react@^18`, `react-dom@^18`, `pg@^8.13.3`. Dev deps: `eslint@^8`, `eslint-config-next@14.2.35`. Scripts: `dev`, `build`, `start`, `lint`.

---

## Integration Contracts Delivered

| Contract | Shape | Verified |
|----------|-------|---------|
| `lib/db.js` → `query()` | `export const query = (text, params) => pool.query(text, params)` | `grep -n 'export const query' lib/db.js` → line 8 |
| `instrumentation.js` → `register()` | `export async function register() { ... }` | `grep -n 'export async function register' instrumentation.js` → line 2 |
| PostgreSQL `notes` table DDL | 5 columns: id serial PK, title text NOT NULL, body text, pinned boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now() | All column keywords confirmed in instrumentation.js |

---

## Key Decisions

1. **pg.Client for migration vs pg.Pool for request handlers** — The TechArch SPEC-002 explicitly requires a dedicated short-lived `pg.Client` for the migration, separate from the pool. This ensures the migration connection is fully released before the HTTP server begins serving requests.

2. **NEXT_RUNTIME guard** — The `process.env.NEXT_RUNTIME === 'nodejs'` check prevents the migration from running in Next.js's Edge runtime (where `pg` is incompatible), or during static generation build passes.

3. **DDL copied verbatim from TechArch** — No interpretation or simplification; column names, types, and constraints match SPEC-003 exactly to ensure wave 2 route handlers can rely on this schema contract.

4. **Minimal next.config.mjs** — Wave 3 plan explicitly owns the `headers()` configuration for iframe compatibility. This wave creates only the file existence requirement without adding any headers.

5. **Manual scaffolding** — `create-next-app@14` is non-interactive in this environment and cannot write to a non-empty directory. The Next.js app was bootstrapped manually via `package.json` with correct dependency versions, which is fully equivalent and produces the same result.

---

## Deviations from Plan

### Auto-scaffold vs manual setup (Rule 3 — Blocking Issue)
- **Found during:** Task 1 setup
- **Issue:** `create-next-app@14` cannot scaffold into a non-empty directory (`.git/`, `.planning/`, etc. were present), and its prompts were non-interactive in this execution environment.
- **Fix:** Manually created `package.json` with the correct Next.js 14 + React 18 + pg dependency versions, then ran `npm install`. The result is functionally identical to a `create-next-app` scaffold.
- **Files modified:** `package.json`, `package-lock.json`
- **Impact:** None — all TechArch constraints satisfied (correct versions, App Router, ES Modules)

**All other plan requirements executed exactly as written. No architectural changes made.**

---

## Self-Check: PASSED

| Artifact | Status |
|----------|--------|
| lib/db.js | FOUND |
| instrumentation.js | FOUND |
| next.config.mjs | FOUND |
| package.json | FOUND |
| Commit f41c7b2 (Task 1) | FOUND |
| Commit cb22c87 (Task 2) | FOUND |
