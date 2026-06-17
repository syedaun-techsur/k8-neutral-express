// app/page.js
import { query } from '../lib/db.js';
import Link from 'next/link';

export const metadata = { title: 'QuickNotes' };

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
    <>
      <header>
        <nav className="navbar">
          <a href="/" className="navLogo">QuickNotes</a>
          <a href="/notes/new" className="btnPrimary" aria-label="New note">+ New note</a>
        </nav>
      </header>
      <main>
        <div className="container" style={{ paddingTop: '16px' }}>

          {/* Search input */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="search"
              className="formLabel"
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                clip: 'rect(0,0,0,0)',
                whiteSpace: 'nowrap',
              }}
            >
              Search notes
            </label>
            <input
              id="search"
              name="q"
              type="search"
              className="formInput"
              placeholder="Search notes…"
              defaultValue={q}
              autoComplete="off"
            />
          </div>

          {/* DB error state */}
          {dbError && (
            <div className="errorBanner" role="alert">
              Could not load notes. Please try again.
            </div>
          )}

          {/* Empty state */}
          {!dbError && notes.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
              <p style={{ color: 'var(--color-muted)', marginBottom: '24px', fontSize: '1rem' }}>
                {q ? 'No notes match your search.' : 'No notes yet.'}
              </p>
              {!q && (
                <a href="/notes/new" className="btnPrimary">+ New note</a>
              )}
            </div>
          )}

          {/* Note list */}
          {!dbError && notes.length > 0 && (
            <div id="note-list">
              {pinnedNotes.length > 0 && (
                <>
                  {hasBothSections && <div className="sectionDivider">Pinned</div>}
                  {pinnedNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </>
              )}
              {unpinnedNotes.length > 0 && (
                <>
                  {hasBothSections && <div className="sectionDivider" style={{ marginTop: '16px' }}>Notes</div>}
                  {unpinnedNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Hidden empty search state for client-side filter */}
          {!dbError && notes.length > 0 && (
            <div
              id="empty-search"
              style={{ display: 'none', textAlign: 'center', paddingTop: '24px' }}
            >
              <p style={{ color: 'var(--color-muted)', fontSize: '1rem' }}>
                No notes match your search.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Client-side search filter script — keeps this file as Server Component */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var input = document.getElementById('search');
          if (!input) return;
          function doFilter() {
            var val = input.value.toLowerCase().trim();
            var cards = document.querySelectorAll('[data-note-id]');
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
      ` }} />
    </>
  );
}

function NoteCard({ note }) {
  return (
    <a
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
    >
      {note.pinned && (
        <span className="pinnedBadge" aria-label="Pinned">📌 Pinned</span>
      )}
      <div style={{
        fontWeight: 600,
        fontSize: '1rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginBottom: note.body ? '4px' : '0',
      }}>
        {note.title}
      </div>
      {note.body && (
        <div style={{
          color: 'var(--color-muted)',
          fontSize: '0.875rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '4px',
        }}>
          {note.body}
        </div>
      )}
      <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </a>
  );
}
