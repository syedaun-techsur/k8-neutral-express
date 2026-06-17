# QuickNotes

## What This Is

QuickNotes is a personal, single-user, mobile-first web app for capturing and managing notes. Users can jot a note, find it later, edit it, or delete it. It is a focused MVP — one entity (notes), four operations (create, read, update, delete) — with no authentication, sharing, or AI features.

## Core Value

A user can write a note, find it again, and know it persists — every note stored durably in PostgreSQL, retrieved instantly, editable at any time.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] List all notes on `/` (newest first; pinned notes first); show empty state ("No notes yet") when none exist
- [ ] Search/filter notes by title from the list view via a search box
- [ ] Create a new note at `/notes/new` with title (required), body (optional), and pinned toggle
- [ ] Edit an existing note at `/notes/[id]/edit` — change title, body, or pinned status
- [ ] Delete a note from its edit page with a confirmation step
- [ ] Auto-migrate the `notes` table on startup (idempotent `CREATE TABLE IF NOT EXISTS`)
- [ ] Read database connection from runtime environment (no hard-coded credentials)
- [ ] Expose `GET /api/health` returning `200 {"status":"ok"}`
- [ ] REST API: `GET /api/notes`, `POST /api/notes`, `GET /api/notes/[id]`, `PUT /api/notes/[id]`, `DELETE /api/notes/[id]`
- [ ] Mobile-first UI: near-black `#0A0A0A` text, white surfaces, Gold `#FBCA5C` accent (≤10% of any view)
- [ ] App renders in an embedded preview iframe (no frame-blocking headers)
- [ ] Bind to `0.0.0.0:3000`

### Out of Scope

- Authentication / multi-user — MVP is single-user, no login required
- Sharing / collaboration — not in scope for MVP
- Tags, folders, attachments — keep to bare notes CRUD
- Import/export, pagination, AI — deferred entirely
- `next.config.ts` — Next 14 cannot read a TypeScript config; use `.mjs` or `.js`

## Context

- **Stack:** Next.js 14 (App Router) + PostgreSQL. Plain CSS / CSS Modules for styling.
- **Config file:** Must be `next.config.mjs` (or `.js`). Never `next.config.ts` — Next 14 hard-errors on it.
- **Frame headers:** Do NOT emit `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'/'self'` — the app must render inside an embedded preview iframe.
- **Port:** Bind to `0.0.0.0:3000`.
- **Migrations:** Run automatically before the server starts. No manual setup.
- **Data model:** Single `notes` table — `id` (serial PK), `title` (text not null), `body` (text nullable), `pinned` (boolean not null default false), `created_at` (timestamptz not null default now()).

## Constraints

- **Tech Stack:** Next.js 14 (App Router) + PostgreSQL — prescribed, no alternatives
- **Config format:** `next.config.mjs` or `.js` only — Next 14 cannot read `.ts` config
- **Frame headers:** No `X-Frame-Options: DENY` and no `frame-ancestors 'none'/'self'` CSP — blocks iframe preview
- **Port:** Must bind to `0.0.0.0:3000`
- **Migrations:** Must be automatic and idempotent — zero manual database setup
- **Credentials:** Must be read from environment/runtime config, never hard-coded
- **Styling:** Plain CSS or CSS Modules only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 14 App Router | Prescribed stack | — Pending |
| PostgreSQL for persistence | Prescribed; ensures data survives reloads | — Pending |
| `next.config.mjs` (not `.ts`) | Next 14 hard-errors on TypeScript config | — Pending |
| No frame-blocking headers | App must render inside embedded preview iframe | — Pending |
| Auto-migration on startup | Zero-manual-setup requirement from definition of done | — Pending |
| No authentication | Single-user MVP; auth adds complexity with no user value at this scope | — Pending |

---
*Last updated: 2026-06-17 after initialization*
