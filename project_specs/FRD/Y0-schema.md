
---

## Y0: Database Schema

**Database:** PostgreSQL
**Migration strategy:** Auto-run at server startup via `CREATE TABLE IF NOT EXISTS` (idempotent). See F07.
**Connection:** `DATABASE_URL` environment variable — never hard-coded.

---

### §notes — Primary Table

The `notes` table is the sole data entity in QuickNotes MVP.

#### DDL

```sql
CREATE TABLE IF NOT EXISTS notes (
  id         serial       PRIMARY KEY,
  title      text         NOT NULL,
  body       text,
  pinned     boolean      NOT NULL DEFAULT false,
  created_at timestamptz  NOT NULL DEFAULT now()
);
```

#### Column Definitions

| Column | PostgreSQL Type | Constraints | Description |
|--------|----------------|-------------|-------------|
| `id` | `serial` | `PRIMARY KEY` | Auto-incrementing integer identifier; assigned by DB on insert |
| `title` | `text` | `NOT NULL` | Note title; must be non-empty (enforced at API layer — see F05); no max length |
| `body` | `text` | nullable | Note body / content; may be `NULL` or empty string; no max length |
| `pinned` | `boolean` | `NOT NULL DEFAULT false` | When `true`, note sorts above un-pinned notes in all list queries |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | UTC timestamp of note creation; set automatically by DB on insert; never updated |

#### Indexes

No additional indexes are required for the MVP. All queries use the primary key or a full table scan (acceptable for < 1,000 notes per NFR).

Future candidates (out of scope for MVP):
- `CREATE INDEX idx_notes_created_at ON notes (created_at DESC);`
- `CREATE INDEX idx_notes_title_gin ON notes USING gin (to_tsvector('english', title));` (for full-text search)

#### Query Patterns

| Operation | SQL |
|-----------|-----|
| List all (sorted) | `SELECT * FROM notes ORDER BY pinned DESC, created_at DESC` |
| List with search | `SELECT * FROM notes WHERE title ILIKE $1 ORDER BY pinned DESC, created_at DESC` — `$1 = '%' \|\| q \|\| '%'` |
| Fetch by id | `SELECT * FROM notes WHERE id = $1` |
| Insert | `INSERT INTO notes (title, body, pinned) VALUES ($1, $2, $3) RETURNING *` |
| Update | `UPDATE notes SET title = $1, body = $2, pinned = $3 WHERE id = $4 RETURNING *` |
| Delete | `DELETE FROM notes WHERE id = $1 RETURNING id` |

#### Notes on Data Types

- `serial` is equivalent to `integer NOT NULL DEFAULT nextval(...)`. The sequence starts at 1.
- `text` in PostgreSQL has no maximum length; application-level limits are not enforced in this MVP.
- `timestamptz` stores timestamps with timezone offset; `now()` returns the current transaction time in UTC.
- `boolean` stores `true`/`false`; PostgreSQL accepts `TRUE`/`FALSE`, `'t'`/`'f'`, `1`/`0` — the application layer should always pass a proper boolean.
- **No `updated_at` column** — this is a deliberate MVP scope decision. Note edits do not update any timestamp. Implementers must not add `updated_at` to the schema without a spec change.

---

### §No Other Tables

The QuickNotes MVP has no other tables. There are no users, sessions, tags, or audit log tables. The `notes` table is the entire data model.

---
