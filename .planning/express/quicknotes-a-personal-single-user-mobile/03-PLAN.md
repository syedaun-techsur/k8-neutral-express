---
phase: quicknotes
plan: 03
type: execute
wave: 3
depends_on: [1, 2]
files_modified:
  - next.config.mjs
  - app/layout.js
  - app/globals.css
  - app/page.js
  - app/notes/new/page.js
  - app/notes/new/NoteForm.module.css
  - app/notes/[id]/edit/page.js
  - app/notes/[id]/edit/EditNoteClient.js
  - app/notes/[id]/edit/NoteForm.module.css
autonomous: true

features:
  implements: ["F0", "F1", "F2", "F3", "F4", "F8", "F9"]
  depends_on: ["F7", "F5", "F6"]
  enables: []

must_haves:
  truths:
    - "Navigating to / renders all notes sorted pinned-first, newest-first"
    - "Navigating to / with no notes shows 'No notes yet' text and a gold 'New note' button"
    - "Typing into the search input on / narrows the list in real time; clearing restores full list"
    - "Navigating to /notes/new shows a blank form with title auto-focused; submitting a valid note calls POST /api/notes and redirects to /"
    - "Submitting the create form with an empty title shows 'Title is required' inline without an API call"
    - "Navigating to /notes/[id]/edit shows a pre-filled form; saving calls PUT /api/notes/[id] and redirects to /"
    - "Tapping Delete on the edit page shows inline confirmation with the note title; confirming calls DELETE /api/notes/[id] and redirects to /"
    - "All interactive elements are >= 44x44 px; pages render single-column at 375 px with no horizontal scroll"
    - "HTTP responses contain no X-Frame-Options header; next.config.mjs exists (not .ts)"
    - "The dev server binds to 0.0.0.0:3000"
  artifacts:
    - path: "next.config.mjs"
      provides: "Next.js config — iframe-safe headers, 0.0.0.0 binding, ES Module format"
      contains: "headers"
    - path: "app/globals.css"
      provides: "Design system — colour tokens, base reset, focus ring, container"
      contains: "#FBCA5C"
    - path: "app/page.js"
      provides: "Note list view — sorted cards, search, empty state, error state"
      exports: ["default"]
    - path: "app/notes/new/page.js"
      provides: "Create note form — title/body/pinned, validation, POST, redirect"
      exports: ["default"]
    - path: "app/notes/[id]/edit/page.js"
      provides: "Edit note page — server fetch, pre-fill, PUT, inline delete, redirect"
      exports: ["default"]
  key_links:
    - from: "app/page.js"
      to: "GET /api/notes"
      via: "direct db query via query() (server component)"
      pattern: "query|SELECT.*FROM notes"
    - from: "app/notes/new/page.js"
      to: "POST /api/notes"
      via: "fetch('/api/notes', { method: 'POST' }) in client handler"
      pattern: "fetch.*api/notes.*POST"
    - from: "app/notes/[id]/edit/page.js"
      to: "GET /api/notes/[id]"
      via: "fetch in server component for pre-fill"
      pattern: "fetch.*api/notes"
    - from: "app/notes/[id]/edit/EditNoteClient.js"
      to: "PUT /api/notes/[id] and DELETE /api/notes/[id]"
      via: "fetch calls in client event handlers"
      pattern: "fetch.*api/notes.*PUT|DELETE"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "lib/db.js"
      exports: ["query"]
      verify: "grep -n 'export const query' lib/db.js && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "app/api/notes/route.js"
      exports: ["GET", "POST"]
      verify: "grep -n 'export async function GET' app/api/notes/route.js && grep -n 'export async function POST' app/api/notes/route.js && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "app/api/notes/[id]/route.js"
      exports: ["GET", "PUT", "DELETE"]
      verify: "grep -n 'export async function GET' 'app/api/notes/[id]/route.js' && grep -n 'export async function PUT' 'app/api/notes/[id]/route.js' && grep -n 'export async function DELETE' 'app/api/notes/[id]/route.js' && echo CONTRACT_OK"
  provides:
    - artifact: "next.config.mjs"
      exports: ["nextConfig"]
      shape: |
        ES Module; exports nextConfig with headers() returning [] (no X-Frame-Options);
        no next.config.ts present
      verify: "test -f next.config.mjs && ! test -f next.config.ts && grep -n 'export default' next.config.mjs && echo CONTRACT_OK"
    - artifact: "app/page.js"
      exports: ["default"]
      shape: |
        async Server Component; queries notes table directly or via fetch;
        renders note list with search input, note cards as <a> links, empty state
      verify: "grep -n 'export default' app/page.js && echo CONTRACT_OK"
    - artifact: "app/notes/new/page.js"
      exports: ["default"]
      shape: |
        'use client' component; renders create form with title/body/pinned;
        POSTs to /api/notes on submit; redirects to / on 201
      verify: "grep -n 'export default' app/notes/new/page.js && echo CONTRACT_OK"
    - artifact: "app/notes/[id]/edit/page.js"
      exports: ["default"]
      shape: |
        async Server Component; fetches note by id; renders EditNoteClient with
        pre-filled values or not-found state
      verify: "grep -n 'export default' 'app/notes/[id]/edit/page.js' && echo CONTRACT_OK"
---

<objective>
Build all three UI pages for QuickNotes — note list, create note, and edit+delete note — using Next.js 14 App Router with plain CSS Modules. Configure next.config.mjs for iframe compatibility, no frame-blocking headers, and 0.0.0.0:3000 port binding.

Purpose: This wave delivers the complete user-facing application. All pages consume the API endpoints from Wave 2 and follow the mobile-first design system specified in UX-Mockup-QuickNotes.md and UserStories-QuickNotes.md.
Output: next.config.mjs, app/layout.js, app/globals.css, app/page.js (list + search + empty state), app/notes/new/page.js (create form), app/notes/[id]/edit/page.js + EditNoteClient.js (edit + delete).
</objective>

