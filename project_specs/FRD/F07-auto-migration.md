
---

## F07: Auto-Migration on Startup

**Description:** Before the Next.js server begins accepting HTTP requests, it automatically executes an idempotent SQL migration that creates the `notes` table if it does not already exist. This ensures zero manual database setup — a fresh environment with only a valid `DATABASE_URL` reaches a working state without any human intervention. The migration is safe to re-run on every restart.

**Terminology:**
- **Idempotent migration:** A SQL statement that produces the same result regardless of how many times it is executed — specifically `CREATE TABLE IF NOT EXISTS`
- **Startup hook:** Code executed before the HTTP server starts accepting connections; in Next.js 14 App Router, this is typically implemented in `instrumentation.ts` (or `.js`) or in a custom server entry point

**Sub-features:**
- `CREATE TABLE IF NOT EXISTS notes (...)` executed at startup
- `DATABASE_URL` read from runtime environment (never hard-coded)
- Migration failure causes process to exit with error log
- Safe to re-run: does not drop, truncate, or alter existing data

**Process:**
1. Next.js server process starts.
2. Before serving requests, the startup hook runs.
3. Hook reads `process.env.DATABASE_URL` (or equivalent env var) to obtain the PostgreSQL connection string.
4. If `DATABASE_URL` is absent or empty, log a clear error: `"DATABASE_URL environment variable is not set"` and exit the process with a non-zero code.
5. Establish a PostgreSQL connection using the connection string.
6. Execute the following SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS notes (
     id         serial          PRIMARY KEY,
     title      text            NOT NULL,
     body       text,
     pinned     boolean         NOT NULL DEFAULT false,
     created_at timestamptz     NOT NULL DEFAULT now()
   );
   ```
7. If the SQL succeeds: close/release the migration connection; server proceeds to accept requests.
8. If the SQL fails (e.g., database unreachable, permission denied): log the error clearly and exit the process with a non-zero code. Do not silently swallow the error.

**Inputs:**
- `DATABASE_URL` (environment variable, required): PostgreSQL connection string in standard format, e.g. `postgresql://user:password@host:5432/dbname`

**Outputs:**
- On success: `notes` table exists in the database (created or already existed); server starts normally
- On failure: process exits with non-zero code; error message written to stderr/stdout

**Validation:**
- `DATABASE_URL` must be present and non-empty at startup — missing value is a hard startup failure
- The SQL migration must use `CREATE TABLE IF NOT EXISTS` — never `CREATE TABLE` (would fail on re-run) or `DROP TABLE` + `CREATE TABLE` (would destroy data)
- No credentials may appear hard-coded in source files — the connection string must come entirely from the environment variable
- The migration must not modify or drop existing columns if the table already exists (schema evolution is out of scope for this MVP)

**Error States:**

| Scenario | Behaviour | Log message |
|----------|-----------|-------------|
| `DATABASE_URL` not set | Process exits (non-zero) | "DATABASE_URL environment variable is not set" |
| Database unreachable | Process exits (non-zero) | "Migration failed: [connection error details]" |
| Insufficient DB permissions | Process exits (non-zero) | "Migration failed: [permission error details]" |
| Table already exists | No-op (success) | (silent or "Migration: notes table already exists") |
| Migration completes successfully | Server starts | (silent or "Migration: notes table ready") |

**API Surface (this feature):** None — this feature has no HTTP endpoints.

**Schema Surface (this feature):** Defines the `notes` table — see `Y0-schema.md §notes` for the authoritative DDL.

---
