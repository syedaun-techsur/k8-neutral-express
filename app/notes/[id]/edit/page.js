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
      <>
        <title>Note not found — QuickNotes</title>
        <header>
          <nav className="navbar">
            <a href="/" className="navBack">← Home</a>
          </nav>
        </header>
        <main>
          <div className="container" style={{ paddingTop: '48px' }}>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Note not found.</h1>
            <p style={{ color: 'var(--color-muted)', marginBottom: '24px' }}>
              This note may have been deleted.
            </p>
            <a href="/" className="navBack">← Back to all notes</a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <title>Edit note — QuickNotes</title>
      <EditNoteClient note={note} />
    </>
  );
}