<feature_dependencies>
Implements: F0: Note List View — sorted cards, pinned-first, empty state "No notes yet"; F1: Note Search/Filter — keystroke-reactive client-side title filter, ?q= URL persistence; F2: Create Note — blank form, title autofocus, POST /api/notes, redirect on 201; F3: Edit Note — pre-filled form, PUT /api/notes/[id], redirect on 200; F4: Delete Note — inline confirmation showing note title, DELETE /api/notes/[id], redirect on 204; F8: Mobile-First UI — #0A0A0A/#FFFFFF/#FBCA5C palette, 44px tap targets, CSS Modules, single-column 390px; F9: Iframe Compatibility — next.config.mjs (not .ts), no X-Frame-Options, 0.0.0.0:3000
Depends on: F7: Auto-Migration on Startup (lib/db.js + notes table — Wave 1); F5: REST API (all five endpoints — Wave 2); F6: Health Endpoint (server up — Wave 2)
Enables: None (wave 4 integration tests consume this wave's output)
</feature_dependencies>

<execution_context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/express/quicknotes-a-personal-single-user-mobile/WAVE-SCHEDULE.md
@.planning/express/quicknotes-a-personal-single-user-mobile/01-PLAN.md
@.planning/express/quicknotes-a-personal-single-user-mobile/02-PLAN.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

Key constraints (non-negotiable):
- next.config.mjs ONLY — NEVER next.config.ts (Next 14 hard-errors on TypeScript config)
- Do NOT emit X-Frame-Options header on any route — app must render in iframe
- Do NOT emit CSP frame-ancestors 'none' or 'self'
- Bind dev server to 0.0.0.0:3000 (package.json "dev" script)
- Nav links: Home (/) and New (/notes/new) only — no dead links
- Plain CSS / CSS Modules only — no Tailwind, no Bootstrap, no CSS-in-JS
- All files use .js extension (not .ts / .tsx)
- Design tokens: text #0A0A0A, surface #FFFFFF, accent #FBCA5C (<=10% of view), error #CC0000, muted #6B6B6B, divider #E5E5E5
- All interactive elements >= 44x44 px tap target
- Gold #FBCA5C used only on: Save/CTA button, pinned badge, focus ring — never Delete button
- Delete button uses outlined or grey-fill style (NOT gold)
- Inline delete confirmation (no window.confirm()) — button text changes to "Confirm delete ?" with Cancel link beside
- Search is keystroke-reactive (input event); no submit button; updates ?q= URL param via history.replaceState
- Empty state text: "No notes yet" (exact string per US-0.2); includes gold "New note" button
- Title input: autofocus on both create and edit pages
- Save button disables immediately on click (prevents double-submit)
- All <input> and <textarea> must have associated <label>
- Validation errors: aria-invalid="true" + role="alert" + #CC0000 text ("Title is required")
- Error banners: role="alert", #FFF0F0 background, 4px solid #CC0000 left border
- Note cards are <a> links to /notes/[id]/edit; entire card is tappable
- Pinned cards: gold #FBCA5C badge with "Pinned" text label (non-colour cue for accessibility)
- Body snippet on list: max 2 lines, ellipsis, #6B6B6B
- Not-found state on edit page: "Note not found." message + link back to /; no form rendered
- page <title> values: / → "QuickNotes", /notes/new → "New note — QuickNotes", /notes/[id]/edit → "Edit note — QuickNotes", not-found → "Note not found — QuickNotes"
</context>

<tasks>

<task type="auto">
  <name>Task 1: next.config.mjs + app/layout.js + app/globals.css — config and design system</name>
  <files>
    next.config.mjs
    app/layout.js
    app/globals.css
  </files>
  <action>
Create or overwrite three files that form the application foundation.

--- FILE 1: next.config.mjs (F9, SPEC-010) ---

CRITICAL: Must be .mjs (ES Module). NEVER create next.config.ts.

Requirements from TechArch F09:
- HTTP responses must NOT include X-Frame-Options on any route
- CSP must NOT include frame-ancestors 'none' or 'self'
- Config file is next.config.mjs in ES Module format
- Must expose experimental.instrumentationHook if Next.js version needs it

Also update package.json "dev" script to bind to 0.0.0.0:3000:
- Change `"dev": "next dev"` to `"dev": "next dev -H 0.0.0.0 -p 3000"`

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        // Apply to all routes — explicitly return empty array to avoid
        // Next.js injecting X-Frame-Options: SAMEORIGIN by default.
        // Do NOT add X-Frame-Options or frame-ancestors CSP here.
        source: '/(.*)',
        headers: [
          // Intentionally no X-Frame-Options header.
          // Intentionally no Content-Security-Policy with frame-ancestors.
          // App must render inside a cross-origin iframe (F9 / US-9.1).
        ],
      },
    ];
  },
};

export default nextConfig;
```

--- FILE 2: app/layout.js ---

Root layout for the Next.js 14 App Router. Wraps all pages. Imports globals.css.

```js
// app/layout.js
import './globals.css';

export const metadata = {
  title: 'QuickNotes',
  description: 'A personal, single-user, mobile-first notes app',
};

export default function RootLayout({ children }) {
  return (
    &lt;html lang="en"&gt;
      &lt;body&gt;
        {children}
      &lt;/body&gt;
    &lt;/html&gt;
  );
}
```

--- FILE 3: app/globals.css (F8, SPEC-013) ---

Design system. Mobile-first. Three colour tokens + error + muted + divider. No Tailwind, no framework.

```css
/* app/globals.css */

/* ── Reset ── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Design tokens (CSS custom properties) ── */
:root {
  --color-text:    #0A0A0A;
  --color-surface: #FFFFFF;
  --color-accent:  #FBCA5C;
  --color-error:   #CC0000;
  --color-muted:   #6B6B6B;
  --color-divider: #E5E5E5;
}

