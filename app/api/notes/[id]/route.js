// app/api/notes/[id]/route.js
import { query } from '../../../../lib/db.js';

function parseId(rawId) {
  const id = parseInt(rawId, 10);
  if (!Number.isInteger(id) || id <= 0 || String(id) !== String(rawId)) {
    return null;
  }
  return id;
}

export async function GET(request, { params }) {
  const id = parseId(params.id);
  if (id === null) {
    return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
  }
  try {
    const result = await query('SELECT * FROM notes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
    }
    return Response.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error('GET /api/notes/[id] error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const id = parseId(params.id);
  if (id === null) {
    return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
  }
  try {
    // Check note exists
    const existing = await query('SELECT id FROM notes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
    }
    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'BAD_REQUEST', message: 'Invalid request body' }, { status: 400 });
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return Response.json({ error: 'TITLE_REQUIRED', message: 'Title is required' }, { status: 400 });
    }
    const noteBody = typeof body.body === 'string' ? body.body : null;
    const pinned = Boolean(body.pinned ?? false);
    const result = await query(
      'UPDATE notes SET title = $1, body = $2, pinned = $3 WHERE id = $4 RETURNING *',
      [title, noteBody, pinned, id]
    );
    return Response.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error('PUT /api/notes/[id] error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const id = parseId(params.id);
  if (id === null) {
    return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
  }
  try {
    const result = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'NOTE_NOT_FOUND', message: 'Note not found' }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/notes/[id] error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}
