/**
 * QuickNotes – UAT Playwright Test Suite
 * Covers every acceptance criterion from the user stories.
 *
 * Conventions:
 *  - One describe() per user story (story_id + title)
 *  - One test() per acceptance criterion
 *  - Tests are independent: each creates its own state via the API
 *  - API helpers are defined at the top for reuse
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:3000';

interface NotePayload {
  title: string;
  body?: string;
  pinned?: boolean;
}

interface Note {
  id: number;
  title: string;
  body: string | null;
  pinned: boolean;
  created_at: string;
}

async function apiCreateNote(request: APIRequestContext, payload: NotePayload): Promise<Note> {
  const res = await request.post(`${BASE}/api/notes`, {
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.status()).toBe(201);
  return res.json() as Promise<Note>;
}

async function apiDeleteNote(request: APIRequestContext, id: number): Promise<void> {
  await request.delete(`${BASE}/api/notes/${id}`);
}

async function apiDeleteAllNotes(request: APIRequestContext): Promise<void> {
  const res = await request.get(`${BASE}/api/notes`);
  const notes: Note[] = await res.json();
  for (const note of notes) {
    await apiDeleteNote(request, note.id);
  }
}

// ---------------------------------------------------------------------------
// US-0.1 – View the Note List
// ---------------------------------------------------------------------------

test.describe('US-0.1 – View the Note List', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('navigating to `/` renders a list of all notes stored in the database', async ({
    page,
    request,
  }) => {
    const n1 = await apiCreateNote(request, { title: 'Alpha Note' });
    const n2 = await apiCreateNote(request, { title: 'Beta Note' });

    await page.goto('/');

    await expect(page.locator(`[data-note-id="${n1.id}"]`)).toBeVisible();
    await expect(page.locator(`[data-note-id="${n2.id}"]`)).toBeVisible();
  });

  test('each note entry displays its `title` so the note is identifiable at a glance', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Identifiable Title' });

    await page.goto('/');

    const card = page.locator(`[data-note-id="${note.id}"]`);
    await expect(card).toContainText('Identifiable Title');
  });

  test('pinned notes are displayed with a visible pinned indicator distinct from un-pinned notes', async ({
    page,
    request,
  }) => {
    const pinned = await apiCreateNote(request, { title: 'Pinned Note', pinned: true });
    const unpinned = await apiCreateNote(request, { title: 'Unpinned Note', pinned: false });

    await page.goto('/');

    // Pinned card must have the badge / aria-label
    const pinnedCard = page.locator(`[data-note-id="${pinned.id}"]`);
    await expect(pinnedCard.locator('[aria-label="Pinned"]')).toBeVisible();

    // Unpinned card must NOT have the badge
    const unpinnedCard = page.locator(`[data-note-id="${unpinned.id}"]`);
    await expect(unpinnedCard.locator('[aria-label="Pinned"]')).toHaveCount(0);
  });

  test('notes are ordered: pinned notes first (newest-first within pinned), then un-pinned notes (newest-first)', async ({
    page,
    request,
  }) => {
    // Create in order: unpinned-old, unpinned-new, pinned-old, pinned-new
    const unpinnedOld = await apiCreateNote(request, { title: 'Unpinned Old', pinned: false });
    await new Promise((r) => setTimeout(r, 20));
    const unpinnedNew = await apiCreateNote(request, { title: 'Unpinned New', pinned: false });
    await new Promise((r) => setTimeout(r, 20));
    const pinnedOld = await apiCreateNote(request, { title: 'Pinned Old', pinned: true });
    await new Promise((r) => setTimeout(r, 20));
    const pinnedNew = await apiCreateNote(request, { title: 'Pinned New', pinned: true });

    await page.goto('/');

    const cards = page.locator('[data-note-id]');
    const ids = await cards.evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('data-note-id')))
    );

    // Expected order: pinnedNew, pinnedOld, unpinnedNew, unpinnedOld
    expect(ids).toEqual([pinnedNew.id, pinnedOld.id, unpinnedNew.id, unpinnedOld.id]);
  });

  test('each note card/row is a tappable link that navigates to `/notes/[id]/edit`', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Clickable Note' });

    await page.goto('/');

    const card = page.locator(`[data-note-id="${note.id}"]`);
    await expect(card).toHaveAttribute('href', `/notes/${note.id}/edit`);

    await card.click();
    await expect(page).toHaveURL(`/notes/${note.id}/edit`);
  });

  test("a 'New note' button / link pointing to `/notes/new` is always visible regardless of list content", async ({
    page,
    request,
  }) => {
    // With notes
    await apiCreateNote(request, { title: 'Existing Note' });
    await page.goto('/');
    await expect(page.locator('a[href="/notes/new"]').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// US-0.2 – See the Empty State When No Notes Exist
// ---------------------------------------------------------------------------

test.describe('US-0.2 – See the Empty State When No Notes Exist', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test("when the notes table has zero rows, the list page renders the text 'No notes yet'", async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('text=No notes yet.')).toBeVisible();
  });

  test("the empty state includes a 'New note' button that navigates to `/notes/new`", async ({
    page,
  }) => {
    await page.goto('/');
    const newNoteLink = page.locator('a[href="/notes/new"]').first();
    await expect(newNoteLink).toBeVisible();
    await newNoteLink.click();
    await expect(page).toHaveURL('/notes/new');
  });

  test('no note cards are rendered in the empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-note-id]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// US-0.3 – Newly Created Note Appears at the Top of the List
// ---------------------------------------------------------------------------

test.describe('US-0.3 – Newly Created Note Appears at the Top of the List', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('after a successful POST /api/notes, the browser redirects to `/`', async ({ page }) => {
    await page.goto('/notes/new');
    await page.fill('#title', 'Redirect Test Note');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('the newly created note is visible on the list without a page refresh', async ({ page }) => {
    await page.goto('/notes/new');
    await page.fill('#title', 'Freshly Created Note');
    await page.fill('#body', 'some body text');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-title="Freshly Created Note"]')).toBeVisible();
  });

  test('if the note is not pinned, it appears first among un-pinned notes (newest-first)', async ({
    page,
    request,
  }) => {
    await apiCreateNote(request, { title: 'Older Unpinned Note', pinned: false });
    await new Promise((r) => setTimeout(r, 20));

    await page.goto('/notes/new');
    await page.fill('#title', 'Newest Unpinned Note');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    const cards = page.locator('[data-note-id]');
    // The very first card should be the newly created note (newest among un-pinned)
    await expect(cards.first()).toHaveAttribute('data-title', 'Newest Unpinned Note');
  });
});

// ---------------------------------------------------------------------------
// US-0.4 – Updated Note Title Reflected in the List
// ---------------------------------------------------------------------------

test.describe('US-0.4 – Updated Note Title Reflected in the List', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('after a successful PUT /api/notes/[id], the browser redirects to `/`', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Original Title' });
    await page.goto(`/notes/${note.id}/edit`);
    await page.fill('#title', 'Updated Title Redirect');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('the note card on the list shows the new title (not the old one)', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Before Update' });
    await page.goto(`/notes/${note.id}/edit`);
    await page.fill('#title', 'After Update');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    await expect(page.locator('[data-title="After Update"]')).toBeVisible();
    await expect(page.locator('[data-title="Before Update"]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// US-0.5 – Deleted Note No Longer Appears in the List
// ---------------------------------------------------------------------------

test.describe('US-0.5 – Deleted Note No Longer Appears in the List', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('after a successful DELETE /api/notes/[id], the browser redirects to `/`', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Note to Delete' });
    await page.goto(`/notes/${note.id}/edit`);
    await page.click('button[aria-label="Delete note"]');
    await page.click('button[aria-label="Confirm delete — this cannot be undone"]');
    await expect(page).toHaveURL('/');
  });

  test("the deleted note's card no longer appears in the list after redirect", async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Gone After Delete' });
    await page.goto(`/notes/${note.id}/edit`);
    await page.click('button[aria-label="Delete note"]');
    await page.click('button[aria-label="Confirm delete — this cannot be undone"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator(`[data-note-id="${note.id}"]`)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// US-1.1 – Filter Notes by Partial Title
// ---------------------------------------------------------------------------

test.describe('US-1.1 – Filter Notes by Partial Title', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('a search input is rendered at the top of the list view (`/`)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#search')).toBeVisible();
  });

  test('typing characters into the search input narrows the list to matching notes (case-insensitive substring match)', async ({
    page,
    request,
  }) => {
    await apiCreateNote(request, { title: 'Meeting Notes' });
    await apiCreateNote(request, { title: 'Grocery List' });
    await apiCreateNote(request, { title: 'meeting recap' }); // lowercase — should match

    await page.goto('/');
    await page.fill('#search', 'meeting');

    await expect(page.locator('[data-title="Meeting Notes"]')).toBeVisible();
    await expect(page.locator('[data-title="meeting recap"]')).toBeVisible();
    await expect(page.locator('[data-title="Grocery List"]')).not.toBeVisible();
  });

  test('only notes whose title matches are shown; non-matching notes are hidden', async ({
    page,
    request,
  }) => {
    await apiCreateNote(request, { title: 'Alpha Document' });
    await apiCreateNote(request, { title: 'Beta Document' });
    await apiCreateNote(request, { title: 'Gamma Report' });

    await page.goto('/');
    await page.fill('#search', 'Document');

    await expect(page.locator('[data-title="Alpha Document"]')).toBeVisible();
    await expect(page.locator('[data-title="Beta Document"]')).toBeVisible();
    await expect(page.locator('[data-title="Gamma Report"]')).not.toBeVisible();
  });

  test('clearing the search input (empty string) restores the full, unfiltered list', async ({
    page,
    request,
  }) => {
    await apiCreateNote(request, { title: 'Note A' });
    await apiCreateNote(request, { title: 'Note B' });

    await page.goto('/');
    await page.fill('#search', 'Note A');
    await expect(page.locator('[data-title="Note B"]')).not.toBeVisible();

    // Clear the search
    await page.fill('#search', '');
    await page.dispatchEvent('#search', 'input');

    await expect(page.locator('[data-title="Note A"]')).toBeVisible();
    await expect(page.locator('[data-title="Note B"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// US-1.2 – See Empty State When Search Matches Nothing
// ---------------------------------------------------------------------------

test.describe('US-1.2 – See Empty State When Search Matches Nothing', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test("when a non-empty search string matches zero notes, the empty state message is displayed", async ({
    page,
    request,
  }) => {
    await apiCreateNote(request, { title: 'Real Note' });

    await page.goto('/');
    await page.fill('#search', 'xyzzy_no_match');
    await page.dispatchEvent('#search', 'input');

    // Either "No notes yet." or "No notes match your search." must be visible
    const emptyMsg = page.locator('#empty-search');
    await expect(emptyMsg).toBeVisible();
    await expect(emptyMsg).toContainText('No notes match your search.');
  });

  test('no note cards are rendered in this filtered empty state', async ({ page, request }) => {
    await apiCreateNote(request, { title: 'Only Note' });

    await page.goto('/');
    await page.fill('#search', 'absolutely_no_match_string_12345');
    await page.dispatchEvent('#search', 'input');

    const visibleCards = page.locator('[data-note-id]').filter({ hasNot: page.locator('[style*="display: none"]') });
    // All cards should be hidden (display:none set by the client filter script)
    const cards = page.locator('[data-note-id]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).not.toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// US-2.1 – Create a New Note with Title and Body
// ---------------------------------------------------------------------------

test.describe('US-2.1 – Create a New Note with Title and Body', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('navigating to `/notes/new` renders a blank form with the expected fields', async ({
    page,
  }) => {
    await page.goto('/notes/new');

    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#body')).toBeVisible();
    await expect(page.locator('#pinned')).toBeVisible();
    // pinned checkbox unchecked by default
    await expect(page.locator('#pinned')).not.toBeChecked();
    // submit CTA
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("filling title='Groceries' and body='milk, eggs' and submitting creates the note and redirects to `/`", async ({
    page,
  }) => {
    await page.goto('/notes/new');
    await page.fill('#title', 'Groceries');
    await page.fill('#body', 'milk, eggs');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test("the new 'Groceries' note is visible on the list", async ({ page }) => {
    await page.goto('/notes/new');
    await page.fill('#title', 'Groceries');
    await page.fill('#body', 'milk, eggs');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-title="Groceries"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// US-2.2 – Create a Pinned Note
// ---------------------------------------------------------------------------

test.describe('US-2.2 – Create a Pinned Note', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('checking the `pinned` checkbox and submitting creates a pinned note', async ({
    page,
    request,
  }) => {
    await page.goto('/notes/new');
    await page.fill('#title', 'Pinned Creation Test');
    await page.check('#pinned');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Verify via API that the note is actually pinned
    const res = await request.get(`${BASE}/api/notes`);
    const notes: Note[] = await res.json();
    const created = notes.find((n) => n.title === 'Pinned Creation Test');
    expect(created).toBeDefined();
    expect(created!.pinned).toBe(true);
  });

  test('after redirect to `/`, the new note appears in the pinned section at the top of the list', async ({
    page,
    request,
  }) => {
    // Pre-create an un-pinned note so we have something to compare against
    await apiCreateNote(request, { title: 'Regular Note', pinned: false });

    await page.goto('/notes/new');
    await page.fill('#title', 'Top Pinned Note');
    await page.check('#pinned');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Pinned note should appear before unpinned note
    const allCardTitles = await page
      .locator('[data-note-id]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-title')));
    expect(allCardTitles[0]).toBe('Top Pinned Note');
  });

  test('the pinned indicator is visible on the note card', async ({ page }) => {
    await page.goto('/notes/new');
    await page.fill('#title', 'Badge Pinned Note');
    await page.check('#pinned');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    const card = page.locator('[data-title="Badge Pinned Note"]');
    await expect(card.locator('[aria-label="Pinned"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// US-2.3 – Block Submission When Title Is Empty
// ---------------------------------------------------------------------------

test.describe('US-2.3 – Block Submission When Title Is Empty', () => {
  test('if the title input is empty on submit, no API call is made', async ({ page }) => {
    await page.goto('/notes/new');

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/notes') && req.method() === 'POST') {
        apiCalled = true;
      }
    });

    // Leave title empty, click submit
    await page.click('button[type="submit"]');
    // Small wait to confirm no request was fired
    await page.waitForTimeout(300);

    expect(apiCalled).toBe(false);
  });

  test("an inline validation message 'Title is required' is displayed beneath the title input", async ({
    page,
  }) => {
    await page.goto('/notes/new');
    await page.click('button[type="submit"]');
    await expect(page.locator('#title-error')).toBeVisible();
    await expect(page.locator('#title-error')).toContainText('Title is required');
  });

  test('the form stays on screen with all other field values intact', async ({ page }) => {
    await page.goto('/notes/new');
    await page.fill('#body', 'body content preserved');
    await page.click('button[type="submit"]');

    // Still on the same page
    await expect(page).toHaveURL('/notes/new');
    // Body content preserved
    await expect(page.locator('#body')).toHaveValue('body content preserved');
  });

  test('entering a valid title and resubmitting proceeds normally', async ({ page }) => {
    await page.goto('/notes/new');
    // First attempt — empty title
    await page.click('button[type="submit"]');
    await expect(page.locator('#title-error')).toBeVisible();

    // Fill title and resubmit
    await page.fill('#title', 'Recovery Title');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });
});

// ---------------------------------------------------------------------------
// US-3.1 – Open a Note and See Its Current Values Pre-filled
// ---------------------------------------------------------------------------

test.describe('US-3.1 – Open a Note and See Its Current Values Pre-filled', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('clicking a note card on `/` navigates to `/notes/[id]/edit`', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Navigation Test' });
    await page.goto('/');
    await page.locator(`[data-note-id="${note.id}"]`).click();
    await expect(page).toHaveURL(`/notes/${note.id}/edit`);
  });

  test("the title input is pre-filled with the note's current `title`", async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Pre-filled Title' });
    await page.goto(`/notes/${note.id}/edit`);
    await expect(page.locator('#title')).toHaveValue('Pre-filled Title');
  });

  test("the body textarea is pre-filled with the note's current `body`", async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Has Body', body: 'pre-filled body text' });
    await page.goto(`/notes/${note.id}/edit`);
    await expect(page.locator('#body')).toHaveValue('pre-filled body text');
  });

  test('the pinned checkbox is checked if `note.pinned === true`', async ({ page, request }) => {
    const pinnedNote = await apiCreateNote(request, { title: 'Pinned Check', pinned: true });
    const unpinnedNote = await apiCreateNote(request, { title: 'Unpinned Check', pinned: false });

    await page.goto(`/notes/${pinnedNote.id}/edit`);
    await expect(page.locator('#pinned')).toBeChecked();

    await page.goto(`/notes/${unpinnedNote.id}/edit`);
    await expect(page.locator('#pinned')).not.toBeChecked();
  });
});

// ---------------------------------------------------------------------------
// US-3.2 – Save an Edited Note and See the Updated Title in the List
// ---------------------------------------------------------------------------

test.describe('US-3.2 – Save an Edited Note and See the Updated Title in the List', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test("changing the title value and clicking 'Save' calls PUT /api/notes/[id]", async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Before Edit' });
    await page.goto(`/notes/${note.id}/edit`);

    let putCalled = false;
    page.on('request', (req) => {
      if (req.url().includes(`/api/notes/${note.id}`) && req.method() === 'PUT') {
        putCalled = true;
      }
    });

    await page.fill('#title', 'After Edit');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    expect(putCalled).toBe(true);
  });

  test('on 200 response, the browser redirects to `/`', async ({ page, request }) => {
    const note = await apiCreateNote(request, { title: 'Redirect On Save' });
    await page.goto(`/notes/${note.id}/edit`);
    await page.fill('#title', 'Redirected Title');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('the note card on the list shows the updated title', async ({ page, request }) => {
    const note = await apiCreateNote(request, { title: 'Old Title' });
    await page.goto(`/notes/${note.id}/edit`);
    await page.fill('#title', 'New Title Shown In List');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-title="New Title Shown In List"]')).toBeVisible();
    await expect(page.locator('[data-title="Old Title"]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// US-3.3 – Toggle Pinned Status on an Existing Note
// ---------------------------------------------------------------------------

test.describe('US-3.3 – Toggle Pinned Status on an Existing Note', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('checking or unchecking the `pinned` checkbox and saving updates the pinned value', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Toggle Pin Note', pinned: false });
    await page.goto(`/notes/${note.id}/edit`);
    await expect(page.locator('#pinned')).not.toBeChecked();

    // Pin it
    await page.check('#pinned');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Verify via API
    const res = await request.get(`${BASE}/api/notes/${note.id}`);
    const updated: Note = await res.json();
    expect(updated.pinned).toBe(true);
  });

  test('on return to `/`, the note appears in the correct section based on the new value', async ({
    page,
    request,
  }) => {
    // Start unpinned alongside another unpinned note
    await apiCreateNote(request, { title: 'Another Unpinned', pinned: false });
    const note = await apiCreateNote(request, { title: 'Will Be Pinned', pinned: false });

    await page.goto(`/notes/${note.id}/edit`);
    await page.check('#pinned');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // The pinned note should be first
    const firstCard = page.locator('[data-note-id]').first();
    await expect(firstCard).toHaveAttribute('data-title', 'Will Be Pinned');
    // It should show the pinned badge
    await expect(firstCard.locator('[aria-label="Pinned"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// US-3.4 – See Not-Found State for a Missing Note
// ---------------------------------------------------------------------------

test.describe('US-3.4 – See Not-Found State for a Missing Note', () => {
  test("navigating to `/notes/[id]/edit` for a non-existent `id` renders 'Note not found.'", async ({
    page,
  }) => {
    await page.goto('/notes/999999999/edit');
    await expect(page.locator('h1')).toContainText('Note not found.');
  });

  test('the form is not rendered in the not-found state', async ({ page }) => {
    await page.goto('/notes/999999999/edit');
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('a link back to `/` is provided on the not-found page', async ({ page }) => {
    await page.goto('/notes/999999999/edit');
    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible();
  });

  test('a non-integer `id` segment in the URL also triggers the not-found state', async ({
    page,
  }) => {
    await page.goto('/notes/abc/edit');
    await expect(page.locator('h1')).toContainText('Note not found.');
  });
});

// ---------------------------------------------------------------------------
// US-4.1 – Delete a Note with Confirmation
// ---------------------------------------------------------------------------

test.describe('US-4.1 – Delete a Note with Confirmation', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test("a 'Delete' button is visible on `/notes/[id]/edit` alongside the Save CTA", async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Delete Button Visible' });
    await page.goto(`/notes/${note.id}/edit`);
    await expect(page.locator('button[aria-label="Delete note"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("clicking 'Delete' triggers a confirmation step before any API call is made", async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Confirm Before Delete' });
    await page.goto(`/notes/${note.id}/edit`);

    let deleteCalled = false;
    page.on('request', (req) => {
      if (req.url().includes(`/api/notes/${note.id}`) && req.method() === 'DELETE') {
        deleteCalled = true;
      }
    });

    // First click — should show confirm state, NOT call API
    await page.click('button[aria-label="Delete note"]');
    await page.waitForTimeout(200);
    expect(deleteCalled).toBe(false);

    // Confirm button should now be visible
    await expect(
      page.locator('button[aria-label="Confirm delete — this cannot be undone"]')
    ).toBeVisible();
  });

  test('confirming the deletion redirects to `/`', async ({ page, request }) => {
    const note = await apiCreateNote(request, { title: 'Confirm Deletion Redirect' });
    await page.goto(`/notes/${note.id}/edit`);
    await page.click('button[aria-label="Delete note"]');
    await page.click('button[aria-label="Confirm delete — this cannot be undone"]');
    await expect(page).toHaveURL('/');
  });

  test('the deleted note no longer appears in the list after redirect', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Truly Gone Note' });
    await page.goto(`/notes/${note.id}/edit`);
    await page.click('button[aria-label="Delete note"]');
    await page.click('button[aria-label="Confirm delete — this cannot be undone"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator(`[data-note-id="${note.id}"]`)).toHaveCount(0);
  });

  test('cancelling the confirmation returns the form to its normal state', async ({
    page,
    request,
  }) => {
    const note = await apiCreateNote(request, { title: 'Cancel Delete Test' });
    await page.goto(`/notes/${note.id}/edit`);

    // First click — enter confirming state
    await page.click('button[aria-label="Delete note"]');
    await expect(
      page.locator('button[aria-label="Confirm delete — this cannot be undone"]')
    ).toBeVisible();

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Delete button should revert to idle state
    await expect(page.locator('button[aria-label="Delete note"]')).toBeVisible();
    // Cancel button should be gone
    await expect(page.locator('button:has-text("Cancel")')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// US-5.1 – Retrieve All Notes via API
// ---------------------------------------------------------------------------

test.describe('US-5.1 – Retrieve All Notes via API', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('GET /api/notes returns HTTP 200 with Content-Type: application/json', async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/notes`);
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('the response body is a JSON array of Note objects', async ({ request }) => {
    await apiCreateNote(request, { title: 'Array Test Note' });
    const res = await request.get(`${BASE}/api/notes`);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    // Each item should have expected Note fields
    const note = body[0];
    expect(note).toHaveProperty('id');
    expect(note).toHaveProperty('title');
    expect(note).toHaveProperty('pinned');
    expect(note).toHaveProperty('created_at');
  });

  test('GET /api/notes?q=<string> returns only notes whose title contains the string (case-insensitive)', async ({
    request,
  }) => {
    await apiCreateNote(request, { title: 'Alpha Project' });
    await apiCreateNote(request, { title: 'Beta Workflow' });
    await apiCreateNote(request, { title: 'alpha recap' }); // lowercase

    const res = await request.get(`${BASE}/api/notes?q=alpha`);
    expect(res.status()).toBe(200);
    const notes: Note[] = await res.json();
    const titles = notes.map((n) => n.title);
    expect(titles).toContain('Alpha Project');
    expect(titles).toContain('alpha recap');
    expect(titles).not.toContain('Beta Workflow');
  });
});

// ---------------------------------------------------------------------------
// US-5.2 – Create a Note via API
// ---------------------------------------------------------------------------

test.describe('US-5.2 – Create a Note via API', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('POST /api/notes with a valid body returns 201 with the created Note object', async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/api/notes`, {
      data: { title: 'API Created Note', body: 'body content', pinned: false },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(201);
    const note: Note = await res.json();
    expect(note.id).toBeDefined();
    expect(note.title).toBe('API Created Note');
    expect(note.body).toBe('body content');
    expect(note.pinned).toBe(false);
  });

  test("POST /api/notes with a missing or empty `title` returns 400 with { error: 'TITLE_REQUIRED' }", async ({
    request,
  }) => {
    // Missing title
    const res1 = await request.post(`${BASE}/api/notes`, {
      data: { body: 'no title here' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res1.status()).toBe(400);
    const body1 = await res1.json();
    expect(body1.error).toBe('TITLE_REQUIRED');

    // Empty title
    const res2 = await request.post(`${BASE}/api/notes`, {
      data: { title: '   ', body: 'whitespace title' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res2.status()).toBe(400);
    const body2 = await res2.json();
    expect(body2.error).toBe('TITLE_REQUIRED');
  });

  test("POST /api/notes with malformed JSON returns 400 with { error: 'BAD_REQUEST' }", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/api/notes`, {
      data: 'this is not json{{{',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('BAD_REQUEST');
  });
});

// ---------------------------------------------------------------------------
// US-5.3 – Fetch, Update, and Delete a Single Note via API
// ---------------------------------------------------------------------------

test.describe('US-5.3 – Fetch, Update, and Delete a Single Note via API', () => {
  test.beforeEach(async ({ request }) => {
    await apiDeleteAllNotes(request);
  });

  test('GET /api/notes/[id] for a valid existing id returns 200 with the Note object', async ({
    request,
  }) => {
    const created = await apiCreateNote(request, { title: 'Fetch Single Note' });
    const res = await request.get(`${BASE}/api/notes/${created.id}`);
    expect(res.status()).toBe(200);
    const note: Note = await res.json();
    expect(note.id).toBe(created.id);
    expect(note.title).toBe('Fetch Single Note');
  });

  test("GET /api/notes/[id] for a non-existent id returns 404 with { error: 'NOTE_NOT_FOUND' }", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/notes/999999999`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('NOTE_NOT_FOUND');
  });

  test('PUT /api/notes/[id] with valid body returns 200 with the updated Note object', async ({
    request,
  }) => {
    const created = await apiCreateNote(request, { title: 'Before PUT' });
    const res = await request.put(`${BASE}/api/notes/${created.id}`, {
      data: { title: 'After PUT', body: 'updated body', pinned: true },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(200);
    const updated: Note = await res.json();
    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('After PUT');
    expect(updated.body).toBe('updated body');
    expect(updated.pinned).toBe(true);
  });

  test("PUT /api/notes/[id] with empty title returns 400 with { error: 'TITLE_REQUIRED' }", async ({
    request,
  }) => {
    const created = await apiCreateNote(request, { title: 'PUT Empty Title Test' });
    const res = await request.put(`${BASE}/api/notes/${created.id}`, {
      data: { title: '' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('TITLE_REQUIRED');
  });

  test('DELETE /api/notes/[id] for an existing note returns 204 with no response body', async ({
    request,
  }) => {
    const created = await apiCreateNote(request, { title: 'To Be Deleted' });
    const res = await request.delete(`${BASE}/api/notes/${created.id}`);
    expect(res.status()).toBe(204);
    const text = await res.text();
    expect(text).toBe('');
  });

  test("DELETE /api/notes/[id] for a non-existent id returns 404 with { error: 'NOTE_NOT_FOUND' }", async ({
    request,
  }) => {
    const res = await request.delete(`${BASE}/api/notes/999999999`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('NOTE_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// US-6.1 – Confirm App Liveness via Health Endpoint
// ---------------------------------------------------------------------------

test.describe('US-6.1 – Confirm App Liveness via Health Endpoint', () => {
  test('GET /api/health returns HTTP 200 with Content-Type: application/json', async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/health`);
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('the response body is exactly {"status":"ok"}', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });
});

// ---------------------------------------------------------------------------
// US-9.1 – App Renders Inside an Embedded Preview Iframe
// ---------------------------------------------------------------------------

test.describe('US-9.1 – App Renders Inside an Embedded Preview Iframe', () => {
  test('HTTP responses do not include an X-Frame-Options: DENY header', async ({ request }) => {
    const res = await request.get(`${BASE}/`);
    const xfo = res.headers()['x-frame-options'];
    // Must not be set to DENY (may be absent or set to something permissive)
    expect((xfo ?? '').toUpperCase()).not.toBe('DENY');
  });

  test('next.config.mjs exists at the project root; next.config.ts does not exist', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const root = path.resolve(process.cwd());

    expect(fs.existsSync(path.join(root, 'next.config.mjs'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'next.config.ts'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// US-9.2 – App Is Reachable on Port 3000
// ---------------------------------------------------------------------------

test.describe('US-9.2 – App Is Reachable on Port 3000', () => {
  test('the app is reachable at http://localhost:3000', async ({ request }) => {
    const res = await request.get('http://localhost:3000/');
    expect(res.status()).toBe(200);
  });
});