/* ── Base ── */
html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  color: var(--color-text);
  background: var(--color-surface);
  -webkit-text-size-adjust: 100%;
}

body {
  min-height: 100vh;
  background: var(--color-surface);
}

/* ── Focus ring (gold, all focusable elements) ── */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* ── Container ── */
.container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 2rem;
  }
}

/* ── Nav bar ── */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 1rem;
  border-bottom: 1px solid var(--color-divider);
  background: var(--color-surface);
  max-width: 600px;
  margin: 0 auto;
}

.navLogo {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;
}

.navBack {
  font-size: 0.875rem;
  color: var(--color-text);
  text-decoration: none;
  min-height: 44px;
  display: flex;
  align-items: center;
}

/* ── Gold CTA button ── */
.btnPrimary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0 16px;
  height: 44px;
  min-width: 88px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}

.btnPrimary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Delete button (secondary/outlined — NOT gold) ── */
.btnDelete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0 16px;
  height: 44px;
  border: 1px solid var(--color-text);
  border-radius: 4px;
  cursor: pointer;
}

.btnDelete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Error banner ── */
.errorBanner {
  background: #FFF0F0;
  border-left: 4px solid var(--color-error);
  color: var(--color-error);
  padding: 12px 16px;
  border-radius: 0 4px 4px 0;
  margin-bottom: 16px;
  font-size: 0.9rem;
}

/* ── Inline validation error ── */
.fieldError {
  color: var(--color-error);
  font-size: 0.8125rem;
  margin-top: 4px;
}

/* ── Form fields ── */
.formLabel {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--color-text);
}

.formInput,
.formTextarea {
  display: block;
  width: 100%;
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: 4px;
  padding: 10px 12px;
}

.formInput {
  height: 44px;
}

.formTextarea {
  min-height: 120px;
  resize: vertical;
}

.formInput:focus,
.formTextarea:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 0;
  border-color: transparent;
}

/* aria-invalid styling */
.formInput[aria-invalid="true"],
.formTextarea[aria-invalid="true"] {
  border-color: var(--color-error);
}

/* ── Checkbox row ── */
.checkboxRow {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 0;
  cursor: pointer;
}

.checkboxRow input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

/* ── Pinned badge ── */
.pinnedBadge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-accent);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
}

/* ── Section divider text ── */
.sectionDivider {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 0 4px;
  border-bottom: 1px solid var(--color-divider);
  margin-bottom: 8px;
}

/* ── Separator ── */
.separator {
  border: none;
  border-top: 1px solid var(--color-divider);
  margin: 24px 0;
}

/* ── Page title ── */
.pageTitle {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}
```
  </action>
  <verify>test -f next.config.mjs && ! test -f next.config.ts && grep -n 'export default' next.config.mjs && echo "CONFIG_MJS_OK" && grep -n 'X-Frame-Options' next.config.mjs | grep -v '#\|comment\|\/\/' | grep -q 'DENY\|SAMEORIGIN' && echo "XFRAME_DENY_FOUND_FAIL" || echo "NO_XFRAME_DENY_OK" && grep -n '#FBCA5C' app/globals.css && echo "ACCENT_TOKEN_OK" && grep -n 'btnPrimary' app/globals.css && echo "PRIMARY_BTN_OK" && grep -n 'btnDelete' app/globals.css && echo "DELETE_BTN_OK" && grep -n 'export default' app/layout.js && echo "LAYOUT_OK" && echo CONTRACT_OK</verify>
  <done>
- next.config.mjs exists at project root in ES Module format; next.config.ts does NOT exist
- next.config.mjs headers() returns an empty headers array for all routes — no X-Frame-Options, no frame-ancestors CSP
- package.json "dev" script uses `next dev -H 0.0.0.0 -p 3000`
- app/layout.js exports default RootLayout, imports globals.css
- app/globals.css defines all colour tokens (#FBCA5C, #0A0A0A, #FFFFFF, #CC0000, #6B6B6B, #E5E5E5), .btnPrimary (gold), .btnDelete (outlined, non-gold), .errorBanner, .formInput/.formTextarea with aria-invalid support, .pinnedBadge, focus ring via :focus-visible
  </done>
</task>

<task type="auto">
  <name>Task 2: app/page.js — Note list with search, pinned sections, empty state</name>
  <files>
    app/page.js
  </files>
  <action>
Create app/page.js as an async Server Component (no 'use client'). It queries the notes table directly via lib/db.js (SPEC-007 pattern), renders the note list, search input, and empty state. Search filtering is client-side via a small inline script to avoid a full page-level 'use client' that would prevent server rendering.

Requirements from UX-Mockup Screen 1 and UserStories US-0.1, US-0.2, US-1.1, US-1.2, US-8.1, US-8.3:

1. Read searchParams.q from the server (pre-populate search input with active filter value on load — US-1.1)
2. Query notes: if q present and non-empty use ILIKE filter, else fetch all; ORDER BY pinned DESC, created_at DESC
3. Render:
   - `<header>` with nav bar: "QuickNotes" logo link (href="/"), "+ New note" gold CTA link (href="/notes/new")
   - `<main>` with search input (id="search", name="q", type="search", label="Search notes" visually visible or sr-only)
   - If notes empty and no q: "No notes yet" empty state centered with gold "New note" button
   - If notes empty and q present: "No notes match your search"
   - If notes present: render cards sorted pinned-first (already sorted by query); show "Pinned" section divider if any pinned notes exist; show "Notes" divider if both sections non-empty
   - Each card: `<a href="/notes/[id]/edit">` block, data-title attribute for client-side filtering, title (font-weight 600, one line ellipsis), body snippet (max 2 lines, muted), created_at formatted date, pinned badge if pinned
4. Inline `<script>` tag for client-side search filtering (keystroke-reactive, ?q= URL persistence via history.replaceState). This keeps the page as a Server Component while enabling real-time search.

Page title: "QuickNotes"

```js
// app/page.js
import { query } from '../lib/db.js';
import Link from 'next/link';

