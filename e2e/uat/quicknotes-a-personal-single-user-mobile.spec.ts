import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper: create a note via API and return the created note
async function createNoteViaAPI(title: string, body: string = '', pinned: boolean = false) {
  const res = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, pinned }),
  });
  if (!res.ok) throw new Error(`Failed to create note: ${res.status}`);
  return res.json();
}

// Helper: delete a note via API
async function deleteNoteViaAPI(id: number) {
  await fetch(`${BASE_URL}/api/notes/${id}`, { method: 'DELETE' });
}

// Helper: get all notes via API
async function getAllNotesViaAPI() {
  const res = await fetch(`${BASE_URL}/api/notes`);
  return res.json();
}

// Helper: clean all notes
async function cleanAllNotes() {
  const notes = await getAllNotesViaAPI();
  for (const note of notes) {
    await deleteNoteViaAPI(note.id);
  }
}

// ---------------------------------------------------------------------------
// Epic 0: Note List View
// ---------------------------------------------------------------------------

test.describe('US-0.1: View the Note List', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('Test Note Alpha', 'Some body text');
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('navigating to / renders a list of all notes', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-note-id]')).toHaveCount(1);
  });

  test('each note entry displays its title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Test Note Alpha')).toBeVisible();
  });

  test('pinned notes display a pinned indicator', async ({ page }) => {
    await cleanAllNotes();
    await createNoteViaAPI('Pinned Note', 'body', true);
    await page.goto('/');
    await expect(page.locator('.pinnedBadge').first()).toBeVisible();
  });

  test('each note card is a tappable link to /notes/[id]/edit', async ({ page }) => {
    await page.goto('/');
    const link = page.locator(`[data-note-id="${noteId}"]`);
    await expect(link).toHaveAttribute('href', `/notes/${noteId}/edit`);
  });

  test('"New note" button is always visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/notes/new"]').first()).toBeVisible();
  });
});

test.describe('US-0.2: Empty State When No Notes Exist', () => {
  test.beforeEach(async () => {
    await cleanAllNotes();
  });

  test('renders "No notes yet." when no notes exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/No notes yet/i)).toBeVisible();
  });

  test('empty state includes a "New note" link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/notes/new"]').first()).toBeVisible();
  });

  test('no note cards rendered in empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-note-id]')).toHaveCount(0);
  });
});

test.describe('US-0.3: Newly Created Note Appears at Top of List', () => {
  test.beforeEach(async () => {
    await cleanAllNotes();
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('after creating a note, browser redirects to / and note is visible', async ({ page }) => {
    await page.goto('/notes/new');
    await page.locator('#title').fill('Groceries');
    await page.locator('#body').fill('milk, eggs');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Groceries')).toBeVisible();
  });
});

test.describe('US-0.4: Updated Note Title Reflected in List', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('Original Title');
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('after editing, list shows updated title', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await page.locator('#title').fill('Updated Title');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Updated Title')).toBeVisible();
    await expect(page.getByText('Original Title')).not.toBeVisible();
  });
});

