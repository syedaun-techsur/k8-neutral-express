# Technical Architecture Document — QuickNotes

**Project:** QuickNotes
**Acronym:** QN
**Version:** 1.0
**Date:** 2026-06-17
**Status:** Active
**Based on:** PRD-QuickNotes v1.0, FRD-QuickNotes v1.0

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Component Architecture](#2-component-architecture)
3. [Data Model](#3-data-model)
4. [API Design](#4-api-design)
5. [Security Architecture](#5-security-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Integration Points](#7-integration-points)

---

## 1. Architectural Overview

### 1.1 Architecture Pattern

QuickNotes uses a **Monolithic Next.js Full-Stack** pattern. The entire application — UI rendering, API route handlers, and database access — lives in a single Next.js 14 App Router process. This is the appropriate choice for a single-entity, single-user MVP: it eliminates network hops between tiers, reduces operational complexity to a single process, and allows server components to query the database directly without going through the REST layer.

There is no separate backend service, no message queue, no cache layer, and no authentication service. The only external dependency is a PostgreSQL database.

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser / iframe host                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │          <iframe src="http://host:3000">                │   │
│   │                                                         │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │           Next.js 14 App  (0.0.0.0:3000)        │   │   │
│   │   │                                                 │   │   │
│   │   │  ┌──────────────┐   ┌──────────────────────┐   │   │   │
│   │   │  │  App Router  │   │   Route Handlers     │   │   │   │
│   │   │  │  (RSC pages) │   │   /api/notes         │   │   │   │
│   │   │  │              │   │   /api/notes/[id]    │   │   │   │
│   │   │  │  /           │   │   /api/health        │   │   │   │
│   │   │  │  /notes/new  │   │                      │   │   │   │
│   │   │  │  /notes/[id]/│   └──────────┬───────────┘   │   │   │
│   │   │  │    edit      │              │               │   │   │
│   │   │  └──────┬───────┘              │               │   │   │
│   │   │         │         DB Client (pg / postgres.js) │   │   │
│   │   │         └──────────────────────┘               │   │   │
│   │   │                        │                       │   │   │
│   │   │            ┌───────────▼───────────┐           │   │   │
│   │   │            │  Startup Migration    │           │   │   │
│   │   │            │  (instrumentation.js) │           │   │   │
│   │   │            └───────────┬───────────┘           │   │   │
│   │   └────────────────────────┼────────────────────── ┘   │   │
│   │                            │                           │   │
│   └────────────────────────────┼───────────────────────────┘   │
│                                │                               │
└────────────────────────────────┼───────────────────────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │      PostgreSQL            │
                    │   (DATABASE_URL from env)  │
                    │                           │
                    │   Table: notes            │
                    └───────────────────────────┘
```

### 1.3 Deployment Topology

```
Container / VM
├── Node.js ≥ 18 process
│   ├── Next.js 14 (next start)
│   │   Binds to 0.0.0.0:3000
│   └── instrumentation.js runs migrate() before HTTP server opens
│
└── Environment variables
    └── DATABASE_URL=postgresql://user:pass@host:5432/dbname
        (never hard-coded; injected at container/pod start)

External service
└── PostgreSQL (managed or self-hosted; same network as container)
```

### 1.4 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Single Next.js process (no separate API server) | Single-entity MVP; co-location of RSC + API simplifies deployment to one container |
| App Router (not Pages Router) | Prescribed; enables React Server Components for direct DB queries in page components |
| Auto-migration via `instrumentation.js` | Zero-manual-setup hard constraint; Next.js 14 `register()` export runs once before first request |
| `next.config.mjs` (ES Module, never `.ts`) | Next.js 14 hard-errors on TypeScript config files; `.mjs` avoids all ambiguity |
| No `X-Frame-Options` / no `frame-ancestors` CSP | App must render inside an embedded cross-origin iframe; these headers would silently break the preview |
| Bind to `0.0.0.0:3000` | Required for container networking and iframe preview host reachability |
| `DATABASE_URL` from environment only | Security requirement; prevents credential leakage in source control |
| `pg` (node-postgres) for DB client | Minimal, widely-used, no ORM overhead; direct parameterized queries avoid SQL injection |
| Plain CSS / CSS Modules | No Tailwind, no CSS-in-JS; meets styling constraint; zero runtime CSS overhead |

---

## 2. Component Architecture

### 2.1 Directory Structure

```
project-root/
├── next.config.mjs              ← MUST be .mjs (never .ts)
├── package.json
├── instrumentation.js           ← startup migration hook (register() export)
├── lib/
│   └── db.js                    ← PostgreSQL client singleton (reads DATABASE_URL)
├── app/
│   ├── layout.js                ← root layout; sets global CSS; NO X-Frame-Options header
│   ├── globals.css              ← global base styles, colour tokens
│   ├── page.js                  ← F00: Note List View (/)
│   ├── notes/
│   │   ├── new/
│   │   │   └── page.js          ← F02: Create Note (/notes/new)
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.js      ← F03 + F04: Edit Note + Delete Note
│   └── api/
│       ├── health/
│       │   └── route.js         ← F06: GET /api/health
│       └── notes/
│           ├── route.js         ← F05: GET /api/notes, POST /api/notes
│           └── [id]/
│               └── route.js     ← F05: GET, PUT, DELETE /api/notes/[id]
└── components/                  ← (optional) shared UI components
    ├── NoteCard.js
    ├── NoteCard.module.css
    ├── NoteForm.js
    └── NoteForm.module.css
```

### 2.2 Backend Components

#### `instrumentation.js` — Startup Migration Hook

The Next.js 14 [Instrumentation API](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation) exports a `register()` function that the framework calls exactly once when the server process initialises, before any HTTP requests are served. This is the canonical location for the auto-migration.

**Responsibilities:**
- Read `process.env.DATABASE_URL`; exit with error if absent
- Execute `CREATE TABLE IF NOT EXISTS notes (...)` (idempotent)
- Release connection after migration; hand off to normal server lifecycle
- On SQL failure: log error to stderr and re-throw (causes process to exit with non-zero code)

**Critical note:** `instrumentation.js` (not `.ts`) must be used. TypeScript instrumentation is acceptable only if the project compiles it — for simplicity, plain `.js` is preferred.

#### `lib/db.js` — Database Client Singleton

**Responsibilities:**
- Create and export a single `pg.Pool` instance reading `DATABASE_URL` (or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` env vars) at module load time
- Provide a `query(sql, params)` helper used by all route handlers and server components
- Never hard-code any connection credential

```js
// lib/db.js (illustrative — not implementation)
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const query = (text, params) => pool.query(text, params);
```

#### `app/api/notes/route.js` — Collection Endpoint

**Responsibilities:**
- `GET /api/notes`: query all notes (with optional `?q=` ILIKE filter), return `200` JSON array
- `POST /api/notes`: validate `title`, insert row, return `201` with created note object

#### `app/api/notes/[id]/route.js` — Item Endpoint

**Responsibilities:**
- `GET /api/notes/[id]`: fetch single note by integer id; `404` if not found or id invalid
- `PUT /api/notes/[id]`: validate `title`, update row, return `200`; `404` if not found
- `DELETE /api/notes/[id]`: delete row, return `204`; `404` if not found

#### `app/api/health/route.js` — Health Check

**Responsibilities:**
- `GET /api/health`: return `200 {"status":"ok"}` with no database query

### 2.3 Frontend Components

#### `app/page.js` — Note List View (Server Component)

**Responsibilities:**
- Server-side DB query: `SELECT * FROM notes ORDER BY pinned DESC, created_at DESC` (with optional ILIKE on `?q=`)
- Render note cards (each linking to `/notes/[id]/edit`)
- Render empty state when zero notes
- Render search input (pre-populated from `searchParams.q`)
- Render "New note" link

#### `app/notes/new/page.js` — Create Note (Client Component)

**Responsibilities:**
- Render blank `NoteForm` (title, body, pinned)
- Client-side `title` validation before `POST /api/notes`
- Redirect to `/` on `201`; display error banner on failure

#### `app/notes/[id]/edit/page.js` — Edit + Delete Note (Server + Client)

**Responsibilities:**
- Server component fetches note by `id`; renders not-found state if `404`
- Render pre-populated `NoteForm`
- Client handles `PUT /api/notes/[id]` on save; redirect to `/` on `200`
- Client handles `DELETE /api/notes/[id]` after confirmation step; redirect to `/` on `204`

### 2.4 `next.config.mjs` — Configuration

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do NOT add X-Frame-Options: DENY
  // Do NOT add frame-ancestors 'none' or 'self' in CSP
  // The app must render inside a cross-origin iframe
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Intentionally NO X-Frame-Options header
          // Intentionally NO Content-Security-Policy with frame-ancestors
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Critical constraints enforced here:**
1. File is `.mjs` — never `.ts` (Next.js 14 hard-errors on TypeScript config)
2. No `X-Frame-Options` header added to any route
3. No `frame-ancestors` CSP directive restricting embedding

---

## 3. Data Model

### 3.1 Entity-Relationship Diagram

```
┌──────────────────────────────────────────┐
│                  notes                   │
├─────────────┬────────────┬───────────────┤
│ id          │ serial     │ PK            │
│ title       │ text       │ NOT NULL      │
│ body        │ text       │ nullable      │
│ pinned      │ boolean    │ NOT NULL      │
│             │            │ DEFAULT false │
│ created_at  │ timestamptz│ NOT NULL      │
│             │            │ DEFAULT now() │
└─────────────┴────────────┴───────────────┘

(Single entity — no foreign keys, no joins)
```

### 3.2 Complete DDL

```sql
-- ============================================================
-- QuickNotes Database Schema
-- Migration: auto-run via instrumentation.js on every startup
-- Strategy: CREATE TABLE IF NOT EXISTS (idempotent)
-- Connection: DATABASE_URL environment variable — never hard-coded
-- ============================================================

CREATE TABLE IF NOT EXISTS notes (
  id          serial       PRIMARY KEY,
  title       text         NOT NULL,
  body        text,
  pinned      boolean      NOT NULL DEFAULT false,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
-- No additional indexes required for MVP (< 1,000 notes, full
-- table scans are acceptable per PRD NFR).
--
-- Future candidates (out of scope for MVP):
--   CREATE INDEX IF NOT EXISTS idx_notes_created_at
--     ON notes (created_at DESC);
--
--   CREATE INDEX IF NOT EXISTS idx_notes_title_gin
--     ON notes USING gin (to_tsvector('english', title));
-- ============================================================
```

### 3.3 Column Definitions

| Column | PostgreSQL Type | Constraints | Description |
|--------|----------------|-------------|-------------|
| `id` | `serial` | `PRIMARY KEY` | Auto-incrementing integer PK; assigned by DB on `INSERT`; never supplied by client |
| `title` | `text` | `NOT NULL` | Note title; non-empty enforced at API layer (not DB constraint); unbounded length |
| `body` | `text` | nullable | Note body content; `NULL` and empty string both valid; unbounded length |
| `pinned` | `boolean` | `NOT NULL DEFAULT false` | When `true`, note sorts above unpinned notes in all list queries |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | UTC creation timestamp; set by DB on `INSERT`; never modified by `UPDATE` |

### 3.4 Standard Query Patterns

```sql
-- List all notes (sorted: pinned first, then newest first)
SELECT * FROM notes
ORDER BY pinned DESC, created_at DESC;

-- List with title search filter (case-insensitive substring)
SELECT * FROM notes
WHERE title ILIKE $1          -- $1 = '%' || searchTerm || '%'
ORDER BY pinned DESC, created_at DESC;

-- Fetch single note by id
SELECT * FROM notes
WHERE id = $1;                -- $1 = integer id

-- Create new note
INSERT INTO notes (title, body, pinned)
VALUES ($1, $2, $3)           -- $1=title, $2=body|null, $3=pinned
RETURNING *;

-- Update existing note
UPDATE notes
SET title = $1,               -- $1 = trimmed title (non-empty)
    body  = $2,               -- $2 = body string or null
    pinned = $3               -- $3 = boolean
WHERE id = $4                 -- $4 = integer id
RETURNING *;

-- Delete note
DELETE FROM notes
WHERE id = $1                 -- $1 = integer id
RETURNING id;
```

### 3.5 Auto-Migration Implementation

The migration runs inside `instrumentation.js` via the `register()` export:

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

**Key properties:**
- `CREATE TABLE IF NOT EXISTS` — idempotent on every restart
- `process.exit(1)` on missing `DATABASE_URL` or SQL failure — fails fast with clear error
- Uses a dedicated short-lived `pg.Client` for migration, separate from the pool used by request handlers
- Guarded by `process.env.NEXT_RUNTIME === 'nodejs'` to prevent execution in the Edge runtime

---

## 4. API Design

### 4.1 TypeScript Interfaces

```typescript
// types/notes.ts

/** A note record as returned by all GET/POST/PUT endpoints */
export interface Note {
  id: number;
  title: string;
  body: string | null;
  pinned: boolean;
  created_at: string; // ISO 8601 UTC string, e.g. "2026-06-17T10:00:00.000Z"
}

/** Request body for POST /api/notes */
export interface CreateNoteRequest {
  title: string;       // required; non-empty after trim
  body?: string | null; // optional; defaults to null
  pinned?: boolean;    // optional; defaults to false
}

/** Request body for PUT /api/notes/[id] */
export interface UpdateNoteRequest {
  title: string;       // required; non-empty after trim
  body?: string | null; // optional
  pinned?: boolean;    // optional
}

/** Query parameters for GET /api/notes */
export interface ListNotesQuery {
  q?: string; // optional case-insensitive title filter
}

/** Standard error response body */
export interface ApiError {
  error: ErrorCode;
  message: string;
}

/** All defined error codes */
export type ErrorCode =
  | 'TITLE_REQUIRED'
  | 'NOTE_NOT_FOUND'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR';

/** Health check response */
export interface HealthResponse {
  status: 'ok';
}
```

### 4.2 REST Endpoints

**Base path:** `/api`
**Content-Type:** `application/json` on all responses (except `204 No Content`)
**Authentication:** None (single-user MVP)
**Framework:** Next.js 14 App Router Route Handlers

---

#### `GET /api/health`

| Property | Value |
|----------|-------|
| Purpose | Liveness check — confirms process is alive |
| Auth | None |
| DB query | None |

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| `200` | `{"status":"ok"}` | Always |
| `405` | — | Non-GET method (Next.js default) |

---

#### `GET /api/notes`

| Property | Value |
|----------|-------|
| Purpose | Return all notes sorted pinned-first, newest-first; optionally filter by title |
| Auth | None |
| DB query | `SELECT * FROM notes [WHERE title ILIKE $1] ORDER BY pinned DESC, created_at DESC` |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | No | Case-insensitive substring filter on `title` |

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| `200` | `Note[]` (may be `[]`) | Success |
| `500` | `ApiError` (`INTERNAL_ERROR`) | Database error |

**Example:**
```
GET /api/notes?q=meeting
→ 200
[
  { "id": 4, "title": "Meeting notes", "body": "Action items", "pinned": true, "created_at": "2026-06-17T11:00:00.000Z" }
]
```

---

#### `POST /api/notes`

| Property | Value |
|----------|-------|
| Purpose | Create a new note |
| Auth | None |
| DB query | `INSERT INTO notes (title, body, pinned) VALUES ($1, $2, $3) RETURNING *` |

**Request Body** (`Content-Type: application/json`):

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `title` | string | Yes | — | Non-empty after `.trim()` |
| `body` | string \| null | No | `null` | Any string or null |
| `pinned` | boolean | No | `false` | Boolean; coerced if absent |

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| `201` | Created `Note` object | Success |
| `400` | `{"error":"TITLE_REQUIRED","message":"Title is required"}` | `title` missing or empty |
| `400` | `{"error":"BAD_REQUEST","message":"Invalid request body"}` | Malformed JSON |
| `500` | `ApiError` (`INTERNAL_ERROR`) | Database error |

**Example:**
```
POST /api/notes
{ "title": "Buy groceries", "body": "Milk, eggs, bread", "pinned": false }
→ 201
{ "id": 5, "title": "Buy groceries", "body": "Milk, eggs, bread", "pinned": false, "created_at": "2026-06-17T12:00:00.000Z" }
```

---

#### `GET /api/notes/[id]`

| Property | Value |
|----------|-------|
| Purpose | Fetch a single note by integer id |
| Auth | None |
| DB query | `SELECT * FROM notes WHERE id = $1` |

**Path Parameters:**

| Param | Type | Required | Validation |
|-------|------|----------|------------|
| `id` | integer | Yes | Positive integer; non-integer → `404` |

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| `200` | `Note` object | Note found |
| `404` | `{"error":"NOTE_NOT_FOUND","message":"Note not found"}` | Not found or invalid `id` |
| `500` | `ApiError` (`INTERNAL_ERROR`) | Database error |

**Example:**
```
GET /api/notes/5
→ 200
{ "id": 5, "title": "Buy groceries", "body": "Milk, eggs, bread", "pinned": false, "created_at": "2026-06-17T12:00:00.000Z" }
```

---

#### `PUT /api/notes/[id]`

| Property | Value |
|----------|-------|
| Purpose | Update an existing note's fields |
| Auth | None |
| DB query | `UPDATE notes SET title=$1, body=$2, pinned=$3 WHERE id=$4 RETURNING *` |

**Path Parameters:**

| Param | Type | Required | Validation |
|-------|------|----------|------------|
| `id` | integer | Yes | Positive integer; non-integer → `404` |

**Request Body** (`Content-Type: application/json`):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | Non-empty after `.trim()` |
| `body` | string \| null | No | Any string or null |
| `pinned` | boolean | No | Boolean |

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| `200` | Updated `Note` object | Success |
| `400` | `{"error":"TITLE_REQUIRED","message":"Title is required"}` | `title` empty after trim |
| `400` | `{"error":"BAD_REQUEST","message":"Invalid request body"}` | Malformed JSON |
| `404` | `{"error":"NOTE_NOT_FOUND","message":"Note not found"}` | Not found or invalid `id` |
| `500` | `ApiError` (`INTERNAL_ERROR`) | Database error |

**Note:** `created_at` is never modified by a `PUT` operation.

**Example:**
```
PUT /api/notes/5
{ "title": "Buy groceries (updated)", "body": "Milk, eggs, bread, coffee", "pinned": true }
→ 200
{ "id": 5, "title": "Buy groceries (updated)", "body": "Milk, eggs, bread, coffee", "pinned": true, "created_at": "2026-06-17T12:00:00.000Z" }
```

---

#### `DELETE /api/notes/[id]`

| Property | Value |
|----------|-------|
| Purpose | Permanently delete a note |
| Auth | None |
| DB query | `DELETE FROM notes WHERE id = $1 RETURNING id` |

**Path Parameters:**

| Param | Type | Required | Validation |
|-------|------|----------|------------|
| `id` | integer | Yes | Positive integer; non-integer → `404` |

**Response:**

| Status | Body | Condition |
|--------|------|-----------|
| `204` | *(no body)* | Note deleted |
| `404` | `{"error":"NOTE_NOT_FOUND","message":"Note not found"}` | Not found or invalid `id` |
| `500` | `ApiError` (`INTERNAL_ERROR`) | Database error |

**Example:**
```
DELETE /api/notes/5
→ 204 (no body)
```

---

### 4.3 API Route File Layout

```
app/
└── api/
    ├── health/
    │   └── route.js           ← export async function GET()
    └── notes/
        ├── route.js           ← export async function GET(), POST()
        └── [id]/
            └── route.js       ← export async function GET(), PUT(), DELETE()
```

### 4.4 Error Catalog

| HTTP Status | Error Code | Trigger |
|-------------|------------|---------|
| `400` | `TITLE_REQUIRED` | `title` missing or empty after trim on `POST` or `PUT` |
| `400` | `BAD_REQUEST` | Malformed JSON body on `POST` or `PUT` |
| `404` | `NOTE_NOT_FOUND` | Note not found by id; or `id` is not a valid positive integer |
| `500` | `INTERNAL_ERROR` | Unhandled database error or unexpected exception |

---

## 5. Security Architecture

### 5.1 Authentication & Authorization

QuickNotes MVP has **no authentication**. It is a single-user personal application. All endpoints and pages are publicly accessible. Multi-user support and authentication are explicitly out of scope.

### 5.2 SQL Injection Prevention

All database queries use **parameterized queries** (`$1`, `$2`, etc.) via `node-postgres`. No user input is ever interpolated directly into SQL strings. This applies to all CRUD operations and the ILIKE search filter.

```js
// Correct — parameterized
await query('SELECT * FROM notes WHERE title ILIKE $1', [`%${q}%`]);

// NEVER do this — string interpolation (SQL injection risk)
// await pool.query(`SELECT * FROM notes WHERE title ILIKE '%${q}%'`);
```

### 5.3 Credential Management

- `DATABASE_URL` is read exclusively from `process.env` at runtime
- No credentials appear in source files, `next.config.mjs`, or any committed file
- `.env.local` is used for local development and must be in `.gitignore`
- Production credentials are injected via container/pod environment variables

### 5.4 Input Validation

| Input | Validation | Location |
|-------|-----------|----------|
| `title` (create/update) | Non-empty after `.trim()` | Client-side (before API call) + Server-side (API handler) |
| `id` (path param) | Parsed as positive integer; invalid → `404` | API handler |
| `pinned` | Coerced to boolean; defaults to `false` if absent | API handler |
| `body` | No restrictions; null and empty string both valid | API handler (no validation) |
| Search `q` | Passed as parameterized ILIKE value; not sanitized beyond parameterization | API handler |

### 5.5 Iframe Compatibility (Security Headers)

This is a **hard constraint**: the application must render inside a cross-origin iframe.

**Headers that MUST NOT be emitted:**

| Header | Value | Reason |
|--------|-------|--------|
| `X-Frame-Options` | `DENY` | Blocks all iframe embedding |
| `X-Frame-Options` | `SAMEORIGIN` | Blocks cross-origin iframe embedding |
| `Content-Security-Policy` | `frame-ancestors 'none'` | Equivalent to `X-Frame-Options: DENY` |
| `Content-Security-Policy` | `frame-ancestors 'self'` | Blocks cross-origin iframe embedding |

Next.js 14 does **not** emit `X-Frame-Options` by default. The `next.config.mjs` `headers()` function must not add any of the above. No middleware must add them.

### 5.6 Port Binding

The server must bind to `0.0.0.0:3000`, not `127.0.0.1:3000` or `localhost:3000`. The `next start` command defaults to `0.0.0.0` — this must not be overridden. The `PORT` environment variable defaults to `3000`.

---

## 6. Technology Stack

### 6.1 Core Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 14.x | App Router, RSC, Route Handlers, dev/build/start |
| Language | JavaScript (ES Modules) | ES2022+ | Application code (TypeScript optional for types only) |
| Runtime | Node.js | ≥ 18.x | Server runtime; required by Next.js 14 |
| Database | PostgreSQL | 14+ | Durable note storage; single-table schema |
| DB Client | `pg` (node-postgres) | 8.x | PostgreSQL driver; parameterized queries; `pg.Pool` for request handlers |
| Styling | CSS Modules | (built-in) | Scoped component styles; no runtime overhead |
| Config | `next.config.mjs` | ES Module | Next.js configuration; never `.ts` |

### 6.2 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `14.x` | Framework |
| `react` | `18.x` | UI library (RSC + Client Components) |
| `react-dom` | `18.x` | DOM rendering |
| `pg` | `^8.0` | PostgreSQL client |

**Intentionally absent:**

| Package | Reason excluded |
|---------|----------------|
| Tailwind CSS | Constraint: plain CSS / CSS Modules only |
| Prisma / Drizzle / any ORM | Overkill for single-table MVP; direct `pg` queries are simpler |
| NextAuth / any auth library | No authentication in MVP |
| styled-components / emotion | Constraint: no CSS-in-JS |
| Redis / any cache | No caching needed for < 1,000 notes |

### 6.3 Dev Dependencies

| Package | Purpose |
|---------|---------|
| `eslint` | Linting |
| `eslint-config-next` | Next.js ESLint rules |

---

## 7. Integration Points

### 7.1 PostgreSQL

QuickNotes has exactly one external integration: **PostgreSQL**.

| Property | Detail |
|----------|--------|
| Integration type | Direct TCP connection via `pg` driver |
| Connection config | `DATABASE_URL` environment variable (standard `postgresql://user:pass@host:port/db` format) |
| Alternative env vars | `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (supported by `pg` natively) |
| Connection pooling | `pg.Pool` with default pool size (10 connections); used by all request handlers |
| Migration connection | Short-lived `pg.Client` in `instrumentation.js`; connected, used, and closed before server starts |
| Error handling | Pool errors logged; migration failures cause `process.exit(1)` |
| Minimum PG version | 14+ (for `timestamptz`, `serial`, `ILIKE` — all supported since PG 9.x; 14 is a safe baseline) |

### 7.2 Container / Orchestration Platform

The application is designed to run in a containerized environment.

| Property | Detail |
|----------|--------|
| Port | `0.0.0.0:3000` (all interfaces) |
| Health check endpoint | `GET /api/health` → `200 {"status":"ok"}` (no DB query; pure liveness) |
| Environment injection | `DATABASE_URL` (required); `PORT` (optional, default `3000`) |
| Startup time | Target: ready within 10 seconds of process launch (per PRD NFR) |
| Graceful shutdown | Standard `SIGTERM` handling via Next.js / Node.js defaults |

### 7.3 Preview / iframe Host

The application is embedded in an iframe by an external preview host.

| Property | Detail |
|----------|--------|
| Embed URL | `http://host:3000` (or `https://` depending on host) |
| Frame compatibility | No `X-Frame-Options`; no `frame-ancestors` CSP restriction |
| Cross-origin | iframe may be cross-origin; no `postMessage` API required by this MVP |
| Cookie / storage | No session cookies; no `localStorage` dependency for core functionality |

### 7.4 No Other External Integrations

The QuickNotes MVP has no other external integrations. Specifically excluded:

- No email service
- No file storage (S3, GCS, etc.)
- No analytics or monitoring service
- No CDN (assets served directly by Next.js)
- No external authentication provider
- No AI/ML service

---

## Appendix A: Critical Constraints Summary

The following constraints are hard requirements that must be verified before deployment:

| # | Constraint | Verification |
|---|------------|-------------|
| 1 | Config file is `next.config.mjs` — never `next.config.ts` | `ls next.config.*` shows only `.mjs` or `.js` |
| 2 | No `X-Frame-Options` header on any response | `curl -I http://localhost:3000` — header absent |
| 3 | No `frame-ancestors 'none'` or `'self'` in CSP | `curl -I http://localhost:3000` — CSP absent or no frame-ancestors |
| 4 | Server binds to `0.0.0.0:3000` | `curl http://0.0.0.0:3000/api/health` → `200` |
| 5 | Auto-migration runs before first request | Fresh DB: `GET /api/notes` returns `[]` with no manual SQL |
| 6 | `DATABASE_URL` from environment only | `grep -r "postgresql://" src/` — no matches |
| 7 | Migration is idempotent | Restart server twice against same DB — no errors |

---

*TechArch generated: 2026-06-17 | Stack: Next.js 14 App Router + PostgreSQL | Single-user MVP*