export const metadata = { title: 'QuickNotes' };

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function HomePage({ searchParams }) {
  const q = searchParams?.q?.trim() || '';

  let notes = [];
  let dbError = false;
  try {
    let result;
    if (q) {
      result = await query(
        "SELECT * FROM notes WHERE title ILIKE $1 ORDER BY pinned DESC, created_at DESC",
        ['%' + q + '%']
      );
    } else {
      result = await query(
        "SELECT * FROM notes ORDER BY pinned DESC, created_at DESC"
      );
    }
    notes = result.rows;
  } catch (err) {
    console.error('HomePage DB error:', err);
    dbError = true;
  }

  const pinnedNotes = notes.filter(n => n.pinned);
  const unpinnedNotes = notes.filter(n => !n.pinned);
  const hasBothSections = pinnedNotes.length > 0 && unpinnedNotes.length > 0;

  return (
    &lt;&gt;
      &lt;header&gt;
        &lt;nav className="navbar"&gt;
          &lt;a href="/" className="navLogo"&gt;QuickNotes&lt;/a&gt;
          &lt;a href="/notes/new" className="btnPrimary" aria-label="New note"&gt;+ New note&lt;/a&gt;
        &lt;/nav&gt;
      &lt;/header&gt;
      &lt;main&gt;
        &lt;div className="container" style={{ paddingTop: '16px' }}&gt;

          {/* Search input */}
          &lt;div style={{ marginBottom: '16px' }}&gt;
            &lt;label htmlFor="search" className="formLabel" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}&gt;
              Search notes
            &lt;/label&gt;
            &lt;input
              id="search"
              name="q"
              type="search"
              className="formInput"
              placeholder="Search notes…"
              defaultValue={q}
              autoComplete="off"
            /&gt;
          &lt;/div&gt;

          {/* DB error state */}
          {dbError &amp;&amp; (
            &lt;div className="errorBanner" role="alert"&gt;
              Could not load notes. Please try again.
            &lt;/div&gt;
          )}

          {/* Empty state */}
          {!dbError &amp;&amp; notes.length === 0 &amp;&amp; (
            &lt;div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}&gt;
              &lt;p style={{ color: 'var(--color-muted)', marginBottom: '24px', fontSize: '1rem' }}&gt;
                {q ? 'No notes match your search.' : 'No notes yet.'}
              &lt;/p&gt;
              {!q &amp;&amp; (
                &lt;a href="/notes/new" className="btnPrimary"&gt;+ New note&lt;/a&gt;
              )}
            &lt;/div&gt;
          )}

          {/* Note list */}
          {!dbError &amp;&amp; notes.length &gt; 0 &amp;&amp; (
            &lt;div id="note-list"&gt;
              {pinnedNotes.length &gt; 0 &amp;&amp; (
                &lt;&gt;
                  {hasBothSections &amp;&amp; &lt;div className="sectionDivider"&gt;Pinned&lt;/div&gt;}
                  {pinnedNotes.map(note =&gt; (
                    &lt;NoteCard key={note.id} note={note} /&gt;
                  ))}
                &lt;/&gt;
              )}
              {unpinnedNotes.length &gt; 0 &amp;&amp; (
                &lt;&gt;
                  {hasBothSections &amp;&amp; &lt;div className="sectionDivider" style={{ marginTop: '16px' }}&gt;Notes&lt;/div&gt;}
                  {unpinnedNotes.map(note =&gt; (
                    &lt;NoteCard key={note.id} note={note} /&gt;
                  ))}
                &lt;/&gt;
              )}
            &lt;/div&gt;
          )}

        &lt;/div&gt;
      &lt;/main&gt;

      {/* Client-side search filter script — keeps this file as Server Component */}
      &lt;script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var input = document.getElementById('search');
          if (!input) return;
          function doFilter() {
            var val = input.value.toLowerCase().trim();
            var cards = document.querySelectorAll('[data-note-id]');
            var dividers = document.querySelectorAll('[data-divider]');
            var emptyState = document.getElementById('empty-search');
            var visibleCount = 0;
            cards.forEach(function(card) {
              var title = (card.getAttribute('data-title') || '').toLowerCase();
              if (!val || title.includes(val)) {
                card.style.display = '';
                visibleCount++;
              } else {
                card.style.display = 'none';
              }
            });
            // Update ?q= in URL
            var url = new URL(window.location.href);
            if (val) { url.searchParams.set('q', val); } else { url.searchParams.delete('q'); }
            window.history.replaceState(null, '', url.toString());
            // Show/hide empty search state
            if (emptyState) {
              emptyState.style.display = visibleCount === 0 ? '' : 'none';
            }
          }
          input.addEventListener('input', doFilter);
        })();
      ` }} /&gt;
    &lt;/&gt;
  );
}

function NoteCard({ note }) {
  return (
    &lt;a
      href={"/notes/" + note.id + "/edit"}
      data-note-id={note.id}
      data-title={note.title}
      style={{
        display: 'block',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-divider)',
        borderRadius: '4px',
        padding: '12px 16px',
        minHeight: '44px',
        marginBottom: '8px',
        textDecoration: 'none',
        color: 'var(--color-text)',
      }}
    &gt;
      {note.pinned &amp;&amp; (
        &lt;span className="pinnedBadge" aria-label="Pinned"&gt;📌 Pinned&lt;/span&gt;
      )}
      &lt;div style={{
        fontWeight: 600,
        fontSize: '1rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginBottom: note.body ? '4px' : '0',
      }}&gt;
        {note.title}
      &lt;/div&gt;
      {note.body &amp;&amp; (
        &lt;div style={{
          color: 'var(--color-muted)',
          fontSize: '0.875rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '4px',
        }}&gt;
          {note.body}
        &lt;/div&gt;
      )}
      &lt;div style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}&gt;
        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      &lt;/div&gt;
    &lt;/a&gt;
  );
}
```

