# Functional Requirements Document — QuickNotes

**Project:** QuickNotes
**Acronym:** QN
**Version:** 1.0
**Date:** 2026-06-17
**Status:** Active
**Based on:** PRD-QuickNotes v1.0

---

## Scope

This FRD specifies the precise functional behaviour of every feature in the QuickNotes MVP. It is the authoritative reference for implementation: every input field, validation rule, HTTP status code, database column, and error state is defined here. The PRD defines *what* to build; this FRD defines *how* it behaves.

QuickNotes is a single-user, no-auth, mobile-first note-taking app. It has one data entity (`notes`), four CRUD operations, a health endpoint, a startup auto-migration, and a constrained deployment profile (iframe, port 3000, no frame-blocking headers).

---

## Conventions

- **Feature IDs** follow the PRD: `F0`–`F9`. In chunk filenames they are zero-padded (`F00`–`F09`).
- **HTTP methods** are written in ALL CAPS (`GET`, `POST`, `PUT`, `DELETE`).
- **Required fields** are marked `(required)`; optional fields `(optional)`.
- **Type notation:** `string`, `boolean`, `integer`, `timestamptz` match PostgreSQL / JSON types.
- **Error codes** are `SCREAMING_SNAKE_CASE` strings returned in JSON error bodies as `{ "error": "<code>", "message": "<human text>" }`.
- **"Non-empty"** means: after trimming leading/trailing whitespace, length ≥ 1 character.
- Cross-references use the form `see F03 §Process` or `see Y1-api.md §Notes`.

---

## Shared Terminology

| Term | Definition |
|------|-----------|
| **Note** | A single record in the `notes` table: title, optional body, pinned flag, creation timestamp |
| **Pinned** | Boolean flag; pinned notes sort above un-pinned notes in all list/search results |
| **Empty state** | The "No notes yet" UI shown when zero notes exist (or zero match a search) |
| **Auto-migration** | Idempotent `CREATE TABLE IF NOT EXISTS notes (...)` executed at server startup before requests are served |
| **Gold accent** | CSS colour `#FBCA5C` used sparingly (≤10% of any view's visual area) |
| **Near-black** | CSS colour `#0A0A0A` — primary text colour |
| **Mobile-first** | Styles target narrow viewports (≤375 px) first; wider viewports are enhanced via `min-width` media queries |
| **Tap target** | Minimum interactive-element hit area: 44 × 44 px |
| **DATABASE_URL** | Runtime environment variable providing the PostgreSQL connection string |
| **204** | HTTP 204 No Content — successful deletion response (no body) |
| **App Router** | Next.js 14 App Router (`app/` directory); not the Pages Router |

---

## Table of Contents

| Chunk | Feature | File |
|-------|---------|------|
| F00 | Note List View (`/`) | `F00-note-list-view.md` |
| F01 | Note Search / Filter | `F01-note-search-filter.md` |
| F02 | Create Note (`/notes/new`) | `F02-create-note.md` |
| F03 | Edit Note (`/notes/[id]/edit`) | `F03-edit-note.md` |
| F04 | Delete Note | `F04-delete-note.md` |
| F05 | REST API | `F05-rest-api.md` |
| F06 | Health Endpoint | `F06-health-endpoint.md` |
| F07 | Auto-Migration on Startup | `F07-auto-migration.md` |
| F08 | Mobile-First UI & Design System | `F08-mobile-first-ui.md` |
| F09 | Iframe Compatibility & Port Binding | `F09-iframe-compatibility.md` |
| Y0 | Database Schema (DDL) | `Y0-schema.md` |
| Y1 | API Endpoints (full spec) | `Y1-api.md` |
| Y2 | Cross-Feature Error Catalog | `Y2-errors.md` |
| Y3 | External Integration Points | `Y3-integrations.md` |

---
