// app/api/notes/route.js
import { query } from '../../../lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    let result;
    if (q && q.trim().length > 0) {
      result = await query(
        'SELECT * FROM notes WHERE title ILIKE $1 ORDER BY pinned DESC, created_at DESC',
        ['%' + q.trim() + '%']
      );
    } else {
      result = await query(
        'SELECT * FROM notes ORDER BY pinned DESC, created_at DESC'
      );
    }
    return Response.json(result.rows, { status: 200 });
  } catch (err) {
    console.error('GET /api/notes error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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
      'INSERT INTO notes (title, body, pinned) VALUES ($1, $2, $3) RETURNING *',
      [title, noteBody, pinned]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/notes error:', err);
    return Response.json({ error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}