Also add a hidden "no search results" element after the note list for the client-side script to show/hide:
- Add `<div id="empty-search" style={{ display: 'none', textAlign: 'center', paddingTop: '24px' }}>...No notes match your search.</div>` below the note list div.

IMPORTANT: Write the actual file with proper JSX (< > not &lt; &gt;). The pseudo-HTML above uses HTML entities only for documentation clarity. The actual .js file must have valid JSX syntax.
  </action>
  <verify>grep -n 'export default' app/page.js && echo "PAGE_DEFAULT_OK" && grep -n 'No notes yet' app/page.js && echo "EMPTY_STATE_OK" && grep -n 'search' app/page.js && echo "SEARCH_INPUT_OK" && grep -n 'pinnedBadge\|Pinned' app/page.js && echo "PINNED_BADGE_OK" && grep -n 'data-title' app/page.js && echo "DATA_TITLE_OK" && grep -n 'history.replaceState\|replaceState' app/page.js && echo "URL_PERSIST_OK" && echo CONTRACT_OK</verify>
  <done>
- app/page.js exists as an async Server Component (no 'use client' at top level)
- Queries notes table directly via lib/db.js query()
- Renders: navbar with "QuickNotes" home link and "+ New note" gold CTA link
- Search input with id="search", label "Search notes" (sr-only acceptable), defaultValue={q}
- Empty state: "No notes yet." text + gold "+ New note" link when no notes and no q
- Empty state: "No notes match your search." when q present and no results
- Note cards are <a> links to /notes/[id]/edit, each has data-title attribute for client-side filter
- Pinned cards show .pinnedBadge with "Pinned" text label
- Pinned / Notes section dividers rendered when both sections non-empty
- Inline client-side script: input event fires doFilter(), hides non-matching cards, updates ?q= URL via history.replaceState
- DB error state renders error banner with "Could not load notes. Please try again."
  </done>
</task>

<task type="auto">
  <name>Task 3: Create + Edit/Delete pages with CSS Modules</name>
  <files>
    app/notes/new/page.js
    app/notes/new/NoteForm.module.css
    app/notes/[id]/edit/page.js
    app/notes/[id]/edit/EditNoteClient.js
    app/notes/[id]/edit/NoteForm.module.css
  </files>
  <action>
Create four files implementing the Create Note page (F2) and the Edit+Delete Note page (F3, F4).

--- FILE 1: app/notes/new/NoteForm.module.css ---

Page-level CSS Module for the create/edit forms. Extends globals.css with form-specific layout.

```css
/* app/notes/new/NoteForm.module.css */
.page {
  min-height: 100vh;
  background: var(--color-surface);
}

.formSection {
  padding: 24px 0;
}

.fieldGroup {
  margin-bottom: 20px;
}

.submitRow {
  margin-top: 8px;
}

.submitBtn {
  composes: btnPrimary from global;
  width: 100%;
}

@media (min-width: 640px) {
  .submitBtn {
    width: auto;
    min-width: 120px;
  }
}
```

--- FILE 2: app/notes/new/page.js (F2, SPEC-008) ---

'use client' Client Component. Blank form with autofocus on title.

Requirements from UX-Mockup Screen 2, US-2.1, US-2.2, US-2.3, US-2.4:
- Nav: "← Home" link (href="/") left, "New note" page title center/right
- title: `<input type="text" id="title" name="title" autoFocus required>`
- body: `<textarea id="body" name="body">`
- pinned: `<input type="checkbox" id="pinned" name="pinned">` wrapped in label row
- Save button: gold, full-width on mobile, disables on click
- Client validation: if title.trim() === '' → add aria-invalid="true", show "Title is required" error, no API call, focus title
- On valid submit: POST /api/notes with { title, body, pinned: bool }; disable Save button immediately
- On 201: router.push('/') — use router from next/navigation
- On error: show error banner "Something went wrong. Please try again."; re-enable Save
- Page title: "New note — QuickNotes"

```js
// app/notes/new/page.js
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './NoteForm.module.css';

export const metadata = undefined; // metadata not supported in client components
// Page title set via document.title in useEffect or via a server wrapper if needed.
// Since this is a client component, use a <title> tag approach:

export default function NewNotePage() {
  const router = useRouter();
  const titleRef = useRef(null);
  const [titleError, setTitleError] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.title.value.trim();
    if (!title) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }
    setTitleError(false);
    setApiError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body: form.body.value,
          pinned: form.pinned.checked,
        }),
      });
      if (res.status === 201) {
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setApiError(data.message || 'Something went wrong. Please try again.');
        setSaving(false);
      }
    } catch {
      setApiError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    &lt;div className={styles.page}&gt;
      &lt;title&gt;New note — QuickNotes&lt;/title&gt;
      &lt;header&gt;
        &lt;nav className="navbar"&gt;
          &lt;a href="/" className="navBack"&gt;← Home&lt;/a&gt;
          &lt;span className="pageTitle"&gt;New note&lt;/span&gt;
        &lt;/nav&gt;
      &lt;/header&gt;
      &lt;main&gt;
        &lt;div className="container"&gt;
          &lt;div className={styles.formSection}&gt;
            {apiError &amp;&amp; (
              &lt;div className="errorBanner" role="alert"&gt;{apiError}&lt;/div&gt;
            )}
            &lt;form onSubmit={handleSubmit} noValidate&gt;
              &lt;div className={styles.fieldGroup}&gt;
                &lt;label htmlFor="title" className="formLabel"&gt;Title *&lt;/label&gt;
                &lt;input
                  ref={titleRef}
                  id="title"
                  name="title"
                  type="text"
                  className="formInput"
                  autoFocus
                  aria-invalid={titleError ? 'true' : 'false'}
                  aria-describedby={titleError ? 'title-error' : undefined}
                  onChange={() => { if (titleError) setTitleError(false); }}
                /&gt;
                {titleError &amp;&amp; (
                  &lt;p id="title-error" className="fieldError" role="alert"&gt;Title is required&lt;/p&gt;
                )}
              &lt;/div&gt;
              &lt;div className={styles.fieldGroup}&gt;
                &lt;label htmlFor="body" className="formLabel"&gt;Body&lt;/label&gt;
                &lt;textarea id="body" name="body" className="formTextarea" /&gt;
              &lt;/div&gt;
              &lt;div className={styles.fieldGroup}&gt;
                &lt;label className="checkboxRow"&gt;
                  &lt;input type="checkbox" id="pinned" name="pinned" /&gt;
                  Pin this note
                &lt;/label&gt;
              &lt;/div&gt;
              &lt;div className={styles.submitRow}&gt;
                &lt;button type="submit" className={styles.submitBtn} disabled={saving}&gt;
                  {saving ? 'Saving…' : 'Save'}
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/form&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/main&gt;
    &lt;/div&gt;
  );
}
```