test.describe('US-0.5: Deleted Note No Longer Appears in List', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('Note to Delete');
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('after deleting, note no longer appears in list', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await page.locator('.btnDelete').click();
    // Confirm delete
    await page.locator('.btnDelete').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Note to Delete')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Epic 1: Note Search / Filter
// ---------------------------------------------------------------------------

test.describe('US-1.1: Filter Notes by Partial Title', () => {
  test.beforeEach(async () => {
    await cleanAllNotes();
    await createNoteViaAPI('Shopping list', 'milk eggs');
    await createNoteViaAPI('Meeting notes', 'agenda items');
    await createNoteViaAPI('Shopping reminder', 'dont forget');
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('search input is rendered on list view', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#search')).toBeVisible();
  });

  test('typing partial title narrows the list', async ({ page }) => {
    await page.goto('/');
    await page.locator('#search').fill('Shopping');
    // Wait for filter to apply
    await page.waitForTimeout(300);
    // Meeting notes should be hidden
    const meetingCard = page.locator('[data-title="Meeting notes"]');
    await expect(meetingCard).toHaveCSS('display', 'none');
  });

  test('clearing search restores full list', async ({ page }) => {
    await page.goto('/');
    await page.locator('#search').fill('Shopping');
    await page.waitForTimeout(300);
    await page.locator('#search').fill('');
    await page.waitForTimeout(300);
    // All 3 notes should be visible
    await expect(page.locator('[data-note-id]')).toHaveCount(3);
  });
});

test.describe('US-1.2: Empty State When Search Matches Nothing', () => {
  test.beforeEach(async () => {
    await cleanAllNotes();
    await createNoteViaAPI('My first note');
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('no-match search shows empty state message', async ({ page }) => {
    await page.goto('/');
    await page.locator('#search').fill('xyznonexistent999');
    await page.waitForTimeout(300);
    await expect(page.locator('#empty-search')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Epic 2: Create Note
// ---------------------------------------------------------------------------

test.describe('US-2.1: Create a New Note with Title and Body', () => {
  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('/notes/new renders a blank form with title, body, pinned, and submit', async ({ page }) => {
    await page.goto('/notes/new');
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#body')).toBeVisible();
    await expect(page.locator('#pinned')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('title input receives focus automatically on page load', async ({ page }) => {
    await page.goto('/notes/new');
    await expect(page.locator('#title')).toBeFocused();
  });

  test('filling and submitting creates note and redirects to /', async ({ page }) => {
    await page.goto('/notes/new');
    await page.locator('#title').fill('Groceries');
    await page.locator('#body').fill('milk, eggs');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Groceries')).toBeVisible();
  });

  test('"New note" link navigates to /notes/new', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/notes/new"]').first().click();
    await expect(page).toHaveURL('/notes/new');
  });
});

test.describe('US-2.2: Create a Pinned Note', () => {
  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('checking pinned and submitting shows pinned note at top with indicator', async ({ page }) => {
    await createNoteViaAPI('Regular Note', '', false);
    await page.goto('/notes/new');
    await page.locator('#title').fill('Pinned Note');
    await page.locator('#pinned').check();
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.pinnedBadge').first()).toBeVisible();
  });
});

test.describe('US-2.3: Block Submission When Title Is Empty', () => {
  test('shows validation error when title is empty', async ({ page }) => {
    await page.goto('/notes/new');
    await page.locator('#body').fill('some body text');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#title-error')).toBeVisible();
    await expect(page.locator('#title-error')).toContainText('Title is required');
  });

  test('form stays on page after failed validation', async ({ page }) => {
    await page.goto('/notes/new');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/notes/new');
  });

  test('entering valid title and resubmitting proceeds normally', async ({ page }) => {
    await page.goto('/notes/new');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#title-error')).toBeVisible();
    await page.locator('#title').fill('Valid Title');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
    await cleanAllNotes();
  });
});

// ---------------------------------------------------------------------------
// Epic 3: Edit Note
// ---------------------------------------------------------------------------

test.describe('US-3.1: Open a Note and See Its Current Values Pre-filled', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('My Note', 'My body', true);
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('clicking note card navigates to /notes/[id]/edit', async ({ page }) => {
    await page.goto('/');
    await page.locator(`[data-note-id="${noteId}"]`).click();
    await expect(page).toHaveURL(`/notes/${noteId}/edit`);
  });

  test('title input is pre-filled with note title', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await expect(page.locator('#title')).toHaveValue('My Note');
  });

  test('body textarea is pre-filled with note body', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await expect(page.locator('#body')).toHaveValue('My body');
  });

  test('pinned checkbox is checked for pinned note', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await expect(page.locator('#pinned')).toBeChecked();
  });
});

test.describe('US-3.2: Save an Edited Note and See Updated Title in List', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('Old Title');
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('saving edit redirects to / with updated title visible', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await page.locator('#title').fill('New Title');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('New Title')).toBeVisible();
  });
});

test.describe('US-3.3: Toggle Pinned Status on Existing Note', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('Toggle Note', '', false);
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('pinning a note and saving shows it in pinned section', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await page.locator('#pinned').check();
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.pinnedBadge')).toBeVisible();
  });
});

test.describe('US-3.4: Not-Found State for Missing Note', () => {
  test('navigating to non-existent note shows not-found message', async ({ page }) => {
    await page.goto('/notes/999999/edit');
    await expect(page.getByText(/Note not found/i)).toBeVisible();
  });

  test('not-found page provides link back to /', async ({ page }) => {
    await page.goto('/notes/999999/edit');
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('non-integer id segment triggers not-found', async ({ page }) => {
    await page.goto('/notes/abc/edit');
    await expect(page.getByText(/Note not found/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Epic 4: Delete Note
// ---------------------------------------------------------------------------

test.describe('US-4.1: Delete a Note with Confirmation', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('Note to Delete');
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('"Delete" button is visible on edit page', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await expect(page.locator('.btnDelete')).toBeVisible();
  });

  test('clicking Delete shows confirmation step', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await page.locator('.btnDelete').click();
    await expect(page.locator('.btnDelete')).toContainText('Confirm delete');
  });

  test('confirming delete calls DELETE API and redirects to /', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await page.locator('.btnDelete').click(); // First click → confirm
    await page.locator('.btnDelete').click(); // Second click → execute delete
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Note to Delete')).not.toBeVisible();
  });

  test('cancelling confirmation returns form to normal state', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await page.locator('.btnDelete').click(); // First click → confirm
    await page.locator('button.cancelLink, button:text("Cancel")').click();
    await expect(page.locator('.btnDelete')).toContainText('Delete note');
  });
});

// ---------------------------------------------------------------------------
// Epic 5: REST API
// ---------------------------------------------------------------------------

test.describe('US-5.1: Retrieve All Notes via API', () => {
  test.beforeEach(async () => {
    await cleanAllNotes();
    await createNoteViaAPI('API Test Note', 'body text', false);
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('GET /api/notes returns 200 with JSON array', async ({ request }) => {
    const res = await request.get('/api/notes');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('each note object has required fields', async ({ request }) => {
    const res = await request.get('/api/notes');
    const notes = await res.json();
    expect(notes.length).toBeGreaterThan(0);
    const note = notes[0];
    expect(note).toHaveProperty('id');
    expect(note).toHaveProperty('title');
    expect(note).toHaveProperty('body');
    expect(note).toHaveProperty('pinned');
    expect(note).toHaveProperty('created_at');
  });

  test('GET /api/notes?q=<string> filters by title', async ({ request }) => {
    await createNoteViaAPI('Filtered Note', 'body');
    const res = await request.get('/api/notes?q=Filtered');
    const notes = await res.json();
    expect(notes.every((n: any) => n.title.toLowerCase().includes('filtered'))).toBe(true);
    await cleanAllNotes();
  });
});

test.describe('US-5.2: Create a Note via API', () => {
  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('POST /api/notes with valid body returns 201 with created note', async ({ request }) => {
    const res = await request.post('/api/notes', {
      data: { title: 'API Note', body: 'body', pinned: false },
    });
    expect(res.status()).toBe(201);
    const note = await res.json();
    expect(note.id).toBeDefined();
    expect(note.title).toBe('API Note');
    expect(note.created_at).toBeDefined();
  });

  test('POST /api/notes with missing title returns 400', async ({ request }) => {
    const res = await request.post('/api/notes', {
      data: { body: 'no title' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('TITLE_REQUIRED');
  });

  test('POST /api/notes with malformed JSON returns 400', async ({ request }) => {
    const res = await request.post('/api/notes', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not valid json',
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('US-5.3: Fetch, Update, and Delete a Single Note via API', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('Single Note API', 'body');
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('GET /api/notes/[id] returns 200 with note', async ({ request }) => {
    const res = await request.get(`/api/notes/${noteId}`);
    expect(res.status()).toBe(200);
    const note = await res.json();
    expect(note.id).toBe(noteId);
  });

  test('GET /api/notes/[id] for non-existent id returns 404', async ({ request }) => {
    const res = await request.get('/api/notes/999999');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('NOTE_NOT_FOUND');
  });

  test('PUT /api/notes/[id] with valid body returns 200 with updated note', async ({ request }) => {
    const res = await request.put(`/api/notes/${noteId}`, {
      data: { title: 'Updated', body: 'new body', pinned: true },
    });
    expect(res.status()).toBe(200);
    const note = await res.json();
    expect(note.title).toBe('Updated');
    expect(note.pinned).toBe(true);
  });

  test('PUT /api/notes/[id] with empty title returns 400', async ({ request }) => {
    const res = await request.put(`/api/notes/${noteId}`, {
      data: { title: '', body: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('DELETE /api/notes/[id] returns 204', async ({ request }) => {
    const res = await request.delete(`/api/notes/${noteId}`);
    expect(res.status()).toBe(204);
  });

  test('DELETE /api/notes/[id] for non-existent id returns 404', async ({ request }) => {
    const res = await request.delete('/api/notes/999999');
    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Epic 6: Health Endpoint
// ---------------------------------------------------------------------------

test.describe('US-6.1: Confirm App Liveness via Health Endpoint', () => {
  test('GET /api/health returns 200 with {"status":"ok"}', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });

  test('POST /api/health returns 405 Method Not Allowed', async ({ request }) => {
    const res = await request.post('/api/health', { data: {} });
    expect(res.status()).toBe(405);
  });
});

// ---------------------------------------------------------------------------
// Epic 7: Auto-Migration on Startup
// ---------------------------------------------------------------------------

test.describe('US-7.1: Notes Table Created Automatically on First Start', () => {
  test('GET /api/health returns 200 after startup (table exists)', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
  });

  test('CRUD operations work (table schema is correct)', async ({ request }) => {
    const createRes = await request.post('/api/notes', {
      data: { title: 'Schema Test', body: null, pinned: false },
    });
    expect(createRes.status()).toBe(201);
    const note = await createRes.json();
    expect(note).toHaveProperty('id');
    expect(note).toHaveProperty('title', 'Schema Test');
    expect(note).toHaveProperty('pinned', false);
    expect(note).toHaveProperty('created_at');
    await deleteNoteViaAPI(note.id);
  });
});

test.describe('US-7.2: Data Survives a Server Restart', () => {
  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('note created via API is retrievable (persistence check)', async ({ request }) => {
    const createRes = await request.post('/api/notes', {
      data: { title: 'Persistence Check', body: 'still here', pinned: false },
    });
    const note = await createRes.json();
    const getRes = await request.get(`/api/notes/${note.id}`);
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.title).toBe('Persistence Check');
  });
});

// ---------------------------------------------------------------------------
// Epic 8: Mobile-First UI & Design System
// ---------------------------------------------------------------------------

test.describe('US-8.1: Use the App Comfortably on a Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('home page renders without horizontal scroll at 375px', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('new note page renders without horizontal scroll at 375px', async ({ page }) => {
    await page.goto('/notes/new');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

test.describe('US-8.2: Submit and Delete Buttons Are Visually Distinct', () => {
  let noteId: number;

  test.beforeEach(async () => {
    await cleanAllNotes();
    const n = await createNoteViaAPI('Button Test Note');
    noteId = n.id;
  });

  test.afterEach(async () => {
    await cleanAllNotes();
  });

  test('Save button and Delete button are both visible on edit page', async ({ page }) => {
    await page.goto(`/notes/${noteId}/edit`);
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('.btnDelete')).toBeVisible();
  });
});

test.describe('US-8.3: All Form Inputs Are Accessible', () => {
  test('all inputs on new note form have associated labels', async ({ page }) => {
    await page.goto('/notes/new');
    await expect(page.locator('label[for="title"]')).toBeVisible();
    await expect(page.locator('label[for="body"]')).toBeVisible();
  });

  test('aria-invalid is set on title input when validation fails', async ({ page }) => {
    await page.goto('/notes/new');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#title')).toHaveAttribute('aria-invalid', 'true');
  });
});

// ---------------------------------------------------------------------------
// Epic 9: Iframe Compatibility & Port Binding
// ---------------------------------------------------------------------------

test.describe('US-9.1: App Renders Inside an Embedded Preview Iframe', () => {
  test('HTTP response does not include X-Frame-Options: DENY', async ({ request }) => {
    const res = await request.get('/');
    const xfo = res.headers()['x-frame-options'];
    // Either absent, or not DENY
    if (xfo) {
      expect(xfo.toUpperCase()).not.toBe('DENY');
    }
  });

  test('CSP header does not contain frame-ancestors none', async ({ request }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy'];
    if (csp) {
      expect(csp).not.toContain("frame-ancestors 'none'");
    }
  });
});

test.describe('US-9.2: App Is Reachable on Port 3000', () => {
  test('app is reachable at http://localhost:3000', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/health');
    expect(res.status()).toBe(200);
  });
});