--- FILE 3: app/notes/[id]/edit/NoteForm.module.css ---

Same structure as create form but includes delete button row.

```css
/* app/notes/[id]/edit/NoteForm.module.css */
.page {
  min-height: 100vh;
  background: var(--color-surface);
}

.formSection {
  padding: 24px 0;
}

.fieldGroup {
  margin-bottom: 20px;
}

.submitRow {
  margin-top: 8px;
}

.submitBtn {
  composes: btnPrimary from global;
  width: 100%;
}

.deleteRow {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.cancelLink {
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 10px 0;
  min-height: 44px;
  display: flex;
  align-items: center;
  text-decoration: underline;
}

@media (min-width: 640px) {
  .submitBtn {
    width: auto;
    min-width: 120px;
  }
}
```

--- FILE 4: app/notes/[id]/edit/page.js (F3, F4, SPEC-009) ---

Hybrid: async Server Component fetches the note, then renders EditNoteClient (client component) with pre-filled values.

Requirements from UX-Mockup Screen 3, US-3.1–3.4, US-4.1, US-4.2:
- Fetch note via fetch(`/api/notes/${id}`) in server component (or direct query() from lib/db.js)
- If id is non-integer or note returns 404: render not-found state ("Note not found." + back link to /)
- If found: render EditNoteClient with { note } prop
- Page title: "Edit note — QuickNotes" (or "Note not found — QuickNotes" for not-found state)

```js
// app/notes/[id]/edit/page.js
import EditNoteClient from './EditNoteClient.js';
import { query } from '../../../../lib/db.js';

export default async function EditNotePage({ params }) {
  const rawId = params.id;
  const id = parseInt(rawId, 10);
  const isValidId = Number.isInteger(id) && id > 0 && String(id) === String(rawId);

  let note = null;
  let fetchError = false;

  if (isValidId) {
    try {
      const result = await query('SELECT * FROM notes WHERE id = $1', [id]);
      note = result.rows[0] || null;
    } catch (err) {
      console.error('EditNotePage DB error:', err);
      fetchError = true;
    }
  }

  if (!isValidId || (!fetchError && note === null)) {
    return (
      &lt;&gt;
        &lt;title&gt;Note not found — QuickNotes&lt;/title&gt;
        &lt;header&gt;
          &lt;nav className="navbar"&gt;
            &lt;a href="/" className="navBack"&gt;← Home&lt;/a&gt;
          &lt;/nav&gt;
        &lt;/header&gt;
        &lt;main&gt;
          &lt;div className="container" style={{ paddingTop: '48px' }}&gt;
            &lt;h1 style={{ fontSize: '1.25rem', marginBottom: '12px' }}&gt;Note not found.&lt;/h1&gt;
            &lt;p style={{ color: 'var(--color-muted)', marginBottom: '24px' }}&gt;
              This note may have been deleted.
            &lt;/p&gt;
            &lt;a href="/" className="navBack"&gt;← Back to all notes&lt;/a&gt;
          &lt;/div&gt;
        &lt;/main&gt;
      &lt;/&gt;
    );
  }

  return (
    &lt;&gt;
      &lt;title&gt;Edit note — QuickNotes&lt;/title&gt;
      &lt;EditNoteClient note={note} /&gt;
    &lt;/&gt;
  );
}
```

--- FILE 5: app/notes/[id]/edit/EditNoteClient.js (F3, F4) ---

'use client'. Pre-filled form. PUT to save, DELETE with inline confirmation.

Requirements from UX-Mockup Screen 3 interactive elements, US-3.1–4.2:
- Pre-fill title, body, pinned from note prop
- Save: PUT /api/notes/[note.id] with {title, body, pinned}; disable Save on click; on 200 router.push('/')
- Delete confirmation: first click changes button text to "Confirm delete ?" and shows Cancel link beside it — no window.confirm()
- Confirm delete: DELETE /api/notes/[note.id]; on 204 router.push('/'); on 404 show specific error; on other error show generic error
- Cancel: revert delete button to original state; no API call
- Error banners for save failures and delete failures (role="alert", .errorBanner)
- aria-expanded on delete button when in confirming state

```js
// app/notes/[id]/edit/EditNoteClient.js
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './NoteForm.module.css';

export default function EditNoteClient({ note }) {
  const router = useRouter();
  const titleRef = useRef(null);
  const [titleError, setTitleError] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState('idle'); // 'idle' | 'confirming' | 'deleting'
  const [deleteError, setDeleteError] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.title.value.trim();
    if (!title) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }
    setTitleError(false);
    setApiError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/notes/' + note.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body: form.body.value,
          pinned: form.pinned.checked,
        }),
      });
      if (res.status === 200) {
        router.push('/');
      } else if (res.status === 404) {
        setApiError('Note not found. It may have been deleted.');
        setSaving(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setApiError(data.message || 'Something went wrong. Please try again.');
        setSaving(false);
      }
    } catch {
      setApiError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  async function handleDeleteClick() {
    if (deleteState === 'idle') {
      setDeleteState('confirming');
      setDeleteError(null);
    } else if (deleteState === 'confirming') {
      setDeleteState('deleting');
      try {
        const res = await fetch('/api/notes/' + note.id, { method: 'DELETE' });
        if (res.status === 204) {
          router.push('/');
        } else if (res.status === 404) {
          setDeleteError('Note not found. It may have already been deleted.');
          setDeleteState('idle');
        } else {
          setDeleteError('Could not delete note. Please try again.');
          setDeleteState('idle');
        }
      } catch {
        setDeleteError('Could not delete note. Please try again.');
        setDeleteState('idle');
      }
    }
  }

  function handleCancelDelete() {
    setDeleteState('idle');
    setDeleteError(null);
  }

  return (
    &lt;div className={styles.page}&gt;
      &lt;header&gt;
        &lt;nav className="navbar"&gt;
          &lt;a href="/" className="navBack"&gt;← Home&lt;/a&gt;
          &lt;span className="pageTitle"&gt;Edit note&lt;/span&gt;
        &lt;/nav&gt;
      &lt;/header&gt;
      &lt;main&gt;
        &lt;div className="container"&gt;
          &lt;div className={styles.formSection}&gt;
            {apiError &amp;&amp; (
              &lt;div className="errorBanner" role="alert"&gt;{apiError}&lt;/div&gt;
            )}
            {deleteError &amp;&amp; (
              &lt;div className="errorBanner" role="alert"&gt;
                {deleteError}
                {deleteError.includes('already been deleted') &amp;&amp; (
                  &lt;&gt; &lt;a href="/"&gt;Back to all notes&lt;/a&gt;&lt;/&gt;
                )}
              &lt;/div&gt;
            )}
            &lt;form onSubmit={handleSave} noValidate&gt;
              &lt;div className={styles.fieldGroup}&gt;
                &lt;label htmlFor="title" className="formLabel"&gt;Title *&lt;/label&gt;
                &lt;input
                  ref={titleRef}
                  id="title"
                  name="title"
                  type="text"
                  className="formInput"
                  defaultValue={note.title}
                  autoFocus
                  aria-invalid={titleError ? 'true' : 'false'}
                  aria-describedby={titleError ? 'title-error' : undefined}
                  onChange={() => { if (titleError) setTitleError(false); }}
                /&gt;
                {titleError &amp;&amp; (
                  &lt;p id="title-error" className="fieldError" role="alert"&gt;Title is required&lt;/p&gt;
                )}
              &lt;/div&gt;
              &lt;div className={styles.fieldGroup}&gt;
                &lt;label htmlFor="body" className="formLabel"&gt;Body&lt;/label&gt;
                &lt;textarea
                  id="body"
                  name="body"
                  className="formTextarea"
                  defaultValue={note.body || ''}
                /&gt;
              &lt;/div&gt;
              &lt;div className={styles.fieldGroup}&gt;
                &lt;label className="checkboxRow"&gt;
                  &lt;input
                    type="checkbox"
                    id="pinned"
                    name="pinned"
                    defaultChecked={note.pinned}
                  /&gt;
                  Pin this note
                &lt;/label&gt;
              &lt;/div&gt;
              &lt;div className={styles.submitRow}&gt;
                &lt;button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={saving || deleteState === 'deleting'}
                &gt;
                  {saving ? 'Saving…' : 'Save'}
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/form&gt;

            &lt;hr className="separator" /&gt;

            &lt;div className={styles.deleteRow}&gt;
              &lt;button
                type="button"
                className="btnDelete"
                onClick={handleDeleteClick}
                disabled={deleteState === 'deleting' || saving}
                aria-expanded={deleteState === 'confirming' ? 'true' : 'false'}
                aria-label={
                  deleteState === 'confirming'
                    ? 'Confirm delete — this cannot be undone'
                    : 'Delete note'
                }
              &gt;
                {deleteState === 'idle' &amp;&amp; 'Delete note'}
                {deleteState === 'confirming' &amp;&amp; 'Confirm delete ?'}
                {deleteState === 'deleting' &amp;&amp; 'Deleting…'}
              &lt;/button&gt;
              {deleteState === 'confirming' &amp;&amp; (
                &lt;button
                  type="button"
                  className={styles.cancelLink}
                  onClick={handleCancelDelete}
                &gt;
                  Cancel
                &lt;/button&gt;
              )}
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/main&gt;
    &lt;/div&gt;
  );
}
```

IMPORTANT: Write all five files with proper JSX syntax (< > not &lt; &gt;). The pseudo-HTML entities above are documentation artifacts only. The actual .js files must have valid JSX.
  </action>
  <verify>grep -n 'export default' app/notes/new/page.js && echo "CREATE_PAGE_OK" && grep -n 'use client' app/notes/new/page.js && echo "CREATE_CLIENT_OK" && grep -n 'Title is required' app/notes/new/page.js && echo "CREATE_VALIDATION_OK" && grep -n 'POST' app/notes/new/page.js && echo "CREATE_POST_OK" && grep -n 'export default' 'app/notes/[id]/edit/page.js' && echo "EDIT_PAGE_OK" && grep -n 'Note not found' 'app/notes/[id]/edit/page.js' && echo "EDIT_NOTFOUND_OK" && grep -n 'use client' 'app/notes/[id]/edit/EditNoteClient.js' && echo "EDIT_CLIENT_OK" && grep -n 'Confirm delete' 'app/notes/[id]/edit/EditNoteClient.js' && echo "DELETE_CONFIRM_OK" && grep -n 'DELETE' 'app/notes/[id]/edit/EditNoteClient.js' && echo "DELETE_API_OK" && grep -n 'aria-expanded' 'app/notes/[id]/edit/EditNoteClient.js' && echo "ARIA_EXPANDED_OK" && echo CONTRACT_OK</verify>
  <done>
- app/notes/new/page.js: 'use client', exports default NewNotePage; blank form with title (autoFocus), body textarea, pinned checkbox; client-validates title (shows "Title is required" with aria-invalid); POSTs to /api/notes; disables Save on submit; navigates to / on 201; shows error banner on failure
- app/notes/new/NoteForm.module.css: form layout, full-width .submitBtn on mobile
- app/notes/[id]/edit/page.js: async Server Component; fetches note via lib/db.js query(); renders not-found state for non-integer id or missing note; renders EditNoteClient with pre-filled note prop
- app/notes/[id]/edit/EditNoteClient.js: 'use client'; pre-fills title/body/pinned from note prop; PUT on save; inline delete confirmation (no window.confirm()) — first click → "Confirm delete ?" + Cancel link; second click → DELETE /api/notes/[id]; aria-expanded on delete button; specific error messages for 404 vs 500; Cancel reverts to idle state
- app/notes/[id]/edit/NoteForm.module.css: form layout, delete row with gap, .cancelLink with min-height 44px
  </done>
</task>

</tasks>

<verification>
After all tasks complete, run these checks to confirm Wave 3 integration contracts are satisfied:

```bash
# F9: next.config.mjs exists, next.config.ts does not
test -f next.config.mjs && echo "CONFIG_MJS_EXISTS_OK"
! test -f next.config.ts && echo "NO_CONFIG_TS_OK"
grep -n 'export default' next.config.mjs && echo "CONFIG_EXPORT_OK"

# F9: No X-Frame-Options DENY/SAMEORIGIN in config headers
grep -n 'X-Frame-Options' next.config.mjs | grep -i 'DENY\|SAMEORIGIN' && echo "XFRAME_FOUND_FAIL" || echo "NO_XFRAME_OK"

# F8: Design tokens present in globals.css
grep -n '#FBCA5C' app/globals.css && echo "ACCENT_TOKEN_OK"
grep -n '#CC0000' app/globals.css && echo "ERROR_TOKEN_OK"
grep -n 'btnDelete' app/globals.css && echo "DELETE_BTN_STYLE_OK"

# F0: List page exports default
grep -n 'export default' app/page.js && echo "LIST_PAGE_OK"

# F0/F2: Empty state "No notes yet"
grep -n 'No notes yet' app/page.js && echo "EMPTY_STATE_OK"

# F1: Search input on list page
grep -n 'history.replaceState\|replaceState' app/page.js && echo "SEARCH_URL_PERSIST_OK"

# F2: Create page exists and is client component
grep -n 'use client' app/notes/new/page.js && echo "CREATE_CLIENT_OK"
grep -n 'Title is required' app/notes/new/page.js && echo "CREATE_VALIDATION_OK"

# F3/F4: Edit page and client component exist
grep -n 'export default' 'app/notes/[id]/edit/page.js' && echo "EDIT_PAGE_OK"
grep -n 'use client' 'app/notes/[id]/edit/EditNoteClient.js' && echo "EDIT_CLIENT_OK"

# F4: Inline delete confirmation (no window.confirm)
grep -n 'Confirm delete' 'app/notes/[id]/edit/EditNoteClient.js' && echo "DELETE_CONFIRM_OK"
grep -n 'window.confirm' 'app/notes/[id]/edit/EditNoteClient.js' && echo "WINDOW_CONFIRM_FAIL" || echo "NO_WINDOW_CONFIRM_OK"

# Wave 2 contract consumption: pages call API endpoints
grep -n '/api/notes' app/notes/new/page.js && echo "NEW_CALLS_API_OK"
grep -n '/api/notes' 'app/notes/[id]/edit/EditNoteClient.js' && echo "EDIT_CALLS_API_OK"
```
</verification>

<success_criteria>
- next.config.mjs exists in ES Module format; next.config.ts does NOT exist; headers() returns empty array (no X-Frame-Options, no frame-ancestors CSP)
- package.json "dev" script binds to 0.0.0.0 on port 3000
- app/globals.css defines all colour tokens, .btnPrimary (gold), .btnDelete (non-gold outlined), .errorBanner, .pinnedBadge, focus ring via :focus-visible, .formInput/.formTextarea with aria-invalid styling
- app/page.js (server component): queries notes, renders sorted list (pinned-first), search input with client-side filter + ?q= URL persistence, "No notes yet" empty state, "No notes match your search" filtered empty state, error state
- app/notes/new/page.js (client component): blank form, title autoFocus, client-side validation ("Title is required"), POST /api/notes, Save disables on submit, error banner on API failure, redirects to / on 201
- app/notes/[id]/edit/page.js (server component): fetches note, not-found state for invalid/missing id, passes note to EditNoteClient
- app/notes/[id]/edit/EditNoteClient.js (client component): pre-filled form, PUT on save, inline delete confirmation (no window.confirm()), aria-expanded on delete button, specific error messages for 404/500 delete failures, Cancel reverts state
- All interactive elements use HTML semantics with labels; aria-invalid + role="alert" on validation errors; aria-expanded on delete confirm button
- No Tailwind, no Bootstrap, no CSS-in-JS — plain CSS / CSS Modules only
- Nav: Home (/) and New (/notes/new) only — no dead links
</success_criteria>

<output>
After completion, create `.planning/express/quicknotes-a-personal-single-user-mobile/03-SUMMARY.md` summarizing:
- Files created: next.config.mjs, app/layout.js, app/globals.css, app/page.js, app/notes/new/page.js, app/notes/new/NoteForm.module.css, app/notes/[id]/edit/page.js, app/notes/[id]/edit/EditNoteClient.js, app/notes/[id]/edit/NoteForm.module.css
- Key decisions: Server Component for list (direct db query) + inline script for client-side search; hybrid server+client for edit page; inline delete confirmation without window.confirm(); next.config.mjs headers() returns empty array to avoid any frame-blocking
- Integration contracts delivered: next.config.mjs (iframe-safe), app/page.js, app/notes/new/page.js, app/notes/[id]/edit/page.js
- Any deviations from spec (flag, do not silently diverge)
</output>
